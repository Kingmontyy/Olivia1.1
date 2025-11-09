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
  const hotRef = useRef<any>(null);

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
      // Evaluate formulas and convert to display values using xlsx-calc
      const displayData = evaluateDisplayAoA(sheets as any, activeSheetIndex);
      console.log("Evaluated + converted to display data:", displayData.length, "rows");
      if (displayData.length === 0) {
        console.warn("Sheet data empty after evaluation. Showing fallback message.");
      }
      setTableData(displayData);
    }
  }, [activeSheetIndex, sheets]);

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

  const handleSave = async () => {
    try {
      const currentData = getCurrentSheetData();
      
      // Update current sheet data
      const updatedSheets = [...sheets];
      updatedSheets[activeSheetIndex] = {
        ...updatedSheets[activeSheetIndex],
        data: currentData
      };

      const { error } = await supabase
        .from("uploaded_files")
        .update({ 
          edited_data: { sheets: updatedSheets } as any,
          updated_at: new Date().toISOString()
        })
        .eq("id", fileId);

      if (error) throw error;

      setSheets(updatedSheets);
      toast.success("File saved successfully");
    } catch (error) {
      console.error("Error saving file:", error);
      toast.error("Failed to save file");
    }
  };

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
    // Save current sheet data before switching
    const currentData = getCurrentSheetData();
    const updatedSheets = [...sheets];
    updatedSheets[activeSheetIndex] = {
      ...updatedSheets[activeSheetIndex],
      data: currentData
    };
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

  const meta: any = instance.getCellMeta(row, col);
  let appliedBg = false;
  let appliedText = false;

  if (meta?.bgColor) {
    td.style.backgroundColor = meta.bgColor;
    appliedBg = true;
  }
  if (meta?.textColor) {
    td.style.color = meta.textColor;
    appliedText = true;
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
    if (!hotInstance || !selectedCell) return;
    
    const selected = hotInstance.getSelected();
    if (selected && selected.length > 0) {
      const [startRow, startCol, endRow, endCol] = selected[0];
      
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const cellMeta = hotInstance.getCellMeta(row, col);
          hotInstance.setCellMeta(row, col, 'className', 
            cellMeta.className?.includes('font-bold') 
              ? cellMeta.className.replace('font-bold', '').trim() 
              : `${cellMeta.className || ''} font-bold`.trim()
          );
        }
      }
      hotInstance.render();
    }
  };

  const applyItalic = () => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance || !selectedCell) return;
    
    const selected = hotInstance.getSelected();
    if (selected && selected.length > 0) {
      const [startRow, startCol, endRow, endCol] = selected[0];
      
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const cellMeta = hotInstance.getCellMeta(row, col);
          hotInstance.setCellMeta(row, col, 'className', 
            cellMeta.className?.includes('italic') 
              ? cellMeta.className.replace('italic', '').trim() 
              : `${cellMeta.className || ''} italic`.trim()
          );
        }
      }
      hotInstance.render();
    }
  };

  const applyAlignment = (alignment: 'left' | 'center' | 'right') => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance || !selectedCell) return;
    
    const selected = hotInstance.getSelected();
    if (selected && selected.length > 0) {
      const [startRow, startCol, endRow, endCol] = selected[0];
      
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          let className = hotInstance.getCellMeta(row, col).className || '';
          className = className.replace(/text-(left|center|right)/g, '').trim();
          hotInstance.setCellMeta(row, col, 'className', `${className} text-${alignment}`.trim());
        }
      }
      hotInstance.render();
    }
  };

const applyFillColor = (color: string) => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance) {
      toast.error("Editor not ready");
      return;
    }
    
    // Use last selection even if grid lost focus
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
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        hotInstance.setCellMeta(row, col, 'bgColor', color);
      }
    }
    hotInstance.render();
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
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        hotInstance.setCellMeta(row, col, 'textColor', color);
      }
    }
    hotInstance.render();
    toast.success("Text color applied");
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
          />

          {/* Formatting Toolbar */}
          <FormattingToolbar
            onUndo={handleUndo}
            onRedo={handleRedo}
            onBold={applyBold}
            onItalic={applyItalic}
            onAlignment={applyAlignment}
            onFillColor={applyFillColor}
            onTextColor={applyTextColor}
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
              afterSelectionEnd={(r: number, c: number) => handleCellSelection(r, c)}
              undo={true}
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
