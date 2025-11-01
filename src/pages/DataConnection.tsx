import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import dataConnectionHero from "@/assets/data-connection-hero.png";

const DataConnection = () => {
  const dataSources = [
    { name: "QuickBooks", connected: true },
    { name: "ShipHero", connected: true },
    { name: "Google Sheets", connected: true },
    { name: "American Express", connected: false },
    { name: "Shopify", connected: true },
    { name: "Mercury Bank", connected: false }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container py-8 max-w-5xl">
        <div className="mb-section">
          <img 
            src={dataConnectionHero} 
            alt="Data Connection" 
            className="w-full h-48 object-cover rounded-lg mb-6"
          />
          <h1 className="font-display font-bold text-3xl mb-2">
            Initial Data Connection & Dashboard Setup
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect your financial platforms to start analyzing and forecasting.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connect Data Sources</CardTitle>
              <CardDescription>
                Link your platforms to import financial, performance, and logistics data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {dataSources.map((source) => (
                  <div 
                    key={source.name}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {source.connected ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="font-semibold">{source.name}</span>
                    </div>
                    <Button 
                      variant={source.connected ? "outline" : "default"}
                      size="sm"
                    >
                      {source.connected ? "Connected" : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Existing Files</CardTitle>
              <CardDescription>
                Import your Pro-forma, Cashflow, and Logistics spreadsheets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Drag and drop files here, or click to browse
                </p>
                <Button variant="outline">Choose Files</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Supported formats: .xlsx, .csv, Google Sheets links
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" className="font-semibold">
              Complete Setup
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DataConnection;
