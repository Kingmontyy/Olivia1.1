import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";

const Dashboard = () => {

  return (
    <AuthLayout>
      <div className="container py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Connected Sources</CardDescription>
              <CardTitle className="text-3xl font-mono">6</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">All systems active</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Scenarios</CardDescription>
              <CardTitle className="text-3xl font-mono">3</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Ready for review</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Data Points</CardDescription>
              <CardTitle className="text-3xl font-mono">12.4K</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Forecast Accuracy</CardDescription>
              <CardTitle className="text-3xl font-mono">94%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Based on history</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Analysis */}
        <div className="space-y-6">
          <h2 className="font-display font-bold text-2xl">Performance Analysis</h2>
          
          <Tabs defaultValue="monthly" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Revenue</CardDescription>
                    <CardTitle className="text-3xl font-mono">$428K</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-600">+12.3% vs last month</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Net Profit</CardDescription>
                    <CardTitle className="text-3xl font-mono">$87K</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-600">+8.1% vs last month</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Operating Costs</CardDescription>
                    <CardTitle className="text-3xl font-mono">$341K</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-600">+4.2% vs last month</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Proforma Quick View</CardTitle>
                  <CardDescription>Projected financial overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="font-semibold text-muted-foreground">Line Item</div>
                      <div className="font-semibold text-muted-foreground text-right">Projected</div>
                      <div className="font-semibold text-muted-foreground text-right">Actual</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm py-2 border-b">
                        <div>Revenue</div>
                        <div className="text-right font-mono">$450K</div>
                        <div className="text-right font-mono">$428K</div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm py-2 border-b">
                        <div>Cost of Sales</div>
                        <div className="text-right font-mono">$180K</div>
                        <div className="text-right font-mono">$175K</div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm py-2 border-b">
                        <div>Gross Profit</div>
                        <div className="text-right font-mono">$270K</div>
                        <div className="text-right font-mono">$253K</div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm py-2 border-b">
                        <div>Operating Expenses</div>
                        <div className="text-right font-mono">$165K</div>
                        <div className="text-right font-mono">$166K</div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm py-2 border-t-2 font-semibold">
                        <div>Net Profit</div>
                        <div className="text-right font-mono">$105K</div>
                        <div className="text-right font-mono">$87K</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="daily">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">Daily performance view coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weekly">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">Weekly performance view coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="yearly">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">Yearly performance view coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Supply Chain View */}
        <div className="space-y-6 mt-8">
          <h2 className="font-display font-bold text-2xl">Supply Chain Overview</h2>
          
          <Tabs defaultValue="favorites" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="favorites">Favorite SKUs</TabsTrigger>
              <TabsTrigger value="timeframe">COGS by Period</TabsTrigger>
            </TabsList>

            <TabsContent value="favorites" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Favorite SKU Inventory Status</CardTitle>
                  <CardDescription>Current velocity and inventory levels for tracked items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-muted-foreground border-b pb-2">
                      <div>SKU Code</div>
                      <div>Product Name</div>
                      <div className="text-right">Velocity/Day</div>
                      <div className="text-right">Days Left</div>
                      <div className="text-right">Unit COGS</div>
                      <div className="text-right">Total Value</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-6 gap-4 text-sm py-3 border-b hover:bg-muted/30 transition-colors">
                        <div className="font-mono">SKU-001</div>
                        <div>Premium Widget A</div>
                        <div className="text-right font-mono">12.5</div>
                        <div className="text-right font-mono text-orange-600">23</div>
                        <div className="text-right font-mono">$24.50</div>
                        <div className="text-right font-mono">$7,035</div>
                      </div>
                      
                      <div className="grid grid-cols-6 gap-4 text-sm py-3 border-b hover:bg-muted/30 transition-colors">
                        <div className="font-mono">SKU-042</div>
                        <div>Standard Component B</div>
                        <div className="text-right font-mono">8.2</div>
                        <div className="text-right font-mono text-green-600">67</div>
                        <div className="text-right font-mono">$15.30</div>
                        <div className="text-right font-mono">$8,414</div>
                      </div>
                      
                      <div className="grid grid-cols-6 gap-4 text-sm py-3 border-b hover:bg-muted/30 transition-colors">
                        <div className="font-mono">SKU-128</div>
                        <div>Deluxe Package C</div>
                        <div className="text-right font-mono">5.7</div>
                        <div className="text-right font-mono text-red-600">12</div>
                        <div className="text-right font-mono">$42.80</div>
                        <div className="text-right font-mono">$2,926</div>
                      </div>
                      
                      <div className="grid grid-cols-6 gap-4 text-sm py-3 hover:bg-muted/30 transition-colors">
                        <div className="font-mono">SKU-256</div>
                        <div>Basic Unit D</div>
                        <div className="text-right font-mono">15.3</div>
                        <div className="text-right font-mono text-green-600">45</div>
                        <div className="text-right font-mono">$8.90</div>
                        <div className="text-right font-mono">$6,127</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-6 gap-4 text-sm pt-4 border-t-2 font-semibold">
                      <div className="col-span-5 text-right">Total Inventory Value:</div>
                      <div className="text-right font-mono">$24,502</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeframe" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>COGS by Time Period</CardTitle>
                  <CardDescription>Cost of goods sold trends over selected timeframe</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <select className="px-4 py-2 border rounded-lg bg-background">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                        <option>Last 12 Months</option>
                        <option>Custom Range</option>
                      </select>
                    </div>
                    
                    <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/30">
                      <p className="text-muted-foreground">COGS trend chart visualization</p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>Average Daily COGS</CardDescription>
                          <CardTitle className="text-2xl font-mono">$2,847</CardTitle>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>Total Period COGS</CardDescription>
                          <CardTitle className="text-2xl font-mono">$85,410</CardTitle>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>COGS Trend</CardDescription>
                          <CardTitle className="text-2xl font-mono text-green-600">-3.2%</CardTitle>
                        </CardHeader>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Dashboard;
