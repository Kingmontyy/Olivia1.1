import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { ArrowLeft, Save } from "lucide-react";

// Register Handsontable modules
registerAllModules();

interface FileData {
  id: string;
  file_name: string;
  edited_data: any;
}

const PlaygroundEditor = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [tableData, setTableData] = useState<any[][]>([]);
  const hotRef = useRef<any>(null);

  useEffect(() => {
    if (fileId) {
      fetchFileData();
    }
  }, [fileId]);

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
      
      // Convert JSONB data to 2D array for Handsontable
      if (data.edited_data && Array.isArray(data.edited_data)) {
        const rows = data.edited_data;
        if (rows.length > 0) {
          // Get all unique keys from all objects
          const headers = Array.from(
            new Set(rows.flatMap((row: any) => Object.keys(row)))
          );
          
          // Convert to 2D array with headers as first row
          const tableArray = [
            headers,
            ...rows.map((row: any) => headers.map((header) => row[header] ?? ""))
          ];
          setTableData(tableArray);
        } else {
          // Empty data, create blank grid
          setTableData(createEmptyGrid(10, 10));
        }
      } else {
        // No data, create blank grid
        setTableData(createEmptyGrid(10, 10));
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

  const handleSave = async () => {
    try {
      const hotInstance = hotRef.current?.hotInstance;
      if (!hotInstance) return;

      const data = hotInstance.getData();
      
      // Convert 2D array back to array of objects
      if (data.length > 0) {
        const headers = data[0];
        const rows = data.slice(1).map((row: any[]) => {
          const obj: any = {};
          headers.forEach((header: string, index: number) => {
            if (header) {
              obj[header] = row[index] || "";
            }
          });
          return obj;
        });

        const { error } = await supabase
          .from("uploaded_files")
          .update({ 
            edited_data: rows,
            updated_at: new Date().toISOString()
          })
          .eq("id", fileId);

        if (error) throw error;

        toast.success("File saved successfully");
      }
    } catch (error) {
      console.error("Error saving file:", error);
      toast.error("Failed to save file");
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
      <div className="container py-8 max-w-full">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="font-display font-bold text-2xl">
              {fileData?.file_name || "Spreadsheet Editor"}
            </h1>
          </div>
          <Button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>

        <div className="bg-background border rounded-lg p-4 overflow-auto">
          <HotTable
            ref={hotRef}
            data={tableData}
            colHeaders={true}
            rowHeaders={true}
            width="100%"
            height="600"
            licenseKey="non-commercial-and-evaluation"
            stretchH="all"
            manualColumnResize={true}
            manualRowResize={true}
            contextMenu={true}
            filters={true}
            dropdownMenu={true}
          />
        </div>
      </div>
    </AuthLayout>
  );
};

export default PlaygroundEditor;
