import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { Plus, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { MenuBar } from "@/components/editor/MenuBar";
import { FormattingToolbar } from "@/components/editor/FormattingToolbar";
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
  const hotRef = useRef<any>(null);

  useEffect(() => {
    if (fileId) {
      fetchFileData();
    }
  }, [fileId]);

  useEffect(() => {
    if (sheets.length > 0 && activeSheetIndex >= 0 && activeSheetIndex < sheets.length) {
      const sheetData = sheets[activeSheetIndex].data || [];
      console.log("Loading sheet data:", sheetData.length, "rows");
      // Convert cell objects to display values for Handsontable
      const displayData = sheetData.map(row => 
        row.map(cell => {
          if (cell && typeof cell === 'object' && 'v' in cell) {
            return cell.w || cell.v || ""; // Use formatted text, then value
          }
          return cell || "";
        })
      );
      console.log("Converted to display data:", displayData.length, "rows");
      setTableData(displayData);
    }
  }, [activeSheetIndex, sheets]);

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
          // Empty or invalid data
          console.warn("Empty or invalid data, creating blank sheet");
          toast.info("No data found in file. Please re-upload or start with a blank sheet.");
          const emptyGrid = createEmptyGrid(50, 26);
          const sheet: SheetData = {
            name: "Sheet1",
            index: 0,
            data: emptyGrid,
            config: { columnCount: 26, rowCount: 50 }
          };
          setSheets([sheet]);
        }
      } else {
        // No data, create blank sheet
        console.log("No data found, creating blank sheet");
        toast.info("Starting with blank sheet. Upload a file in Playground to load data.");
        const emptyGrid = createEmptyGrid(50, 26);
        const sheet: SheetData = {
          name: "Sheet1",
          index: 0,
          data: emptyGrid,
          config: { columnCount: 26, rowCount: 50 }
        };
        setSheets([sheet]);
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

  const handleCellSelection = () => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance) return;

    const selected = hotInstance.getSelected();
    if (selected && selected.length > 0) {
      const [row, col] = selected[0];
      setSelectedCell({ row, col });
      
      // Check if original cell has a formula
      const sheet = sheets[activeSheetIndex];
      if (sheet && sheet.data[row] && sheet.data[row][col]) {
        const cellObj = sheet.data[row][col];
        if (cellObj && typeof cellObj === 'object' && 'f' in cellObj && cellObj.f) {
          // Show formula in formula bar if it exists
          setFormulaBarValue("=" + cellObj.f);
          return;
        }
      }
      
      // Otherwise show the current value
      const cellValue = hotInstance.getDataAtCell(row, col);
      setFormulaBarValue(cellValue || "");
    }
  };

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
      <div className="flex flex-col h-screen w-full">
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

        {/* Spreadsheet Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Grid */}
          <div className="flex-1 overflow-auto">
            <HotTable
              ref={hotRef}
              data={tableData}
              colHeaders={true}
              rowHeaders={true}
              width="100%"
              height="100%"
              licenseKey="non-commercial-and-evaluation"
              stretchH="all"
              manualColumnResize={true}
              manualRowResize={true}
              contextMenu={true}
              filters={true}
              dropdownMenu={true}
              afterSelection={handleCellSelection}
              undo={true}
            />
          </div>

          {/* Sheet Tabs */}
          <div className="border-t bg-muted/30 px-2 py-1.5 flex items-center gap-1 overflow-x-auto">
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
