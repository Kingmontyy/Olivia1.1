import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Layers } from "lucide-react";
import { mockScenarios } from "@/lib/mock-data";

const Scenarios = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container py-8 max-w-6xl">
        <div className="mb-section">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="w-10 h-10 text-primary" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-3xl mb-2">
                Saving & Managing Scenarios
              </h1>
              <p className="text-muted-foreground text-lg">
                Access, compare, and manage your saved forecasts.
              </p>
            </div>
            <Button size="lg" className="font-semibold">
              New Scenario
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Scenarios</CardTitle>
              <CardDescription>
                {mockScenarios.length} scenarios saved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockScenarios.map((scenario) => (
                  <div 
                    key={scenario.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{scenario.name}</h3>
                        <Badge variant={scenario.status === "active" ? "default" : "secondary"}>
                          {scenario.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Created {scenario.date}
                      </p>
                      <div className="flex gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground">Projected Revenue</p>
                          <p className="font-mono font-semibold">{scenario.revenue}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Projected Profit</p>
                          <p className="font-mono font-semibold">{scenario.profit}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compare Scenarios</CardTitle>
              <CardDescription>
                Select multiple scenarios to compare side-by-side
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {mockScenarios.map((scenario) => (
                  <div 
                    key={scenario.id}
                    className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                  >
                    <h4 className="font-semibold mb-3">{scenario.name}</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="font-mono text-sm">{scenario.revenue}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Profit</p>
                        <p className="font-mono text-sm">{scenario.profit}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button>Compare Selected</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Scenarios;
