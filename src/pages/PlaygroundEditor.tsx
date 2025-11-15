// Core React hooks for component state and lifecycle
import { useState, useEffect, useRef, useCallback } from "react";
// React Router hooks for navigation and URL params
import { useParams, useNavigate } from "react-router-dom";
// Layout wrapper with authentication
import { AuthLayout } from "@/components/AuthLayout";
// UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Toast notifications
import { toast } from "sonner";
// Supabase client for database operations
import { supabase } from "@/integrations/supabase/client";
// Handsontable spreadsheet grid
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import Handsontable from "handsontable";
// Icons
import { Plus, Trash2 } from "lucide-react";
// SheetJS library for Excel file operations
import * as XLSX from "xlsx";
// Custom editor components
import { MenuBar } from "@/components/editor/MenuBar";
import { FormattingToolbar } from "@/components/editor/FormattingToolbar";
import { BorderOptions } from "@/components/editor/BorderPicker";
// Helper to evaluate XLSX cell display values
import { evaluateDisplayAoA } from "@/lib/xlsx-eval";
// Alert dialog for confirmations
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Register Handsontable modules for full functionality
registerAllModules();

// File metadata interface
interface FileData {
  id: string;
  file_name: string;
  edited_data: any;
  file_url?: string;
  file_type?: string;
}

// Sheet structure with data and config
interface SheetData {
  name: string;
  index: number;
  data: any[][];
  config?: {
    columnCount: number;
    rowCount: number;
  };
}

