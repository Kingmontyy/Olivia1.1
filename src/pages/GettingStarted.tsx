import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const steps = [
  {
    title: "Sign Up",
    description: "Create your account to get started with Olivia",
  },
  {
    title: "Connect APIs",
    description: "Link your data sources in Settings for real-time insights",
  },
  {
    title: "Upload Sheets",
    description: "Import your Excel or CSV files in the Playground",
  },
  {
    title: "Explore Dashboard",
    description: "View your business metrics and AI-powered forecasts",
  },
];

const GettingStarted = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="font-display font-bold text-4xl mb-4">Getting Started with Olivia</h1>
          <p className="text-xl text-muted-foreground">
            Follow these simple steps to unlock AI-powered financial insights
          </p>
        </div>

        <div className="space-y-6 mb-12">
          {steps.map((step, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription className="mt-2">{step.description}</CardDescription>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <h2 className="font-display font-bold text-2xl mb-4">Ready to Start?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of businesses making smarter decisions with AI
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/landing">
              <Button variant="outline">Back to Home</Button>
            </Link>
            <Link to="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GettingStarted;
