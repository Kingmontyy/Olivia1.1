// Core React hooks for state and lifecycle management
import { useState, useEffect, useRef } from "react";
// XLSX library for creating blank spreadsheets
import * as XLSX from "xlsx";
// Layout wrapper with authentication checks
import { AuthLayout } from "@/components/AuthLayout";
// UI components for cards and buttons
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
// Icons for UI elements
import { FileSpreadsheet, Plus, Upload, Trash2, Lock, ArrowRight } from "lucide-react";
// Toast notifications for user feedback
import { toast } from "sonner";
// Supabase client for database and storage operations
import { supabase } from "@/integrations/supabase/client";
// React Router for navigation
import { useNavigate } from "react-router-dom";
// Banner to show connectivity issues
import { ConnectivityBanner } from "@/components/ConnectivityBanner";
// Replace file confirmation dialog
import { ReplaceFileDialog } from "@/components/ReplaceFileDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Interface for uploaded file metadata from database
interface UploadedFile {
  id: string;
  file_name: string;
  file_type: string;
  created_at: string;
  edited_data: any;
  file_url: string;
}

// Main Playground component: File list and upload interface
const Playground = () => {
  // State for list of user's uploaded files
  const [files, setFiles] = useState<UploadedFile[]>([]);
  // State for core files
  const [coreFiles, setCoreFiles] = useState<{
    proforma: UploadedFile | null;
    inventory_logistics: UploadedFile | null;
    cashflow: UploadedFile | null;
  }>({
    proforma: null,
    inventory_logistics: null,
    cashflow: null,
  });
  // Loading state for initial file fetch
  const [loading, setLoading] = useState(true);
  // Upload in-progress flag
  const [uploading, setUploading] = useState(false);
  // Upload progress percentage (0-100)
  const [uploadProgress, setUploadProgress] = useState(0);
  // Error message for connection issues
  const [connectionError, setConnectionError] = useState<string | null>(null);
  // Reference to hidden file input element
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Replace dialog state
  const [replaceDialog, setReplaceDialog] = useState<{
    open: boolean;
    fileId: string;
    fileName: string;
    coreFileType: "proforma" | "inventory_logistics" | "cashflow";
  } | null>(null);
  const navigate = useNavigate();

  // Fetch user's files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  // Listen for network reconnection and retry fetch
  useEffect(() => {
    const handleOnline = () => {
      setConnectionError(null);
      fetchFiles();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Fetches all files for the current user from Supabase
  const fetchFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to view your files");
        return;
      }

      // Query uploaded_files table for user's files
      const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Separate core files from regular files
      const regularFiles = data?.filter(f => !f.is_core_file) || [];
      const coreFilesData = data?.filter(f => f.is_core_file) || [];
      
      setFiles(regularFiles);
      setCoreFiles({
        proforma: coreFilesData.find(f => f.core_file_type === "proforma") || null,
        inventory_logistics: coreFilesData.find(f => f.core_file_type === "inventory_logistics") || null,
        cashflow: coreFilesData.find(f => f.core_file_type === "cashflow") || null,
      });
    } catch (error: any) {
      console.error("Error fetching files:", error);
      const msg = error?.message || "";
      const isFetchFail = msg.includes("Failed to fetch") || error?.name === "TypeError";
      if (isFetchFail) {
        setConnectionError("We can’t reach the server right now. Please check your connection and try again.");
        toast.error("Connection issue: retrying...");
        setTimeout(fetchFiles, 3000);
      } else {
        toast.error("Failed to load files");
      }
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

        setUploadProgress(90);
        
        // Step 3: Trigger async parsing in background (fire and forget)
        console.log('Triggering background parse...');
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            supabase.functions.invoke('parse-file', {
              body: { fileId: fileRecord.id, filePath: uploadData.path }
            }).then(({ error }) => {
              if (error) console.error('Background parse error:', error);
            });
          }
        });

        setUploadProgress(100);
        toast.success(`${file.name} uploaded! Processing in background...`);
        
        // Immediate refresh to show the file
        fetchFiles();

      } catch (error: any) {
        console.error("Upload attempt failed:", error);
        
        // Retry logic for transient connectivity errors
        const isTransient = /network|Failed to fetch|TypeError/i.test(error?.message || '') || error?.name === 'TypeError';
        if (retryCount < maxRetries && isTransient) {
          retryCount++;
          console.log(`Retrying upload (attempt ${retryCount + 1})...`);
          toast.info('Connection issue, retrying upload...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptUpload();
        }

        // Show user-friendly error
        const errorMessage = error.message || "Upload failed. Please try again.";
        const isConnectivity = /Failed to fetch|TypeError/i.test(error?.message || '') || error?.name === 'TypeError';
        if (isConnectivity) {
          setConnectionError("We can’t reach the server right now. Please try again shortly.");
          toast.error("Upload failed due to connection. We'll be ready once you're back online.");
          return;
        }
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

  const handleCreateBlankSheet = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to create files");
        return;
      }

      // Create a blank workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([[""]]);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      // Convert to blob
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const fileName = `${user.id}/${Date.now()}.xlsx`;
      const displayName = `Untitled-${Date.now()}.xlsx`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploaded-files')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // Create database record
      const { error: dbError } = await supabase
        .from("uploaded_files")
        .insert({
          user_id: user.id,
          file_name: displayName,
          file_type: 'xlsx',
          file_url: uploadData.path,
          edited_data: null
        });

      if (dbError) {
        await supabase.storage.from('uploaded-files').remove([fileName]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      toast.success("Blank sheet created!");
      fetchFiles();
    } catch (error: any) {
      console.error("Error creating blank sheet:", error);
      toast.error(error.message || "Failed to create blank sheet");
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

  const handleMoveToCore = (fileId: string, fileName: string, coreFileType: "proforma" | "inventory_logistics" | "cashflow") => {
    setReplaceDialog({
      open: true,
      fileId,
      fileName,
      coreFileType,
    });
  };

  const confirmReplaceCore = async () => {
    if (!replaceDialog) return;

    try {
      const { fileId, coreFileType } = replaceDialog;

      // If there's an existing core file of this type, unset it
      const existingCoreFile = coreFiles[coreFileType];
      if (existingCoreFile) {
        await supabase
          .from("uploaded_files")
          .update({ is_core_file: false, core_file_type: null })
          .eq("id", existingCoreFile.id);
      }

      // Set the new file as core
      const { error } = await supabase
        .from("uploaded_files")
        .update({ 
          is_core_file: true, 
          core_file_type: coreFileType 
        })
        .eq("id", fileId);

      if (error) throw error;

      toast.success(`File set as ${coreFileType.replace('_', ' ')} core file`);
      fetchFiles();
    } catch (error) {
      console.error("Error setting core file:", error);
      toast.error("Failed to set core file");
    } finally {
      setReplaceDialog(null);
    }
  };

  const renderCoreFileSlot = (
    type: "proforma" | "inventory_logistics" | "cashflow",
    label: string
  ) => {
    const file = coreFiles[type];

    return (
      <div className="border-2 border-dashed rounded-lg p-6 min-h-[120px] flex items-center justify-center">
        {file ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="font-semibold">{file.file_name}</p>
                <p className="text-sm text-muted-foreground">
                  Set as core on {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/playground/${file.id}`)}
            >
              View
            </Button>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No {label} file set</p>
            <p className="text-xs mt-1">Select a file from "Your Files" to set as core</p>
          </div>
        )}
      </div>
    );
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
        {connectionError && (
          <ConnectivityBanner message={connectionError} onRetry={fetchFiles} />
        )}
        
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
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Core Files</CardTitle>
                  <CardDescription>
                    Protected files that feed dashboard data. Only updatable by Olivia via APIs.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Proforma File</h3>
                {renderCoreFileSlot("proforma", "Proforma")}
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Inventory Logistics File</h3>
                {renderCoreFileSlot("inventory_logistics", "Inventory Logistics")}
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Cashflow File</h3>
                {renderCoreFileSlot("cashflow", "Cashflow")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Files</CardTitle>
                  <CardDescription>Uploaded and edited spreadsheets</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleCreateBlankSheet}>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleMoveToCore(file.id, file.file_name, "proforma")}
                            >
                              Set as Proforma
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleMoveToCore(file.id, file.file_name, "inventory_logistics")}
                            >
                              Set as Inventory Logistics
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleMoveToCore(file.id, file.file_name, "cashflow")}
                            >
                              Set as Cashflow
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

        {replaceDialog && (
          <ReplaceFileDialog
            open={replaceDialog.open}
            onOpenChange={(open) => !open && setReplaceDialog(null)}
            onConfirm={confirmReplaceCore}
            coreFileType={replaceDialog.coreFileType}
            existingFileName={coreFiles[replaceDialog.coreFileType]?.file_name}
            newFileName={replaceDialog.fileName}
          />
        )}
      </div>
    </AuthLayout>
  );
};

export default Playground;
