import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, Plus } from "lucide-react";
import { toast } from "sonner";

const Playground = () => {
  const [files, setFiles] = useState([
    { id: "1", name: "Q4_Financials.xlsx", type: "xlsx", uploadedAt: "2024-01-15" },
    { id: "2", name: "Sales_Data.csv", type: "csv", uploadedAt: "2024-01-10" },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`Uploaded: ${file.name}`);
      // TODO: Implement actual file upload to Supabase
    }
  };

  return (
    <AuthLayout>
      <div className="container py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl mb-2">Playground</h1>
          <p className="text-muted-foreground">
            Upload, edit, and manage your spreadsheets
          </p>
        </div>

        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload New File</CardTitle>
              <CardDescription>
                Upload Excel (.xlsx) or CSV files to analyze
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
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
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Blank Sheet
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-semibold">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {file.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Open Editor
                      </Button>
                      <Button variant="ghost" size="sm">
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Playground;
