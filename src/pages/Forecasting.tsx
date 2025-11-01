import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart } from "lucide-react";

const Forecasting = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container py-8 max-w-6xl">
        <div className="mb-section">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
              <LineChart className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="font-display font-bold text-3xl mb-2">
            Forecasting & Scenario Planning
          </h1>
          <p className="text-muted-foreground text-lg">
            Model "what-if" scenarios and predict financial outcomes based on your data.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Scenario</CardTitle>
                <CardDescription>Define parameters for your forecast</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-name">Scenario Name</Label>
                  <Input 
                    id="scenario-name" 
                    placeholder="e.g., 10% Marketing Increase" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="marketing">Marketing Spend Change (%)</Label>
                  <Input 
                    id="marketing" 
                    type="number" 
                    placeholder="0" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cogs">COGS Change (%)</Label>
                  <Input 
                    id="cogs" 
                    type="number" 
                    placeholder="0" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="revenue">Expected Revenue Change (%)</Label>
                  <Input 
                    id="revenue" 
                    type="number" 
                    placeholder="0" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeframe">Forecast Timeframe</Label>
                  <select 
                    id="timeframe"
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option>Next Quarter</option>
                    <option>Next 6 Months</option>
                    <option>Next Year</option>
                  </select>
                </div>
                
                <Button className="w-full font-semibold">Generate Forecast</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ask Olivia</CardTitle>
                <CardDescription>Refine your scenario with AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm">What if I increase marketing by 15% and COGS rises by 5%?</p>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="text-sm">Based on historical data, a 15% marketing increase typically yields 8-12% revenue growth. Combined with 5% COGS increase, you'd see net profit margin of approximately 18-20%.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ask a what-if question..." 
                    className="flex-1 px-4 py-2 border rounded-lg"
                  />
                  <Button>Send</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Forecasted Outcomes</CardTitle>
                <CardDescription>Predicted results for Q1 2025</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Projected Revenue</p>
                    <p className="text-2xl font-mono font-semibold">$512K</p>
                    <p className="text-sm text-green-600 mt-1">+12% growth</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Projected Profit</p>
                    <p className="text-2xl font-mono font-semibold">$98K</p>
                    <p className="text-sm text-green-600 mt-1">+8% growth</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Marketing ROI</p>
                    <p className="text-2xl font-mono font-semibold">3.2x</p>
                    <p className="text-sm text-muted-foreground mt-1">Per dollar spent</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Cash Flow</p>
                    <p className="text-2xl font-mono font-semibold">$142K</p>
                    <p className="text-sm text-green-600 mt-1">+15% increase</p>
                  </div>
                </div>
                
                <div className="h-48 flex items-center justify-center border rounded-lg bg-muted/30">
                  <p className="text-muted-foreground">Forecast chart visualization</p>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    Adjust Parameters
                  </Button>
                  <Button className="flex-1 font-semibold">
                    Save Scenario
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Forecasting;
