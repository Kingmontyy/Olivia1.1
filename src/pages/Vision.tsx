import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Eye } from "lucide-react";
import { toast } from "sonner";

const Vision = () => {
  const [vision, setVision] = useState(
    "Our goal is to reach $1M in annual recurring revenue by Q4 2025 through strategic expansion into the enterprise market while maintaining our core SMB customer base."
  );

  const handleSave = () => {
    // TODO: Save to Supabase visions table
    toast.success("Vision saved successfully!");
  };

  return (
    <AuthLayout>
      <div className="container py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="h-8 w-8 text-primary" />
            <h1 className="font-display font-bold text-3xl">Business Vision</h1>
          </div>
          <p className="text-muted-foreground">
            Define your business goals to help Olivia provide better insights
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Vision Statement</CardTitle>
              <CardDescription>
                Describe your business goals, targets, and strategic objectives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                rows={8}
                placeholder="Enter your business vision and goals..."
                className="resize-none"
              />
              <Button onClick={handleSave}>Save Vision</Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>How Olivia Uses Your Vision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                When you define your business vision, Olivia will:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Provide contextual insights aligned with your goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Suggest relevant scenarios based on your targets</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Highlight opportunities and risks related to your objectives</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Generate forecasts that match your strategic direction</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Vision;
