import { useState, useEffect, useRef } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileSpreadsheet, Plus, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface UploadedFile {
  id: string;
  file_name: string;
  file_type: string;
  created_at: string;
  edited_data: any;
  file_url: string;
}

const Playground = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (file.size > maxSize) {
      return "File too large—max 5MB. Split file or use smaller version.";
    }

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return "Invalid format—only .xlsx, .xls, and .csv files are supported.";
    }

    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('Upload started:', file.name, file.size, file.type);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    let retryCount = 0;
    const maxRetries = 1;

    const attemptUpload = async (): Promise<void> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Please log in to upload files");
        }

        console.log('User authenticated:', user.id);

        // Step 1: Upload file to storage (30%)
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        setUploadProgress(10);
        console.log('Uploading to storage:', fileName);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('uploaded-files')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        console.log('File uploaded to storage:', uploadData.path);
        setUploadProgress(40);

        // Step 2: Create database record (60%)
        const { data: fileRecord, error: dbError } = await supabase
          .from("uploaded_files")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_type: file.name.endsWith('.csv') ? 'csv' : 'xlsx',
            file_url: uploadData.path,
            edited_data: null // Will be populated by edge function
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database insert error:', dbError);
          // Clean up uploaded file
          await supabase.storage.from('uploaded-files').remove([fileName]);
          throw new Error(`Database error: ${dbError.message}`);
        }

        console.log('Database record created:', fileRecord.id);
        setUploadProgress(70);

        // Step 3: Trigger async parsing (90%)
        console.log('Triggering parse function...');
        
        // Ensure we have a valid session before calling the edge function
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('Session error:', sessionError);
          toast.warning('File uploaded but parsing requires authentication. Please refresh and try again.');
        } else {
          const { error: parseError } = await supabase.functions.invoke('parse-file', {
            body: {
              fileId: fileRecord.id,
              filePath: uploadData.path
            }
          });

          if (parseError) {
            console.error('Parse function error:', parseError);
            // Don't fail the upload, just warn the user
            toast.warning(`File uploaded but parsing delayed. Refresh to check status.`);
          } else {
            console.log('Parse function triggered successfully');
          }
        }

        setUploadProgress(100);
        toast.success(`Uploaded: ${file.name}`);
        
        // Refresh the list after a brief delay to allow parsing
        setTimeout(() => fetchFiles(), 1000);

      } catch (error: any) {
        console.error("Upload attempt failed:", error);
        
        // Retry logic for transient errors
        if (retryCount < maxRetries && error.message?.includes('network')) {
          retryCount++;
          console.log(`Retrying upload (attempt ${retryCount + 1})...`);
          toast.info(`Retrying upload...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptUpload();
        }

        // Show user-friendly error
        const errorMessage = error.message || "Upload failed. Please try again.";
        toast.error(errorMessage);
        throw error;
      }
    };

    try {
      await attemptUpload();
    } catch (error) {
      console.error("Upload failed after retries:", error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (fileId: string, fileName: string, fileUrl: string) => {
    try {
      console.log('Deleting file:', fileId, fileUrl);

      // Delete from database
      const { error: dbError } = await supabase
        .from("uploaded_files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      // Delete from storage if file_url exists
      if (fileUrl) {
        const { error: storageError } = await supabase.storage
          .from('uploaded-files')
          .remove([fileUrl]);

        if (storageError) {
          console.error('Storage delete error:', storageError);
          // Don't fail the operation, file record is already deleted
        }
      }

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
            disabled={uploading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {uploading && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            </CardContent>
          </Card>
        )}

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
                          onClick={() => handleDelete(file.id, file.file_name, file.file_url)}
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
