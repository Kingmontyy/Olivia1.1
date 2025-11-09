import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import Handsontable from "handsontable";
import { Plus, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { MenuBar } from "@/components/editor/MenuBar";
import { FormattingToolbar } from "@/components/editor/FormattingToolbar";
import { BorderOptions } from "@/components/editor/BorderPicker";
import { evaluateDisplayAoA } from "@/lib/xlsx-eval";
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

// Register Handsontable modules
registerAllModules();

interface FileData {
  id: string;
  file_name: string;
  edited_data: any;
  file_url?: string;
  file_type?: string;
}

interface SheetData {
  name: string;
  index: number;
  data: any[][];
  config?: {
    columnCount: number;
    rowCount: number;
  };
}

const PlaygroundEditor = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [tableData, setTableData] = useState<any[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState("");
  const [showFormulaBar, setShowFormulaBar] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [gridHeight, setGridHeight] = useState<number>(480);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const hotRef = useRef<any>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const changeTrackingRef = useRef(false);

  useEffect(() => {
    if (fileId) {
      fetchFileData();
    }
  }, [fileId]);

  useEffect(() => {
    const computeHeight = () => {
      // Approx header/toolbars/tabs space
      const reserved = showFormulaBar ? 260 : 220;
      const h = Math.max(window.innerHeight - reserved, 300);
      setGridHeight(h);
    };
    computeHeight();
    window.addEventListener("resize", computeHeight);
    return () => window.removeEventListener("resize", computeHeight);
  }, [showFormulaBar]);

  useEffect(() => {
    if (sheets.length > 0 && activeSheetIndex >= 0 && activeSheetIndex < sheets.length) {
      console.log("Loading sheet data:", sheets[activeSheetIndex]?.data?.length || 0, "rows");
      const displayData = evaluateDisplayAoA(sheets as any, activeSheetIndex);
      console.log("Evaluated + converted to display data:", displayData.length, "rows");
      setTableData(displayData);
      // Force Handsontable to re-render all cells to apply imported styles
      setTimeout(() => {
        hotRef.current?.hotInstance?.render();
      }, 0);
    }
  }, [activeSheetIndex]);

  // Initialize table only on first load to avoid wiping in-progress edits during saves
  useEffect(() => {
    if (tableData.length === 0 && sheets.length > 0 && activeSheetIndex >= 0 && activeSheetIndex < sheets.length) {
      const displayData = evaluateDisplayAoA(sheets as any, activeSheetIndex);
      setTableData(displayData);
      setTimeout(() => {
        hotRef.current?.hotInstance?.render();
      }, 0);
    }
  }, [sheets, activeSheetIndex, tableData.length]);

  useEffect(() => {
    // reset selection guard when switching sheets
    lastSelectedRef.current = "";
  }, [activeSheetIndex]);

  const fetchFileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to edit files");
        navigate("/playground");
        return;
      }

      const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .eq("id", fileId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      console.log("Loaded file data:", data);
      console.log("File edited_data:", data.edited_data);
      setFileData(data);
      
      // Convert stored data to sheet format
      if (data.edited_data) {
        const editedData = data.edited_data as any;
        console.log("Edited data structure:", editedData);
        console.log("Has sheets array:", editedData.sheets ? "YES" : "NO");
        
        if (editedData.sheets && Array.isArray(editedData.sheets)) {
          // Multi-sheet format
          console.log("Loading multi-sheet format, sheets:", editedData.sheets.length);
          editedData.sheets.forEach((sheet: any, i: number) => {
            console.log(`Sheet ${i} (${sheet.name}): ${sheet.data?.length || 0} rows, ${sheet.data?.[0]?.length || 0} cols`);
            if (sheet.data && sheet.data[0] && sheet.data[0][0]) {
              console.log(`Sheet ${i} first cell:`, sheet.data[0][0]);
            }
          });
          setSheets(editedData.sheets);
        } else if (Array.isArray(editedData)) {
          // Legacy single-sheet format (array of objects)
          console.log("Converting legacy format");
          const grid = convertLegacyToGrid(editedData);
          const sheet: SheetData = {
            name: "Sheet1",
            index: 0,
            data: grid,
            config: {
              columnCount: grid[0]?.length || 26,
              rowCount: grid.length
            }
          };
          setSheets([sheet]);
          setTableData(grid);
        } else {
          // Empty or invalid data — try fallback parse from storage
          console.warn("Empty or invalid data, attempting storage parse fallback");
          if (data.file_url) {
            const parsedSheets = await parseFromStorage(data.file_url);
            if (parsedSheets && parsedSheets.length > 0) {
              setSheets(parsedSheets);
            } else {
              toast.info("No data found in file. Please re-upload or start with a blank sheet.");
              const emptyGrid = createEmptyGrid(50, 26);
              const sheet: SheetData = { name: "Sheet1", index: 0, data: emptyGrid, config: { columnCount: 26, rowCount: 50 } };
              setSheets([sheet]);
            }
          } else {
            toast.info("No data found in file. Please re-upload or start with a blank sheet.");
            const emptyGrid = createEmptyGrid(50, 26);
            const sheet: SheetData = { name: "Sheet1", index: 0, data: emptyGrid, config: { columnCount: 26, rowCount: 50 } };
            setSheets([sheet]);
          }
        }
      } else {
        // No parsed data yet — try to parse original upload from storage
        console.log("No parsed data found, attempting storage parse");
        if (data.file_url) {
          const parsedSheets = await parseFromStorage(data.file_url);
          if (parsedSheets && parsedSheets.length > 0) {
            setSheets(parsedSheets);
          } else {
            const emptyGrid = createEmptyGrid(50, 26);
            const sheet: SheetData = { name: "Sheet1", index: 0, data: emptyGrid, config: { columnCount: 26, rowCount: 50 } };
            setSheets([sheet]);
          }
        } else {
          const emptyGrid = createEmptyGrid(50, 26);
          const sheet: SheetData = { name: "Sheet1", index: 0, data: emptyGrid, config: { columnCount: 26, rowCount: 50 } };
          setSheets([sheet]);
        }
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
          newData[r][c] = null;
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

  // Fallback: download and parse original file from storage if edited_data is missing
  const parseFromStorage = async (path: string): Promise<SheetData[] | null> => {
    try {
      const { data: blob, error } = await supabase.storage
        .from('uploaded-files')
        .download(path);
      if (error) {
        console.error('Storage download error:', error);
        return null;
      }
      const arrayBuffer = await blob.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array', 
        cellFormula: true, 
        cellStyles: true, 
        cellDates: true,
        cellNF: true
      });
      
      const sheets: SheetData[] = workbook.SheetNames.map((sheetName: string, index: number) => {
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const rows: any[][] = [];
        
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const row: any[] = [];
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = worksheet[cellAddress] as any;
            
            if (cell) {
              const cellData: any = { 
                v: cell.v, 
                f: cell.f, 
                t: cell.t, 
                w: cell.w 
              };
              
              // Store style information if available
              if (cell.s) {
                cellData.s = cell.s;
              }
              
              row.push(cellData);
            } else {
              row.push(null);
            }
          }
          rows.push(row);
        }
        
        return { 
          name: sheetName, 
          index, 
          data: rows, 
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

  const optimizeSheetData = (sheets: SheetData[]): any[] => {
    // Remove null/empty cells and unnecessary properties to reduce payload size
    return sheets.map(sheet => ({
      name: sheet.name,
      index: sheet.index,
      data: sheet.data.map(row => 
        row.map(cell => {
          if (!cell || (typeof cell === 'object' && !cell.v && !cell.w)) return null;
          if (typeof cell === 'object') {
            // Only keep essential properties
            const optimized: any = { t: cell.t };
            if (cell.v !== undefined) optimized.v = cell.v;
            if (cell.w !== undefined) optimized.w = cell.w;
            if (cell.f) optimized.f = cell.f;
            if (cell.s) optimized.s = cell.s;
            return optimized;
          }
          return cell;
        })
      ),
      config: sheet.config
    }));
  };

  const performSave = async (showToast = true) => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      const currentData = getCurrentSheetData();
      const hotInstance = hotRef.current?.hotInstance;
      
      // Merge current grid values AND cellMeta into sheet while preserving all styles
      const updatedSheets = [...sheets];
      updatedSheets[activeSheetIndex] = mergeHotDataIntoSheet(
        updatedSheets[activeSheetIndex], 
        currentData, 
        hotInstance
      );

      // Optimize data to reduce payload size
      const optimizedData = optimizeSheetData(updatedSheets);

      const { error } = await supabase
        .from("uploaded_files")
        .update({ 
          edited_data: { sheets: optimizedData } as any,
          updated_at: new Date().toISOString()
        })
        .eq("id", fileId);

      if (error) {
        if (error.code === '57014') {
          throw new Error("Save timeout - file too large. Try reducing data size.");
        }
        throw error;
      }

      setSheets(updatedSheets);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      if (showToast) {
        toast.success("File saved successfully");
      }
    } catch (error: any) {
      console.error("Error saving file:", error);
      if (showToast) {
        toast.error(error.message || "Failed to save file");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => performSave(true);

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !fileId) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for 30 seconds
    autoSaveTimerRef.current = setTimeout(() => {
      performSave(false);
      toast.info("Auto-saved", { duration: 1500 });
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, fileId]);

  // Track changes to mark as unsaved
  useEffect(() => {
    if (!changeTrackingRef.current) {
      // Skip initial load
      changeTrackingRef.current = true;
      return;
    }
    
    setHasUnsavedChanges(true);
  }, [sheets, activeSheetIndex]);

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

  const handleClose = () => {
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

        {/* Scrollable Content Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Grid - Scrollable */}
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
              afterChange={() => {
                if (changeTrackingRef.current) {
                  setHasUnsavedChanges(true);
                }
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
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="File name"
              className="my-4"
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
