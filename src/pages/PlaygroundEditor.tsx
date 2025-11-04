import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { ArrowLeft, Save, Plus, FileDown } from "lucide-react";
import * as XLSX from "xlsx";

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
  const hotRef = useRef<any>(null);

  useEffect(() => {
    if (fileId) {
      fetchFileData();
    }
  }, [fileId]);

  useEffect(() => {
    if (sheets.length > 0 && activeSheetIndex >= 0 && activeSheetIndex < sheets.length) {
      setTableData(sheets[activeSheetIndex].data || []);
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

      setFileData(data);
      
      // Convert stored data to sheet format
      if (data.edited_data) {
        const editedData = data.edited_data as any;
        if (editedData.sheets && Array.isArray(editedData.sheets)) {
          // Multi-sheet format
          setSheets(editedData.sheets);
          setTableData(editedData.sheets[0]?.data || createEmptyGrid(50, 26));
        } else if (Array.isArray(editedData)) {
          // Legacy single-sheet format (array of objects)
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
          const emptyGrid = createEmptyGrid(50, 26);
          const sheet: SheetData = {
            name: "Sheet1",
            index: 0,
            data: emptyGrid,
            config: { columnCount: 26, rowCount: 50 }
          };
          setSheets([sheet]);
          setTableData(emptyGrid);
        }
      } else {
        // No data, create blank sheet
        const emptyGrid = createEmptyGrid(50, 26);
        const sheet: SheetData = {
          name: "Sheet1",
          index: 0,
          data: emptyGrid,
          config: { columnCount: 26, rowCount: 50 }
        };
        setSheets([sheet]);
        setTableData(emptyGrid);
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
      <div className="container py-4 max-w-full h-[calc(100vh-6rem)] flex flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="font-display font-bold text-xl md:text-2xl">
              {fileData?.file_name || "Spreadsheet Editor"}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              size="sm"
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Spreadsheet Container */}
        <div className="flex-1 flex flex-col bg-background border rounded-lg overflow-hidden">
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
            />
          </div>

          {/* Sheet Tabs */}
          <div className="border-t bg-muted/30 p-2 flex items-center gap-2 overflow-x-auto">
            {sheets.map((sheet, index) => (
              <button
                key={index}
                onClick={() => handleSheetChange(index)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                  activeSheetIndex === index
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                {sheet.name}
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddSheet}
              className="ml-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default PlaygroundEditor;