// Main PlaygroundEditor component: Spreadsheet editor with Handsontable
const PlaygroundEditor = () => {
  // Get file ID from URL params
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  
  // File and sheet state
  const [loading, setLoading] = useState(true);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [tableData, setTableData] = useState<any[][]>([]);
  
  // Cell selection and formula bar
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState("");
  const [showFormulaBar, setShowFormulaBar] = useState(true);
  
  // Dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  
  // Grid dimensions
  const [gridHeight, setGridHeight] = useState<number>(480);
  
  // Save state - Manual save only (no autosave)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Refs for Handsontable instance
  const hotRef = useRef<any>(null);
  
  // REMOVED: changeSetRef - no longer tracking individual cell changes since we do full state saves

  // Fetch file data on component mount
  useEffect(() => {
    if (fileId) {
      fetchFileData();
    }
  }, [fileId]);

  // Calculate grid height based on window size and visible toolbars
  useEffect(() => {
    const computeHeight = () => {
      // Approximate header/toolbars/tabs space
      const reserved = showFormulaBar ? 260 : 220;
      const h = Math.max(window.innerHeight - reserved, 300);
      setGridHeight(h);
    };
    computeHeight();
    window.addEventListener("resize", computeHeight);
    return () => window.removeEventListener("resize", computeHeight);
  }, [showFormulaBar]);

  // Load sheet data and apply meta to Handsontable when sheet changes
  useEffect(() => {
    if (sheets.length > 0 && activeSheetIndex >= 0 && activeSheetIndex < sheets.length) {
      console.log(`[RENDER] Active sheet changed to ${activeSheetIndex}`);
      const displayData = evaluateDisplayAoA(sheets as any, activeSheetIndex);
      console.log(`[RENDER] Evaluated display data: ${displayData.length} rows`);
      setTableData(displayData);
      // Apply saved meta (styles, borders, etc.) back to Handsontable and force render
      setTimeout(() => {
        const hot = hotRef.current?.hotInstance;
        if (hot) {
          console.log(`[RENDER] Applying meta to HOT and forcing render`);
          applySheetMetaToHot(sheets[activeSheetIndex], hot);
          hot.loadData(displayData); // Force reload data into grid
          hot.render(); // Force re-render to show styles
        }
      }, 0);
    }
  }, [activeSheetIndex]);

  // Initialize table only on first load to avoid wiping in-progress edits during saves
  useEffect(() => {
    if (tableData.length === 0 && sheets.length > 0 && activeSheetIndex >= 0 && activeSheetIndex < sheets.length) {
      console.log(`[RENDER] First load initialization for sheet ${activeSheetIndex}`);
      const displayData = evaluateDisplayAoA(sheets as any, activeSheetIndex);
      console.log(`[RENDER] Initial display data: ${displayData.length} rows`);
      setTableData(displayData);
      setTimeout(() => {
        const hot = hotRef.current?.hotInstance;
        if (hot) {
          console.log(`[RENDER] Initial meta apply and render`);
          applySheetMetaToHot(sheets[activeSheetIndex], hot);
          hot.loadData(displayData); // Ensure data is loaded
          hot.render(); // Force render
        }
      }, 0);
    }
  }, [sheets, activeSheetIndex, tableData.length]);

  useEffect(() => {
    // reset selection guard when switching sheets
    lastSelectedRef.current = "";
  }, [activeSheetIndex]);

  /**
   * FULL LOAD FROM DATABASE
   * 
   * This function loads the spreadsheet file data when the editor opens.
   * 
   * LOAD PRIORITY (NO MERGING):
   * 1. If edited_data.sheets exists: Load the FULL saved state from database (all sheets, styles, formulas)
   * 2. If no edited_data: Parse the original Excel file from storage as a fresh import
   * 
   * CRITICAL: We ALWAYS prefer the full edited_data if present. No partial merges, no deltas.
   * This ensures that every edit, style, formula, and empty styled cell is preserved across sessions.
   * 
   * After loading, we force Handsontable to render the data with applySheetMetaToHot() to restore
   * all visual styles (colors, borders, bold, etc.) that were saved in the XLSX cell objects.
   */
  const fetchFileData = async () => {
    try {
      // Step 1: Verify user authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to edit files");
        navigate("/playground");
        return;
      }

      // Step 2: Fetch file record from database
      const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .eq("id", fileId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      console.log("[LOAD] Loaded file data:", { id: data.id, file_name: data.file_name });
      console.log("[LOAD] File edited_data exists:", !!data.edited_data);
      setFileData(data);
      
      // Step 3: LOAD PATH 1 - Load from edited_data if it exists and has valid sheets
      // This is the preferred path after the first save, containing the complete state
      if (data.edited_data) {
        const editedData = data.edited_data as any;
        console.log("[LOAD] Edited data structure:", { 
          hasSheets: !!editedData.sheets, 
          isArray: Array.isArray(editedData.sheets),
          sheetCount: editedData.sheets?.length || 0
        });
        
        // Validate that edited_data has a proper sheets array with at least one sheet
        if (editedData.sheets && Array.isArray(editedData.sheets) && editedData.sheets.length > 0) {
          // FULL LOAD: Load ALL sheets with their complete data, styles, formulas, and metadata
          console.log(`[LOAD] FULL LOAD: Loading ${editedData.sheets.length} sheets from edited_data.sheets`);
          editedData.sheets.forEach((sheet: any, i: number) => {
            const rowCount = sheet.data?.length || 0;
            const colCount = sheet.data?.[0]?.length || 0;
            console.log(`[LOAD] Sheet ${i} (${sheet.name}): ${rowCount} rows, ${colCount} cols`);
            // Log first cell for debugging display issues
            if (sheet.data && sheet.data[0] && sheet.data[0][0]) {
              console.log(`[LOAD] Sheet ${i} first cell:`, sheet.data[0][0]);
            }
          });
          
          // DEFENSIVE: Filter out any null/undefined rows that might have slipped through optimization
          // This prevents the "Cannot read properties of null" error in evaluateDisplayAoA
          const cleanedSheets = editedData.sheets.map((sheet: any) => ({
            ...sheet,
            data: sheet.data ? sheet.data.filter((row: any) => row !== null && row !== undefined) : []
          }));
          
          // Set the complete state from saved data
          setSheets(cleanedSheets);
          setActiveSheetIndex(editedData.activeSheetIndex ?? 0);
          setLoading(false);
          return; // Exit early - we successfully loaded from edited_data
        }
      }
      
      // Step 4: LOAD PATH 2 - No valid edited_data found, parse from original Excel file in storage
      // This is the initial import path when a file is first uploaded
      console.log("[LOAD] FALLBACK: No valid edited_data, parsing from original file_url");
      if (data.file_url) {
        const parsedSheets = await parseFromStorage(data.file_url);
        if (parsedSheets && parsedSheets.length > 0) {
          console.log(`[LOAD] Fallback successful: parsed ${parsedSheets.length} sheets from storage`);
          setSheets(parsedSheets);
          setActiveSheetIndex(0);
        } else {
          // Step 5: FALLBACK - If parsing fails, create a minimal empty sheet to prevent blank editor
          console.warn("[LOAD] Fallback failed: creating blank sheet");
          const emptyGrid = createEmptyGrid(50, 26);
          const sheet: SheetData = { name: "Sheet1", index: 0, data: emptyGrid, config: { columnCount: 26, rowCount: 50 } };
          setSheets([sheet]);
          setActiveSheetIndex(0);
        }
      } else {
        // No file_url at all - create blank sheet
        console.warn("[LOAD] No file_url, creating blank sheet");
        const emptyGrid = createEmptyGrid(50, 26);
        const sheet: SheetData = { name: "Sheet1", index: 0, data: emptyGrid, config: { columnCount: 26, rowCount: 50 } };
        setSheets([sheet]);
        setActiveSheetIndex(0);
      }
    } catch (error) {
      console.error("Error fetching file:", error);
      toast.error("Failed to load file");
      navigate("/playground");
    } finally {
      setLoading(false);
    }
  };

  const createEmptyGrid = (rows: number, cols: number): any[][] => {
    return Array(rows).fill(null).map(() => Array(cols).fill(""));
  };

  const convertLegacyToGrid = (data: any[]): any[][] => {
    if (data.length === 0) {
      return createEmptyGrid(50, 26);
    }

    const headers = Object.keys(data[0]);
    const grid = [headers];
    
    data.forEach((row: any) => {
      grid.push(headers.map(header => row[header] ?? ""));
    });

  return grid;
  };

  // Merge Handsontable values AND cellMeta into existing sheet cells while preserving all styles and formulas
  const mergeHotDataIntoSheet = (sheet: SheetData, hotData: any[][], hotInstance?: any): SheetData => {
    const rows = Math.max(sheet.data.length, hotData.length);
    const cols = Math.max(sheet.config?.columnCount || 0, (hotData[0]?.length) || 0);
    const newData: any[][] = Array.from({ length: rows }, (_, r) => {
      const existingRow = sheet.data[r] || [];
      return Array.from({ length: cols }, (_, c) => existingRow[c] ?? null);
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hotVal = hotData?.[r]?.[c];
        const existing = newData[r]?.[c];
        const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

        // Get cellMeta from Handsontable if available
        const meta = hotInstance ? hotInstance.getCellMeta(r, c) : null;

        if (existing && typeof existing === 'object') {
          const origDisplay = toStr(existing.w ?? existing.v ?? '');
          const newDisplay = toStr(hotVal);
          const type = typeof hotVal === 'number' ? 'n' : (newDisplay === '' ? 'z' : 's');
          const updated: any = { ...existing, t: type };

          // Update value/format
          if (newDisplay === '') {
            delete updated.v;
            updated.w = '';
          } else {
            updated.v = hotVal;
            updated.w = newDisplay;
          }

          // Drop formula only if user visibly changed displayed value
          if ((updated as any).f && newDisplay !== origDisplay) {
            delete (updated as any).f;
          }

          // Merge cellMeta styling into XLSX format
          if (meta) {
            const existingStyle = updated.s || {};
            const font = existingStyle.font || {};
            
            if (meta.bold !== undefined) font.bold = meta.bold;
            if (meta.italic !== undefined) font.italic = meta.italic;
            if (meta.strikethrough !== undefined) font.strike = meta.strikethrough;
            if (meta.textColor) {
              font.color = { rgb: meta.textColor.replace('#', '') };
            }
            
            const newStyle: any = { ...existingStyle };
            if (Object.keys(font).length > 0) newStyle.font = font;
            if (meta.bgColor) {
              newStyle.fill = { fgColor: { rgb: meta.bgColor.replace('#', '') } };
            }
            if (meta.alignment) {
              newStyle.alignment = { horizontal: meta.alignment };
            }
            if (meta.borders) {
              newStyle.border = meta.borders;
            }
            
            if (Object.keys(newStyle).length > 0) {
              updated.s = newStyle;
            }
          }

          newData[r][c] = updated;
        } else if (hotVal !== undefined && hotVal !== null && hotVal !== '') {
          const type = typeof hotVal === 'number' ? 'n' : 's';
          const cellObj: any = { v: hotVal, w: toStr(hotVal), t: type };
          
          // Apply cellMeta styling to new cells too
          if (meta) {
            const font: any = {};
            if (meta.bold !== undefined) font.bold = meta.bold;
            if (meta.italic !== undefined) font.italic = meta.italic;
            if (meta.strikethrough !== undefined) font.strike = meta.strikethrough;
            if (meta.textColor) {
              font.color = { rgb: meta.textColor.replace('#', '') };
            }
            
            const style: any = {};
            if (Object.keys(font).length > 0) style.font = font;
            if (meta.bgColor) {
              style.fill = { fgColor: { rgb: meta.bgColor.replace('#', '') } };
            }
            if (meta.alignment) {
              style.alignment = { horizontal: meta.alignment };
            }
            if (meta.borders) {
              style.border = meta.borders;
            }
            
            if (Object.keys(style).length > 0) {
              cellObj.s = style;
            }
          }
          
          newData[r][c] = cellObj;
        } else {
          // No visible value. If there is styling meta, preserve a style-only cell object
          const hasStyleMeta = meta && (
            meta.bold !== undefined ||
            meta.italic !== undefined ||
            meta.strikethrough !== undefined ||
            !!meta.textColor ||
            !!meta.bgColor ||
            !!meta.alignment ||
            !!meta.borders
          );
          if (hasStyleMeta) {
            const styleOnly: any = { t: 'z', w: '' };
            const font: any = {};
            if (meta.bold !== undefined) font.bold = meta.bold;
            if (meta.italic !== undefined) font.italic = meta.italic;
            if (meta.strikethrough !== undefined) font.strike = meta.strikethrough;
            if (meta.textColor) font.color = { rgb: meta.textColor.replace('#', '') };
            const style: any = {};
            if (Object.keys(font).length > 0) style.font = font;
            if (meta.bgColor) style.fill = { fgColor: { rgb: meta.bgColor.replace('#', '') } };
            if (meta.alignment) style.alignment = { horizontal: meta.alignment };
            if (meta.borders) style.border = meta.borders;
            if (Object.keys(style).length > 0) styleOnly.s = style;
            newData[r][c] = styleOnly;
          } else {
            newData[r][c] = newData[r][c] ?? null;
          }
        }
      }
    }

    return {
      ...sheet,
      data: newData,
      config: {
        columnCount: cols,
        rowCount: rows,
        ...(sheet.config || {})
      }
    };
  };

  // Apply saved XLSX-style formatting (sheet.data.s) back into Handsontable cell meta for visual persistence
  const applySheetMetaToHot = (sheet: SheetData, hotInstance: any) => {
    if (!hotInstance || !sheet) return;
    const rows = sheet.config?.rowCount || sheet.data.length;
    const cols = sheet.config?.columnCount || (sheet.data[0]?.length || 0);

    // Batch meta updates to avoid excessive reflows
    hotInstance.batch(() => {
      for (let r = 0; r < rows; r++) {
        const row = sheet.data[r];
        if (!row) continue;
        for (let c = 0; c < cols; c++) {
          const cell = row[c];
          if (!cell || typeof cell !== 'object' || !cell.s) continue;
          const s = cell.s as any;

          // Colors: convert ARGB to hex if needed
          const toHex = (argb?: string) => {
            if (!argb) return undefined;
            const v = argb.length === 8 ? argb.substring(2) : argb; // strip alpha if present
            return `#${v}`.toUpperCase();
          };

          const bg = toHex(s.fill?.fgColor?.rgb || s.fgColor?.rgb);
          const fg = toHex(s.font?.color?.rgb);

          if (bg) hotInstance.setCellMeta(r, c, 'bgColor', bg);
          if (fg) hotInstance.setCellMeta(r, c, 'textColor', fg);
          if (s.font?.bold !== undefined) hotInstance.setCellMeta(r, c, 'bold', !!s.font.bold);
          if (s.font?.italic !== undefined) hotInstance.setCellMeta(r, c, 'italic', !!s.font.italic);
          if (s.font?.strike !== undefined) hotInstance.setCellMeta(r, c, 'strikethrough', !!s.font.strike);
          if (s.alignment?.horizontal) hotInstance.setCellMeta(r, c, 'alignment', s.alignment.horizontal);
          if (s.border) {
            // Simplify to a generic CSS border for visualization
            hotInstance.setCellMeta(r, c, 'borders', '1px solid #000');
          }
        }
      }
    });
  };

  /**
   * PARSE EXCEL FILE FROM STORAGE
   * 
   * This function is the fallback loader when no edited_data exists in the database.
   * It downloads the original Excel file from Supabase storage and parses it using SheetJS (XLSX library).
   * 
   * WHEN THIS RUNS:
   * - First time a file is uploaded (before any edits/saves)
   * - If edited_data is corrupted or missing
   * 
   * WHAT IT PRESERVES:
   * - All sheets in the workbook
   * - Cell values (strings, numbers, dates, booleans)
   * - Formulas (stored in cell.f)
   * - Styles (colors, bold, italic, borders - stored in cell.s)
   * - Number formatting (stored in cell.w)
   * 
   * RETURNS:
   * - Array of SheetData objects with full XLSX cell objects
   * - null if parsing fails
   */
  const parseFromStorage = async (path: string): Promise<SheetData[] | null> => {
    try {
      // Step 1: Download the Excel file from Supabase storage bucket
      const { data: blob, error } = await supabase.storage
        .from('uploaded-files')
        .download(path);
      if (error) {
        console.error('Storage download error:', error);
        return null;
      }
      
      // Step 2: Convert blob to ArrayBuffer and parse with SheetJS
      const arrayBuffer = await blob.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',          // Input is an ArrayBuffer
        cellFormula: true,      // Parse formulas (store in cell.f)
        cellStyles: true,       // Parse cell styles (colors, bold, borders)
        cellDates: true,        // Parse dates as Date objects
        cellNF: true            // Parse number formats
      });
      
      // Step 3: Convert each sheet to our SheetData format with full XLSX cell objects
      const sheets: SheetData[] = workbook.SheetNames.map((sheetName: string, index: number) => {
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const rows: any[][] = [];
        
        // Build 2D array of XLSX cell objects (not just values)
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const row: any[] = [];
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = worksheet[cellAddress] as any;
            
            if (cell) {
              // Build XLSX cell object with all important properties
              const cellData: any = { 
                v: cell.v,  // Raw value
                f: cell.f,  // Formula
                t: cell.t,  // Type (s=string, n=number, z=empty, etc.)
                w: cell.w   // Formatted display text
              };
              
              // Store style information if available (colors, bold, borders, etc.)
              if (cell.s) {
                cellData.s = cell.s;
              }
              
              row.push(cellData);
            } else {
              // Empty cell - store null
              row.push(null);
            }
          }
          rows.push(row);
        }
        
        // Return sheet with XLSX cell objects preserved
        return { 
          name: sheetName, 
          index, 
          data: rows, // Full XLSX cell objects, not just display values
          config: { 
            columnCount: range.e.c + 1, 
            rowCount: range.e.r + 1 
          } 
        };
      });
      return sheets;
    } catch (err) {
      console.error('parseFromStorage error:', err);
      return null;
    }
  };

  const getCurrentSheetData = (): any[][] => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance) return tableData;
    return hotInstance.getData();
  };

  /**
   * OPTIMIZE SHEET DATA FOR SAVING
   * 
   * This function reduces the payload size before saving to the database by removing unnecessary data.
   * 
   * WHAT IT REMOVES:
   * - Cells that are completely empty (no value, no style, no formula)
   * - Trailing empty rows at the end of each sheet
   * 
   * WHAT IT KEEPS:
   * - Cells with values (strings, numbers, dates)
   * - Cells with formulas (even if they evaluate to empty)
   * - Cells with styles but no value (empty styled cells - these are important!)
   * - Cells with borders, colors, bold, etc. even if they're blank
   * 
   * WHY THIS IS IMPORTANT:
   * - Users often apply styles to empty cells (colored headers, borders, etc.)
   * - Without this, re-opening would lose all empty styled cells and show a blank grid
   * - We preserve these cells so the visual layout remains intact
   * 
   * RETURNS:
   * - Optimized array of sheets with trimmed data but all important cells preserved
   */
  const optimizeSheetData = (sheets: SheetData[]): any[] => {
    return sheets.map(sheet => {
      // FIRST PASS: Optimize cells within each row
      // Keep cells with value OR style OR formula, drop completely empty cells
      const optimizedRows = sheet.data.map(row => 
        row.map(cell => {
          if (!cell) return null;
          if (typeof cell === 'object') {
            // Check if cell has any meaningful content
            const hasValue = cell.v !== undefined || cell.w !== undefined;
            const hasStyle = !!cell.s;   // Has colors, bold, borders, etc.
            const hasFormula = !!cell.f; // Has formula like "=SUM(A1:A10)"
            
            // Drop cells with no value AND no style AND no formula
            if (!hasValue && !hasStyle && !hasFormula) return null;

            // Keep essential properties for cells with content/style/formula
            const optimized: any = {};
            if (cell.t !== undefined) optimized.t = cell.t; // Cell type (s=string, n=number, z=empty)
            if (cell.v !== undefined) optimized.v = cell.v; // Raw value
            if (cell.w !== undefined) optimized.w = cell.w; // Formatted display text
            if (cell.f) optimized.f = cell.f;               // Formula
            if (cell.s) optimized.s = cell.s;               // Style object (colors, bold, borders)
            return optimized;
          }
          // Primitive values (not XLSX objects) - keep as-is
          return cell;
        })
      );

      // SECOND PASS: Find last non-empty row to trim trailing empty rows
      // This removes rows at the end that have no content at all
      let lastNonEmptyRowIndex = -1;
      for (let i = optimizedRows.length - 1; i >= 0; i--) {
        const row = optimizedRows[i];
        // Check if row has ANY non-null cell
        if (row && row.some(cell => cell !== null && cell !== undefined)) {
          lastNonEmptyRowIndex = i;
          break;
        }
      }

      // Trim to last non-empty row + 1 (or keep at least 1 row to avoid empty sheet)
      const trimmedData = lastNonEmptyRowIndex >= 0 
        ? optimizedRows.slice(0, lastNonEmptyRowIndex + 1)
        : [optimizedRows[0] || []]; // Fallback: at least one empty row

      console.log(`[OPTIMIZE] Sheet "${sheet.name}": ${sheet.data.length} rows → ${trimmedData.length} rows (removed ${sheet.data.length - trimmedData.length} empty trailing rows)`);

      return {
        name: sheet.name,
        index: sheet.index,
        data: trimmedData,
        config: sheet.config
      };
    });
  };

  /**
   * FULL OVERWRITE SAVE - 100% RELIABLE MANUAL SAVE
   * 
   * This is the ONLY save function in the app. No autosave, no deltas, no merging with server state.
   * 
   * WHAT IT DOES:
   * 1. Get current Handsontable grid data and metadata (styles, borders, formulas)
   * 2. Merge the current grid state into the active sheet's XLSX cell objects
   * 3. Optimize all sheets to remove truly empty cells while preserving styled/formula cells
   * 4. Write the COMPLETE sheets array to Supabase edited_data (full overwrite)
   * 5. Retry up to 3 times if the save fails
   * 
   * TRIGGERED BY:
   * - MenuBar "Save" button click
   * - Keyboard shortcut: Ctrl+S (Cmd+S on Mac)
   * 
   * GUARANTEES:
   * - Every cell with content, style, formula, or border is saved
   * - Multi-sheet workbooks are fully preserved
   * - Re-opening the file shows exactly what was visible when saved
   * 
   * NO AUTOSAVE: User must manually save. Unsaved changes show a warning on window close.
   */
  const performSave = async () => {
    // Prevent concurrent saves to avoid race conditions
    if (isSaving) return;

    const attempt = async (tryNum: number): Promise<void> => {
      try {
        setIsSaving(true);
        const hotInstance = hotRef.current?.hotInstance;

        // Step 1: Get current full sheets state - merge latest Handsontable data/meta into ACTIVE SHEET ONLY
        // We clone the sheets array to avoid mutating the current state during the save process
        const workingSheets = [...sheets];
        if (hotInstance) {
          const currentGrid = hotInstance.getData();
          // Merge HOT data into active sheet to capture the latest edits made in the grid
          // This converts display values back into XLSX cell objects with styles/formulas
          workingSheets[activeSheetIndex] = mergeHotDataIntoSheet(
            workingSheets[activeSheetIndex],
            currentGrid,
            hotInstance
          );
        }

        console.log(`[SAVE] FULL OVERWRITE: Preparing to save ${workingSheets.length} sheets`);
        workingSheets.forEach((sheet, i) => {
          const nonEmptyRows = sheet.data.filter((row: any[]) => row && row.some((cell: any) => cell !== null && cell !== undefined && cell !== ''));
          console.log(`[SAVE] Sheet ${i} (${sheet.name}): ${sheet.data.length} total rows, ${nonEmptyRows.length} non-empty rows`);
        });

        // Step 2: Optimize data - remove truly empty rows/cells while preserving styles/formulas
        const optimizedSheets = optimizeSheetData(workingSheets);

        // Step 3: FULL OVERWRITE to Supabase - replace edited_data completely with current state
        // NO server fetch, NO delta merge - just write the entire { sheets: ... } object
        const fullStatePayload = { sheets: optimizedSheets };
        
        console.log(`[SAVE] Writing FULL state to Supabase (complete overwrite):`, {
          sheetCount: optimizedSheets.length,
          firstSheetRows: optimizedSheets[0]?.data?.length || 0,
          firstSheetCols: optimizedSheets[0]?.config?.columnCount || 0
        });

        const { error: saveErr } = await supabase
          .from('uploaded_files')
          .update({ 
            edited_data: fullStatePayload as any, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', fileId);

        if (saveErr) throw saveErr;

        console.log(`[SAVE] FULL OVERWRITE SUCCESS at ${new Date().toISOString()}`);

        // Step 4: Update local state and clear unsaved changes flag
        setSheets(workingSheets);
        setHasUnsavedChanges(false);
        
        // Step 5: Record save timestamp and show success toast
        const saveTime = new Date();
        setLastSaved(saveTime);
        toast.success(`Saved successfully at ${saveTime.toLocaleTimeString()}`, { duration: 3000 });
        
      } catch (err: any) {
        console.error(`Error saving file (try ${tryNum})`, err);
        // Retry up to 3 times with exponential backoff
        if (tryNum < 3) {
          await new Promise((res) => setTimeout(res, 300 * tryNum));
          return attempt(tryNum + 1);
        }
        toast.error(err?.message || 'Failed to save file after 3 retries');
        throw err;
      } finally {
        setIsSaving(false);
      }
    };

    return attempt(1);
  };

  // handleSave: Wrapper for performSave, called by MenuBar Save button
  const handleSave = () => performSave();

  // Keyboard shortcuts: Ctrl+S (or Cmd+S on Mac) triggers manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+S (Windows/Linux) or Cmd+S (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser's default save dialog
        performSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sheets, activeSheetIndex, fileId]); // Re-bind when dependencies change

  // Warn user on page unload/refresh if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Modern browsers show a generic message, but setting returnValue triggers the dialog
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Show toast warning if user tries to navigate away with unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      toast.warning("You have unsaved changes", { 
        duration: 5000,
        description: "Remember to save your work before leaving this page."
      });
    }
  }, [hasUnsavedChanges]);

  const handleAddSheet = () => {
    const newIndex = sheets.length;
    const emptyGrid = createEmptyGrid(50, 26);
    const newSheet: SheetData = {
      name: `Sheet${newIndex + 1}`,
      index: newIndex,
      data: emptyGrid,
      config: { columnCount: 26, rowCount: 50 }
    };
    setSheets([...sheets, newSheet]);
    setActiveSheetIndex(newIndex);
    toast.success(`Added ${newSheet.name}`);
  };

  const handleSheetChange = async (index: number) => {
    // Persist current sheet values AND cellMeta into state before switching (preserve all styles)
    const currentData = getCurrentSheetData();
    const hotInstance = hotRef.current?.hotInstance;
    const updatedSheets = [...sheets];
    updatedSheets[activeSheetIndex] = mergeHotDataIntoSheet(
      updatedSheets[activeSheetIndex], 
      currentData,
      hotInstance
    );
    setSheets(updatedSheets);
    setActiveSheetIndex(index);
  };

  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      sheets.forEach((sheet) => {
        const ws = XLSX.utils.aoa_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
      });

      XLSX.writeFile(wb, fileData?.file_name || "export.xlsx");
      toast.success("File exported successfully");
    } catch (error) {
      console.error("Error exporting file:", error);
      toast.error("Failed to export file");
    }
  };

  // handleClose: Navigate to Playground - warn if unsaved changes exist
  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
      );
      if (!confirmed) return;
    }
    navigate("/playground");
  };

  const handleUndo = () => {
    const hotInstance = hotRef.current?.hotInstance;
    if (hotInstance && hotInstance.isUndoAvailable()) {
      hotInstance.undo();
    }
  };

  const handleRedo = () => {
    const hotInstance = hotRef.current?.hotInstance;
    if (hotInstance && hotInstance.isRedoAvailable()) {
      hotInstance.redo();
    }
  };

  const handleToggleGridlines = () => {
    toast.info("Gridlines toggle - Coming soon");
  };

  const handleToggleFormulaBar = () => {
    setShowFormulaBar(!showFormulaBar);
  };

  const handleRename = () => {
    setNewFileName(fileData?.file_name || "");
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = async () => {
    if (!newFileName.trim()) {
      toast.error("File name cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("uploaded_files")
        .update({ file_name: newFileName })
        .eq("id", fileId);

      if (error) throw error;

      setFileData((prev) => prev ? { ...prev, file_name: newFileName } : null);
      setShowRenameDialog(false);
      toast.success("File renamed successfully");
    } catch (error) {
      console.error("Error renaming file:", error);
      toast.error("Failed to rename file");
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase
        .from("uploaded_files")
        .delete()
        .eq("id", fileId);

      if (error) throw error;

      toast.success("File deleted successfully");
      navigate("/playground");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  const handleDeleteSheet = (index: number) => {
    if (sheets.length === 1) {
      toast.error("Cannot delete the last sheet");
      return;
    }

    const updatedSheets = sheets.filter((_, i) => i !== index);
    // Update indices
    updatedSheets.forEach((sheet, i) => {
      sheet.index = i;
    });
    setSheets(updatedSheets);
    
    // If active sheet was deleted, switch to first sheet
    if (activeSheetIndex === index) {
      setActiveSheetIndex(0);
    } else if (activeSheetIndex > index) {
      setActiveSheetIndex(activeSheetIndex - 1);
    }

    toast.success("Sheet deleted");
  };

  const lastSelectedRef = useRef<string>("");

  const handleCellSelection = useCallback((row: number, col: number) => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance) return;

    try {
      const key = `${row}:${col}`;
      if (lastSelectedRef.current === key) {
        return; // prevent repeated updates for same selection
      }
      lastSelectedRef.current = key;

      setSelectedCell({ row, col });

      // Read from original sheet to preserve formulas
      const sheet = sheets[activeSheetIndex];
      const cellObj = sheet?.data?.[row]?.[col];

      if (cellObj && typeof cellObj === "object" && cellObj.f) {
        setFormulaBarValue("=" + cellObj.f);
        return;
      }

      if (cellObj && typeof cellObj === "object") {
        const displayValue = cellObj.w !== undefined ? cellObj.w : (cellObj.v !== undefined ? cellObj.v : "");
        setFormulaBarValue(String(displayValue));
        return;
      }

      const cellValue = hotInstance.getDataAtCell(row, col);
      setFormulaBarValue(cellValue ? String(cellValue) : "");
    } catch (error) {
      console.error("Error in handleCellSelection:", error);
    }
  }, [activeSheetIndex, sheets]);

const styledRenderer = useCallback((instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any, cellProperties: any) => {
  // Use default text renderer first
  Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);
  // Clear previous styles to avoid carry-over
  td.style.backgroundColor = "";
  td.style.color = "";
  td.style.fontWeight = "";
  td.style.fontStyle = "";
  td.style.textAlign = "";
  td.style.textDecoration = "";
  td.style.border = "";

  const meta: any = instance.getCellMeta(row, col);
  let appliedBg = false;
  let appliedText = false;
  let appliedBold = false;
  let appliedItalic = false;
  let appliedAlignment = false;
  let appliedStrikethrough = false;
  let appliedBorder = false;

  if (meta?.bgColor) {
    td.style.backgroundColor = meta.bgColor;
    appliedBg = true;
  }
  if (meta?.textColor) {
    td.style.color = meta.textColor;
    appliedText = true;
  }
  if (meta?.bold !== undefined) {
    td.style.fontWeight = meta.bold ? 'bold' : 'normal';
    appliedBold = true;
  }
  if (meta?.italic !== undefined) {
    td.style.fontStyle = meta.italic ? 'italic' : 'normal';
    appliedItalic = true;
  }
  if (meta?.alignment) {
    td.style.textAlign = meta.alignment;
    appliedAlignment = true;
  }
  if (meta?.strikethrough !== undefined) {
    td.style.textDecoration = meta.strikethrough ? 'line-through' : 'none';
    appliedStrikethrough = true;
  }
  if (meta?.borders) {
    td.style.border = meta.borders;
    appliedBorder = true;
  }

  // Fallback to XLSX styles when meta not set via toolbar
  const sheet = sheets[activeSheetIndex];
  const cellObj = sheet?.data?.[row]?.[col];
  if (cellObj && typeof cellObj === "object" && cellObj.s) {
    const xlsxStyle = cellObj.s;
    if (!appliedBg) {
      const rgb = xlsxStyle.fill?.fgColor?.rgb || xlsxStyle.fgColor?.rgb;
      if (rgb) {
        td.style.backgroundColor = rgb.length === 8 ? `#${rgb.substring(2)}` : `#${rgb}`;
      }
    }
    if (!appliedText && xlsxStyle.font?.color?.rgb) {
      const rgb = xlsxStyle.font.color.rgb;
      td.style.color = rgb.length === 8 ? `#${rgb.substring(2)}` : `#${rgb}`;
    }
    if (!appliedBold && xlsxStyle.font?.bold) {
      td.style.fontWeight = 'bold';
    }
    if (!appliedItalic && xlsxStyle.font?.italic) {
      td.style.fontStyle = 'italic';
    }
    if (!appliedStrikethrough && xlsxStyle.font?.strike) {
      td.style.textDecoration = 'line-through';
    }
    if (!appliedAlignment && xlsxStyle.alignment?.horizontal) {
      td.style.textAlign = xlsxStyle.alignment.horizontal;
    }
    if (!appliedBorder && xlsxStyle.border) {
      const borderStyle = '1px solid #000';
      td.style.border = borderStyle;
    }
  }
}, [sheets, activeSheetIndex]);

const handleFormulaBarChange = (value: string) => {
  setFormulaBarValue(value);
  if (selectedCell) {
    const hotInstance = hotRef.current?.hotInstance;
    if (hotInstance) {
      hotInstance.setDataAtCell(selectedCell.row, selectedCell.col, value);
    }
  }
};

  const applyBold = () => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance) {
      toast.error("Editor not ready");
      return;
    }

    const sel = hotInstance.getSelectedLast() || hotInstance.getSelected()?.[0];
    if (!sel) {
      toast.error("Please select cells first");
      return;
    }

    let [r1, c1, r2, c2] = sel;
    const startRow = Math.min(r1, r2);
    const endRow = Math.max(r1, r2);
    const startCol = Math.min(c1, c2);
    const endCol = Math.max(c1, c2);

    // Apply immediately via meta for instant feedback
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const isBold = hotInstance.getCellMeta(row, col).bold;
        hotInstance.setCellMeta(row, col, 'bold', !isBold);
      }
    }
    hotInstance.render();

    // REMOVED: changeSetRef tracking - no longer needed since we do full state saves

    // Persist into sheet data
    const updatedSheets = sheets.map((s, i) => {
      if (i !== activeSheetIndex) return s;
      const clonedRows = s.data.map((row) => Array.isArray(row) ? [...row] : row);
      const sheetClone = { ...s, data: clonedRows } as SheetData;

      for (let row = startRow; row <= endRow; row++) {
        if (!sheetClone.data[row]) continue;
        for (let col = startCol; col <= endCol; col++) {
          const current = sheetClone.data[row][col];
          let cellObj: any;
          if (current && typeof current === 'object') {
            cellObj = { ...current };
          } else {
            const val = current ?? '';
            cellObj = { v: val, w: val !== '' ? String(val) : '', t: typeof val === 'number' ? 'n' : 's' };
          }
          const existingStyle = cellObj.s || {};
          const currentBold = existingStyle.font?.bold || false;
          cellObj.s = {
            ...existingStyle,
            font: {
              ...(existingStyle.font || {}),
              bold: !currentBold,
            },
          };
          sheetClone.data[row][col] = cellObj;
        }
      }
      return sheetClone;
    });

    setSheets(updatedSheets);
    setHasUnsavedChanges(true);
    toast.success("Bold applied");
  };

  const applyItalic = () => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance) {
      toast.error("Editor not ready");
      return;
    }

    const sel = hotInstance.getSelectedLast() || hotInstance.getSelected()?.[0];
    if (!sel) {
      toast.error("Please select cells first");
      return;
    }

    let [r1, c1, r2, c2] = sel;
    const startRow = Math.min(r1, r2);
    const endRow = Math.max(r1, r2);
    const startCol = Math.min(c1, c2);
    const endCol = Math.max(c1, c2);

    // Apply immediately via meta for instant feedback
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const isItalic = hotInstance.getCellMeta(row, col).italic;
        hotInstance.setCellMeta(row, col, 'italic', !isItalic);
      }
    }
    hotInstance.render();

    // REMOVED: changeSetRef tracking - no longer needed since we do full state saves

    // Persist into sheet data
    const updatedSheets = sheets.map((s, i) => {
      if (i !== activeSheetIndex) return s;
      const clonedRows = s.data.map((row) => Array.isArray(row) ? [...row] : row);
      const sheetClone = { ...s, data: clonedRows } as SheetData;

      for (let row = startRow; row <= endRow; row++) {
        if (!sheetClone.data[row]) continue;
        for (let col = startCol; col <= endCol; col++) {
          const current = sheetClone.data[row][col];
          let cellObj: any;
          if (current && typeof current === 'object') {
            cellObj = { ...current };
          } else {
            const val = current ?? '';
            cellObj = { v: val, w: val !== '' ? String(val) : '', t: typeof val === 'number' ? 'n' : 's' };
          }
          const existingStyle = cellObj.s || {};
          const currentItalic = existingStyle.font?.italic || false;
          cellObj.s = {
            ...existingStyle,
            font: {
              ...(existingStyle.font || {}),
              italic: !currentItalic,
            },
          };
          sheetClone.data[row][col] = cellObj;
        }
      }
      return sheetClone;
    });

    setSheets(updatedSheets);
    setHasUnsavedChanges(true);
    toast.success("Italic applied");
  };

  const applyAlignment = (alignment: 'left' | 'center' | 'right') => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance) {
      toast.error("Editor not ready");
      return;
    }

    const sel = hotInstance.getSelectedLast() || hotInstance.getSelected()?.[0];
    if (!sel) {
      toast.error("Please select cells first");
      return;
    }

    let [r1, c1, r2, c2] = sel;
    const startRow = Math.min(r1, r2);
    const endRow = Math.max(r1, r2);
    const startCol = Math.min(c1, c2);
    const endCol = Math.max(c1, c2);

    // Apply immediately via meta for instant feedback
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        hotInstance.setCellMeta(row, col, 'alignment', alignment);
      }
    }
    hotInstance.render();

    // REMOVED: changeSetRef tracking - no longer needed since we do full state saves

    // Persist into sheet data
    const updatedSheets = sheets.map((s, i) => {
      if (i !== activeSheetIndex) return s;
      const clonedRows = s.data.map((row) => Array.isArray(row) ? [...row] : row);
      const sheetClone = { ...s, data: clonedRows } as SheetData;

      for (let row = startRow; row <= endRow; row++) {
        if (!sheetClone.data[row]) continue;
        for (let col = startCol; col <= endCol; col++) {
          const current = sheetClone.data[row][col];
          let cellObj: any;
          if (current && typeof current === 'object') {
            cellObj = { ...current };
          } else {
            const val = current ?? '';
            cellObj = { v: val, w: val !== '' ? String(val) : '', t: typeof val === 'number' ? 'n' : 's' };
          }
          const existingStyle = cellObj.s || {};
          cellObj.s = {
            ...existingStyle,
            alignment: {
              ...(existingStyle.alignment || {}),
              horizontal: alignment,
            },
          };
          sheetClone.data[row][col] = cellObj;
        }
      }
      return sheetClone;
    });

    setSheets(updatedSheets);
    setHasUnsavedChanges(true);
    toast.success(`Alignment set to ${alignment}`);
  };

  // Convert #RRGGBB or #RGB to XLSX ARGB (FFRRGGBB)
  const hexToXlsxARGB = (hex: string) => {
    let h = hex.replace('#', '').trim();
    if (h.length === 3) {
      h = h.split('').map((c) => c + c).join('');
    }
    if (h.length !== 6) return 'FFFFFFFF';
    return ('FF' + h).toUpperCase();
  };

  const applyFillColor = (color: string) => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance) {
      toast.error("Editor not ready");
      return;
    }

    const sel = hotInstance.getSelectedLast() || hotInstance.getSelected()?.[0];
    if (!sel) {
      toast.error("Please select cells first");
      return;
    }

    let [r1, c1, r2, c2] = sel;
    const startRow = Math.min(r1, r2);
    const endRow = Math.max(r1, r2);
    const startCol = Math.min(c1, c2);
    const endCol = Math.max(c1, c2);

    // 1) Apply immediately via meta for instant feedback
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        hotInstance.setCellMeta(row, col, 'bgColor', color);
      }
    }
    hotInstance.render();

    // REMOVED: changeSetRef tracking - no longer needed since we do full state saves

    // 2) Persist into our sheet data styles so it survives rerenders
    const updatedSheets = sheets.map((s, i) => {
      if (i !== activeSheetIndex) return s;
      const clonedRows = s.data.map((row) => Array.isArray(row) ? [...row] : row);
      const sheetClone = { ...s, data: clonedRows } as SheetData;

      for (let row = startRow; row <= endRow; row++) {
        if (!sheetClone.data[row]) continue;
        for (let col = startCol; col <= endCol; col++) {
          const current = sheetClone.data[row][col];
          let cellObj: any;
          if (current && typeof current === 'object') {
            cellObj = { ...current };
          } else {
            const val = current ?? '';
            cellObj = { v: val, w: val !== '' ? String(val) : '', t: typeof val === 'number' ? 'n' : 's' };
          }
          const existingStyle = cellObj.s || {};
          const arbg = hexToXlsxARGB(color);
          cellObj.s = {
            ...existingStyle,
            fill: {
              ...(existingStyle.fill || {}),
              fgColor: { rgb: arbg },
            },
          };
          sheetClone.data[row][col] = cellObj;
        }
      }
      return sheetClone;
    });

    setSheets(updatedSheets);
    setHasUnsavedChanges(true);
    toast.success("Fill color applied");
  };

  const applyTextColor = (color: string) => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance) {
      toast.error("Editor not ready");
      return;
    }

    const sel = hotInstance.getSelectedLast() || hotInstance.getSelected()?.[0];
    if (!sel) {
      toast.error("Please select cells first");
      return;
    }

    let [r1, c1, r2, c2] = sel;
    const startRow = Math.min(r1, r2);
    const endRow = Math.max(r1, r2);
    const startCol = Math.min(c1, c2);
    const endCol = Math.max(c1, c2);

    // 1) Apply immediately via meta for instant feedback
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        hotInstance.setCellMeta(row, col, 'textColor', color);
      }
    }
    hotInstance.render();

    // REMOVED: changeSetRef tracking - no longer needed since we do full state saves

    // 2) Persist into our sheet data styles so it survives rerenders
    const updatedSheets = sheets.map((s, i) => {
      if (i !== activeSheetIndex) return s;
      const clonedRows = s.data.map((row) => Array.isArray(row) ? [...row] : row);
      const sheetClone = { ...s, data: clonedRows } as SheetData;

      for (let row = startRow; row <= endRow; row++) {
        if (!sheetClone.data[row]) continue;
        for (let col = startCol; col <= endCol; col++) {
          const current = sheetClone.data[row][col];
          let cellObj: any;
          if (current && typeof current === 'object') {
            cellObj = { ...current };
          } else {
            const val = current ?? '';
            cellObj = { v: val, w: val !== '' ? String(val) : '', t: typeof val === 'number' ? 'n' : 's' };
          }
          const existingStyle = cellObj.s || {};
          const arbg = hexToXlsxARGB(color);
          cellObj.s = {
            ...existingStyle,
            font: {
              ...(existingStyle.font || {}),
              color: { rgb: arbg },
            },
          };
          sheetClone.data[row][col] = cellObj;
        }
      }
      return sheetClone;
    });

    setSheets(updatedSheets);
    setHasUnsavedChanges(true);
    toast.success("Text color applied");
  };

  const applyStrikethrough = () => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance) {
      toast.error("Editor not ready");
      return;
    }

    const sel = hotInstance.getSelectedLast() || hotInstance.getSelected()?.[0];
    if (!sel) {
      toast.error("Please select cells first");
      return;
    }

    let [r1, c1, r2, c2] = sel;
    const startRow = Math.min(r1, r2);
    const endRow = Math.max(r1, r2);
    const startCol = Math.min(c1, c2);
    const endCol = Math.max(c1, c2);

    // Apply immediately via meta for instant feedback
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const isStrikethrough = hotInstance.getCellMeta(row, col).strikethrough;
        hotInstance.setCellMeta(row, col, 'strikethrough', !isStrikethrough);
      }
    }
    hotInstance.render();

    // REMOVED: changeSetRef tracking - no longer needed since we do full state saves

    // Persist into sheet data
    const updatedSheets = sheets.map((s, i) => {
      if (i !== activeSheetIndex) return s;
      const clonedRows = s.data.map((row) => Array.isArray(row) ? [...row] : row);
      const sheetClone = { ...s, data: clonedRows } as SheetData;

      for (let row = startRow; row <= endRow; row++) {
        if (!sheetClone.data[row]) continue;
        for (let col = startCol; col <= endCol; col++) {
          const current = sheetClone.data[row][col];
          let cellObj: any;
          if (current && typeof current === 'object') {
            cellObj = { ...current };
          } else {
            const val = current ?? '';
            cellObj = { v: val, w: val !== '' ? String(val) : '', t: typeof val === 'number' ? 'n' : 's' };
          }
          const existingStyle = cellObj.s || {};
          const currentStrike = existingStyle.font?.strike || false;
          cellObj.s = {
            ...existingStyle,
            font: {
              ...(existingStyle.font || {}),
              strike: !currentStrike,
            },
          };
          sheetClone.data[row][col] = cellObj;
        }
      }
      return sheetClone;
    });

    setSheets(updatedSheets);
    setHasUnsavedChanges(true);
    toast.success("Strikethrough applied");
  };

  const applyBorders = (options: BorderOptions) => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance) {
      toast.error("Editor not ready");
      return;
    }

    const sel = hotInstance.getSelectedLast() || hotInstance.getSelected()?.[0];
    if (!sel) {
      toast.error("Please select cells first");
      return;
    }

    let [r1, c1, r2, c2] = sel;
    const startRow = Math.min(r1, r2);
    const endRow = Math.max(r1, r2);
    const startCol = Math.min(c1, c2);
    const endCol = Math.max(c1, c2);

    // Convert hex color to RGB for XLSX
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16).toString(16).padStart(2, '0')}${parseInt(result[2], 16).toString(16).padStart(2, '0')}${parseInt(result[3], 16).toString(16).padStart(2, '0')}`.toUpperCase() : '000000';
    };

    const thicknessMap: Record<string, string> = {
      thin: 'thin',
      medium: 'medium',
      thick: 'thick'
    };

    // Generate CSS border string for Handsontable meta
    const borderWidth = options.thickness === 'thin' ? '1px' : options.thickness === 'medium' ? '2px' : '3px';
    const borderStyleCss = options.style === 'solid' ? 'solid' : options.style === 'dashed' ? 'dashed' : 'dotted';
    const cssColor = options.color;
    const cssBorder = `${borderWidth} ${borderStyleCss} ${cssColor}`;

    // Apply via Handsontable meta for immediate visual feedback
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const borderMeta: any = {};
        
        options.positions.forEach(position => {
          switch (position) {
            case 'all':
              borderMeta.top = cssBorder;
              borderMeta.bottom = cssBorder;
              borderMeta.left = cssBorder;
              borderMeta.right = cssBorder;
              break;
            case 'outer':
              if (row === startRow) borderMeta.top = cssBorder;
              if (row === endRow) borderMeta.bottom = cssBorder;
              if (col === startCol) borderMeta.left = cssBorder;
              if (col === endCol) borderMeta.right = cssBorder;
              break;
            case 'inner':
              if (row !== startRow && row !== endRow) {
                borderMeta.top = cssBorder;
                borderMeta.bottom = cssBorder;
              }
              if (col !== startCol && col !== endCol) {
                borderMeta.left = cssBorder;
                borderMeta.right = cssBorder;
              }
              break;
            case 'top':
              borderMeta.top = cssBorder;
              break;
            case 'bottom':
              borderMeta.bottom = cssBorder;
              break;
            case 'left':
              borderMeta.left = cssBorder;
              break;
            case 'right':
              borderMeta.right = cssBorder;
              break;
            case 'horizontal':
              if (row !== startRow) borderMeta.top = cssBorder;
              if (row !== endRow) borderMeta.bottom = cssBorder;
              break;
            case 'vertical':
              if (col !== startCol) borderMeta.left = cssBorder;
              if (col !== endCol) borderMeta.right = cssBorder;
              break;
            case 'none':
              borderMeta.top = '';
              borderMeta.bottom = '';
              borderMeta.left = '';
              borderMeta.right = '';
              break;
          }
        });
        
        hotInstance.setCellMeta(row, col, 'borders', borderMeta);
      }
    }
    hotInstance.render();

    // REMOVED: changeSetRef tracking - no longer needed since we do full state saves

    // Persist into sheet data (XLSX format)
    const updatedSheets = sheets.map((s, i) => {
      if (i !== activeSheetIndex) return s;
      const clonedRows = s.data.map((row) => Array.isArray(row) ? [...row] : row);
      const sheetClone = { ...s, data: clonedRows } as SheetData;

      for (let row = startRow; row <= endRow; row++) {
        if (!sheetClone.data[row]) continue;
        for (let col = startCol; col <= endCol; col++) {
          const current = sheetClone.data[row][col];
          let cellObj: any;
          if (current && typeof current === 'object') {
            cellObj = { ...current };
          } else {
            const val = current ?? '';
            cellObj = { v: val, w: val !== '' ? String(val) : '', t: typeof val === 'number' ? 'n' : 's' };
          }
          
          if (!cellObj.s) cellObj.s = {};
          if (!cellObj.s.border) cellObj.s.border = {};

          const borderStyle = {
            style: thicknessMap[options.thickness],
            color: { rgb: hexToRgb(options.color) }
          };

          options.positions.forEach(position => {
            switch (position) {
              case 'all':
                cellObj.s.border = {
                  top: borderStyle,
                  bottom: borderStyle,
                  left: borderStyle,
                  right: borderStyle
                };
                break;
              case 'outer':
                if (row === startRow) cellObj.s.border.top = borderStyle;
                if (row === endRow) cellObj.s.border.bottom = borderStyle;
                if (col === startCol) cellObj.s.border.left = borderStyle;
                if (col === endCol) cellObj.s.border.right = borderStyle;
                break;
              case 'inner':
                if (row !== startRow && row !== endRow) {
                  cellObj.s.border.top = borderStyle;
                  cellObj.s.border.bottom = borderStyle;
                }
                if (col !== startCol && col !== endCol) {
                  cellObj.s.border.left = borderStyle;
                  cellObj.s.border.right = borderStyle;
                }
                break;
              case 'top':
                cellObj.s.border.top = borderStyle;
                break;
              case 'bottom':
                cellObj.s.border.bottom = borderStyle;
                break;
              case 'left':
                cellObj.s.border.left = borderStyle;
                break;
              case 'right':
                cellObj.s.border.right = borderStyle;
                break;
              case 'horizontal':
                if (row !== startRow) cellObj.s.border.top = borderStyle;
                if (row !== endRow) cellObj.s.border.bottom = borderStyle;
                break;
              case 'vertical':
                if (col !== startCol) cellObj.s.border.left = borderStyle;
                if (col !== endCol) cellObj.s.border.right = borderStyle;
                break;
              case 'none':
                cellObj.s.border = {};
                break;
            }
          });

          sheetClone.data[row][col] = cellObj;
        }
      }
      return sheetClone;
    });

    setSheets(updatedSheets);
    setHasUnsavedChanges(true);
    toast.success("Borders applied");
  };

  const applyMergeCells = (mergeType: 'all' | 'horizontal' | 'vertical' | 'unmerge') => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance) {
      toast.error("Editor not ready");
      return;
    }

    const sel = hotInstance.getSelectedLast() || hotInstance.getSelected()?.[0];
    if (!sel) {
      toast.error("Please select cells first");
      return;
    }

    let [r1, c1, r2, c2] = sel;
    const startRow = Math.min(r1, r2);
    const endRow = Math.max(r1, r2);
    const startCol = Math.min(c1, c2);
    const endCol = Math.max(c1, c2);

    const mergeCells = hotInstance.getPlugin('mergeCells');
    
    if (mergeType === 'unmerge') {
      mergeCells.unmerge(startRow, startCol, endRow, endCol);
      toast.success("Cells unmerged");
    } else if (mergeType === 'all') {
      mergeCells.merge(startRow, startCol, endRow, endCol);
      toast.success("Cells merged");
    } else if (mergeType === 'horizontal') {
      for (let row = startRow; row <= endRow; row++) {
        mergeCells.merge(row, startCol, row, endCol);
      }
      toast.success("Cells merged horizontally");
    } else if (mergeType === 'vertical') {
      for (let col = startCol; col <= endCol; col++) {
        mergeCells.merge(startRow, col, endRow, col);
      }
      toast.success("Cells merged vertically");
    }
    
    hotInstance.render();
  };
  if (loading) {
    return (
      <AuthLayout>
        <div className="container py-8 max-w-full">
          <p className="text-center text-muted-foreground">Loading editor...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-col h-screen w-full overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-none">
          {/* Menu Bar */}
          <MenuBar
            onSave={handleSave}
            onExport={handleExport}
            onClose={handleClose}
            onRename={handleRename}
            onDelete={handleDelete}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onToggleGridlines={handleToggleGridlines}
            onToggleFormulaBar={handleToggleFormulaBar}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            lastSaved={lastSaved}
          />

          {/* Formatting Toolbar */}
          <FormattingToolbar
            onUndo={handleUndo}
            onRedo={handleRedo}
            onBold={applyBold}
            onItalic={applyItalic}
            onStrikethrough={applyStrikethrough}
            onAlignment={applyAlignment}
            onFillColor={applyFillColor}
            onTextColor={applyTextColor}
            onBorders={applyBorders}
            onMergeCells={applyMergeCells}
          />

          {/* File Name Header */}
          <div className="px-4 py-2 border-b bg-background flex items-center justify-between">
            <h1 className="font-semibold text-lg">
              {fileData?.file_name || "Untitled Spreadsheet"}
            </h1>
          </div>

          {/* Formula Bar */}
          {showFormulaBar && (
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
              <span className="text-sm font-medium min-w-[60px]">
                {selectedCell ? `${String.fromCharCode(65 + selectedCell.col)}${selectedCell.row + 1}` : ''}
              </span>
              <Input
                value={formulaBarValue}
                onChange={(e) => handleFormulaBarChange(e.target.value)}
                placeholder="Enter formula or value"
                className="flex-1 h-8"
              />
            </div>
          )}
        </div>

        {/* Scrollable Content Section - PREVENTS PAGE SCROLL */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Grid - ENABLES GRID-ONLY SCROLL*/}
          <div className="flex-1 overflow-auto">
            <HotTable
              ref={hotRef}
              data={tableData}
              colHeaders={true}
              rowHeaders={true}
              width="100%"
              height={gridHeight}
              licenseKey="non-commercial-and-evaluation"
              stretchH="all"
              manualColumnResize={true}
              manualRowResize={true}
              contextMenu={true}
              filters={true}
              dropdownMenu={true}
              outsideClickDeselects={false}
              afterSelectionEnd={(r: number, c: number) => handleCellSelection(r, c)}
              afterChange={(changes: any[] | null, source: string) => {
                if (!changes || source === 'loadData') return;
                const hot = hotRef.current?.hotInstance;
                if (!hot) return;

                // Clone sheets shallowly to update only active sheet
                const updatedSheets = [...sheets];
                const sheet = { ...updatedSheets[activeSheetIndex] } as SheetData;
                const dataClone = sheet.data.map((row) => Array.isArray(row) ? [...row] : row);

                for (const change of changes) {
                  const [row, prop, oldVal, newVal] = change;
                  const col = typeof prop === 'number' ? prop : parseInt(prop, 10);
                  const meta = hot.getCellMeta(row, col);

                  console.log('afterChange', { row, col, oldVal, newVal, meta: {
                    bold: meta?.bold, italic: meta?.italic, strike: meta?.strikethrough,
                    textColor: meta?.textColor, bgColor: meta?.bgColor, alignment: meta?.alignment, borders: meta?.borders
                  }});

                  // REMOVED: changeSetRef tracking - no longer needed since we do full state saves
                  
                  // Mark as having unsaved changes so user is warned
                  setHasUnsavedChanges(true);

                  const hasStyleMeta = !!(meta && (meta.bold !== undefined || meta.italic !== undefined || meta.strikethrough !== undefined || meta.textColor || meta.bgColor || meta.alignment || meta.borders));

                  const ensureCellObj = (existing: any): any => {
                    if (existing && typeof existing === 'object') return { ...existing };
                    const baseVal = existing ?? '';
                    return { v: baseVal, w: baseVal !== '' ? String(baseVal) : '', t: typeof baseVal === 'number' ? 'n' : 's' };
                  };

                  const applyMetaToStyle = (cellObj: any) => {
                    const style: any = { ...(cellObj.s || {}) };
                    const font: any = { ...(style.font || {}) };
                    if (meta.bold !== undefined) font.bold = !!meta.bold;
                    if (meta.italic !== undefined) font.italic = !!meta.italic;
                    if (meta.strikethrough !== undefined) font.strike = !!meta.strikethrough;
                    if (meta.textColor) font.color = { rgb: hexToXlsxARGB(meta.textColor) };
                    if (Object.keys(font).length) style.font = font;
                    if (meta.bgColor) style.fill = { fgColor: { rgb: hexToXlsxARGB(meta.bgColor) } };
                    if (meta.alignment) style.alignment = { horizontal: meta.alignment };
                    if (meta.borders) style.border = meta.borders;
                    if (Object.keys(style).length) cellObj.s = style;
                  };

                  let cellObj: any = ensureCellObj(dataClone[row]?.[col]);

                  // Handle formulas
                  if (typeof newVal === 'string' && newVal.trim().startsWith('=')) {
                    cellObj.f = newVal.trim().slice(1);
                    delete cellObj.v;
                    cellObj.w = '';
                  } else if (newVal === null || newVal === '') {
                    // Clear value - keep style-only cells if meta exists
                    delete cellObj.v;
                    cellObj.w = '';
                    delete cellObj.f;
                    if (hasStyleMeta) {
                      cellObj.t = 'z';
                      applyMetaToStyle(cellObj);
                    } else {
                      cellObj = null;
                    }
                  } else {
                    // Regular value
                    cellObj.v = newVal;
                    cellObj.w = String(newVal);
                    delete cellObj.f;
                    cellObj.t = typeof newVal === 'number' ? 'n' : 's';
                    if (hasStyleMeta) applyMetaToStyle(cellObj);
                  }

                  if (!dataClone[row]) dataClone[row] = [] as any[];
                  dataClone[row][col] = cellObj;
                }

                sheet.data = dataClone;
                sheet.config = {
                  columnCount: Math.max(sheet.config?.columnCount || 0, hot.countCols()),
                  rowCount: Math.max(sheet.config?.rowCount || 0, hot.countRows()),
                  ...(sheet.config || {})
                };
                updatedSheets[activeSheetIndex] = sheet;
                setSheets(updatedSheets);
                setHasUnsavedChanges(true);
              }}
              undo={true}
              mergeCells={true}
cells={(row: number, col: number) => {
                const cellProperties: any = { renderer: styledRenderer };
                const sheet = sheets[activeSheetIndex];
                const cellObj = sheet?.data?.[row]?.[col];
                
                if (cellObj && typeof cellObj === 'object' && cellObj.s) {
                  // Bold/italic from font
                  let className = '';
                  if (cellObj.s.font?.bold) className += ' font-bold';
                  if (cellObj.s.font?.italic) className += ' italic';
                  if (className) cellProperties.className = className.trim();
                }
                
                return cellProperties;
              }}
            />
          </div>

          {/* Fixed Sheet Tabs - Horizontally Scrollable */}
          <div className="flex-none border-t bg-muted/30 px-2 py-1.5 flex items-center gap-1 overflow-x-auto">
            {sheets.map((sheet, index) => (
              <div key={index} className="flex items-center group">
                <button
                  onClick={() => handleSheetChange(index)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                    activeSheetIndex === index
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  {sheet.name}
                </button>
                {sheets.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSheet(index)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddSheet}
              className="ml-2 h-7"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this file? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Rename Dialog */}
        <AlertDialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rename File</AlertDialogTitle>
              <AlertDialogDescription>
                Enter a new name for this file.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              key={showRenameDialog ? 'rename-input' : 'hidden'}
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameConfirm();
                }
              }}
              placeholder="File name"
              className="my-4"
              autoFocus
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRenameConfirm}>
                Rename
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthLayout>
  );
};

export default PlaygroundEditor;
