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
                  <CardTitle>Monthly Trends</CardTitle>
                  <CardDescription>Revenue and profit over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground">Chart visualization placeholder</p>
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
      </div>
    </AuthLayout>
  );
};

export default Dashboard;
