import { useState, useEffect, useRef } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Plus, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

interface UploadedFile {
  id: string;
  file_name: string;
  file_type: string;
  created_at: string;
  edited_data: any;
}

const Playground = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to view your files");
        return;
      }

      const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const parseFileToJSON = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { 
            type: "binary",
            cellFormula: true,
            cellStyles: true,
            cellDates: true
          });
          
          // Parse all sheets with full data including formulas and styles
          const sheets = workbook.SheetNames.map((sheetName, index) => {
            const worksheet = workbook.Sheets[sheetName];
            
            // Get sheet data with formulas preserved
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
            const rows: any[][] = [];
            
            for (let R = range.s.r; R <= range.e.r; ++R) {
              const row: any[] = [];
              for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = worksheet[cellAddress];
                
                if (cell) {
                  row.push({
                    v: cell.v, // value
                    f: cell.f, // formula
                    t: cell.t, // type
                    s: cell.s, // style
                    w: cell.w  // formatted text
                  });
                } else {
                  row.push(null);
                }
              }
              rows.push(row);
            }
            
            return {
              name: sheetName,
              index: index,
              data: rows,
              config: {
                columnCount: range.e.c + 1,
                rowCount: range.e.r + 1
              }
            };
          });
          
          resolve({ sheets });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to upload files");
        return;
      }

      // Parse file to JSON with full structure
      const parsedData = await parseFileToJSON(file);
      
      // Insert into Supabase
      const { error } = await supabase
        .from("uploaded_files")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.name.endsWith('.csv') ? 'csv' : 'xlsx',
          file_url: '', // We're storing parsed data, not the file itself
          edited_data: parsedData
        });

      if (error) throw error;

      toast.success(`Uploaded: ${file.name}`);
      fetchFiles(); // Refresh the list
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please ensure it's a valid spreadsheet.");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    try {
      const { error } = await supabase
        .from("uploaded_files")
        .delete()
        .eq("id", fileId);

      if (error) throw error;

      toast.success(`Deleted: ${fileName}`);
      fetchFiles(); // Refresh the list
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  return (
    <AuthLayout>
      <div className="container py-8 max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl mb-2">Playground</h1>
            <p className="text-muted-foreground">
              Upload, edit, and manage your spreadsheets
            </p>
          </div>
          <Button 
            onClick={handleUploadClick}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Files</CardTitle>
                  <CardDescription>Uploaded and edited spreadsheets</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Blank Sheet
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading files...</p>
              ) : files.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No files uploaded yet. Click the Upload button to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-semibold">{file.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/playground/${file.id}`)}
                        >
                          Open Editor
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(file.id, file.file_name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Playground;
