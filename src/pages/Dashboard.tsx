import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Database, LineChart, FolderKanban, LayoutDashboard } from "lucide-react";

const Dashboard = () => {
  const workflows = [
    {
      title: "Data Connection",
      description: "Connect your financial data sources",
      icon: Database,
      href: "/initial-data-connection-dashboard-setup",
      color: "text-blue-600"
    },
    {
      title: "Performance Analysis",
      description: "View current and historical performance",
      icon: TrendingUp,
      href: "/understanding-current-past-performance",
      color: "text-green-600"
    },
    {
      title: "Forecasting",
      description: "Model scenarios and predict outcomes",
      icon: LineChart,
      href: "/forecasting-scenario-planning",
      color: "text-purple-600"
    },
    {
      title: "Saved Scenarios",
      description: "Manage your saved forecasts",
      icon: FolderKanban,
      href: "/saving-managing-scenarios",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container py-8">
        {/* Hero Banner */}
        <div className="mb-section">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-10 h-10 text-primary" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="font-display font-bold text-3xl mb-2">
              Welcome to Your Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Monitor performance, forecast outcomes, and make data-driven decisions.
            </p>
            <Button 
              onClick={() => console.log("Connected!")} 
              className="mt-4"
            >
              Test GitHub
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-section">
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

        {/* Workflows */}
        <div>
          <h2 className="font-display font-bold text-2xl mb-6">Your Workflows</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {workflows.map((workflow) => {
              const Icon = workflow.icon;
              return (
                <Card key={workflow.href} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${workflow.color}`} />
                          {workflow.title}
                        </CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link to={workflow.href}>
                      <Button variant="outline" className="w-full">
                        Open Workflow
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
