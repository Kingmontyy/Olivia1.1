import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, DollarSign, TrendingDown } from "lucide-react";

const Forecasts = () => {
  return (
    <AuthLayout>
      <div className="container py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl mb-2">Forecasting & Scenario Planning</h1>
          <p className="text-muted-foreground">
            Create AI-powered forecasts and explore what-if scenarios
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Scenario</CardTitle>
              <CardDescription>Define parameters for your forecast</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-name">Scenario Name</Label>
                  <Input id="scenario-name" placeholder="e.g., Q2 Growth Plan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeframe">Forecast Timeframe</Label>
                  <Input id="timeframe" placeholder="e.g., 6 months" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marketing">Marketing Spend Change (%)</Label>
                  <Input id="marketing" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cogs">COGS Change (%)</Label>
                  <Input id="cogs" type="number" placeholder="0" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea id="notes" placeholder="Describe your scenario assumptions..." />
              </div>

              <Button>Generate Forecast</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ask Olivia</CardTitle>
              <CardDescription>Get AI-powered insights about your scenario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold">Example questions:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• "What if I increase ad spend by 10%?"</li>
                  <li>• "How does hiring 2 more sales reps affect revenue?"</li>
                  <li>• "What's my break-even point if prices drop 5%?"</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Ask Olivia about your forecast..." />
                <Button>Ask</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forecasted Outcomes</CardTitle>
              <CardDescription>Based on your scenario parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Projected Revenue</p>
                        <p className="text-2xl font-bold">$125,000</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Projected Profit</p>
                        <p className="text-2xl font-bold">$35,000</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">ROI</p>
                        <p className="text-2xl font-bold">28%</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">Adjust Parameters</Button>
                <Button>Save Scenario</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Forecasts;
