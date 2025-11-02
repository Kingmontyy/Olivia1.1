import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, FileSpreadsheet, GitBranch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Favorites = () => {
  const favoriteSheets = [
    { id: "1", name: "Q4_Financials.xlsx", type: "sheet" },
    { id: "2", name: "Sales_Data.csv", type: "sheet" },
  ];

  const favoriteScenarios = [
    { id: "1", name: "Aggressive Growth Plan", type: "scenario" },
    { id: "2", name: "Conservative Budget", type: "scenario" },
  ];

  return (
    <AuthLayout>
      <div className="container py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-8 w-8 text-primary" />
            <h1 className="font-display font-bold text-3xl">Favorites</h1>
          </div>
          <p className="text-muted-foreground">
            Quick access to your starred sheets and scenarios
          </p>
        </div>

        <Tabs defaultValue="sheets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sheets">Sheets</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          </TabsList>

          <TabsContent value="sheets">
            <Card>
              <CardHeader>
                <CardTitle>Favorite Sheets</CardTitle>
                <CardDescription>Your most important spreadsheets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {favoriteSheets.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-6 w-6 text-primary" />
                        <p className="font-semibold">{item.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Open</Button>
                        <Button variant="ghost" size="sm">
                          <Star className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scenarios">
            <Card>
              <CardHeader>
                <CardTitle>Favorite Scenarios</CardTitle>
                <CardDescription>Your saved forecast scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {favoriteScenarios.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-6 w-6 text-primary" />
                        <p className="font-semibold">{item.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">View</Button>
                        <Button variant="ghost" size="sm">
                          <Star className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthLayout>
  );
};

export default Favorites;
