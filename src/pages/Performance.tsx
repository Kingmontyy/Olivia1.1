import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";

const Performance = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container py-8 max-w-6xl">
        <div className="mb-section">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="font-display font-bold text-3xl mb-2">
            Understanding Current & Past Performance
          </h1>
          <p className="text-muted-foreground text-lg">
            Analyze trends, drill into metrics, and get AI-powered insights on your data.
          </p>
        </div>

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

            <Card>
              <CardHeader>
                <CardTitle>Ask Olivia</CardTitle>
                <CardDescription>Get AI insights about your performance data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm">What was my net profit last quarter?</p>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="text-sm">Your net profit for Q4 2024 was $254,000, representing a 15% increase from Q3.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ask about your data..." 
                    className="flex-1 px-4 py-2 border rounded-lg"
                  />
                  <Button>Send</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily">
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Daily view coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Weekly view coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="yearly">
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Yearly view coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Performance;
