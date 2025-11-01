import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Link } from "react-router-dom";
import { TrendingUp, Brain, Target, LineChart } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-section">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="font-display font-bold text-4xl lg:text-5xl leading-tight">
                AI-Powered Financial Forecasting for Data-Driven Growth
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Unify your financial data, explore scenarios with AI, and make confident strategic decisions. 
                Built for growth strategists, operations optimizers, and financial planners.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/dashboard">
                  <Button size="lg" className="font-semibold">
                    Start Free Trial
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="font-semibold">
                  Watch Demo
                </Button>
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="w-full h-96 rounded-lg shadow-lg bg-primary/10 flex items-center justify-center">
                <LineChart className="w-32 h-32 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-section bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl mb-4">
              Everything You Need to Forecast with Confidence
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Connect your data sources, visualize performance, and model scenarios—all in one platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-lg border shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-3">
                Real-Time Performance
              </h3>
              <p className="text-muted-foreground">
                Track KPIs across daily, weekly, monthly, and yearly views. Drill down into trends and anomalies instantly.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-lg border shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-3">
                AI-Powered Forecasting
              </h3>
              <p className="text-muted-foreground">
                Ask questions in plain language and generate predictive scenarios based on your historical data.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-lg border shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-3">
                Scenario Planning
              </h3>
              <p className="text-muted-foreground">
                Model "what-if" scenarios, save multiple forecasts, and compare outcomes side-by-side.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-section">
        <div className="container">
          <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center">
            <h2 className="font-display font-bold text-3xl mb-4">
              Ready to Make Smarter Decisions?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join growth strategists, operations teams, and financial planners using Olivia to drive data-backed growth.
            </p>
            <Link to="/dashboard">
              <Button size="lg" variant="secondary" className="font-semibold">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container text-center text-muted-foreground">
          <p>© 2025 Olivia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
