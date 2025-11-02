import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Brain, Target } from "lucide-react";
import { LoginModal } from "@/components/LoginModal";

const Landing = () => {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowNav(currentScrollY < lastScrollY || currentScrollY < 10);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav
        className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          showNav ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="container flex h-16 items-center justify-between">
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 font-display font-bold text-xl hover:opacity-80 transition-opacity"
          >
            <BarChart3 className="h-6 w-6 text-primary" />
            <span>Olivia</span>
          </button>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLoginOpen(true)}>
              Log In
            </Button>
            <Link to="/getting-started">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20 px-4 mt-16">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="font-display font-bold text-5xl md:text-6xl leading-tight">
                AI-Powered Financial Forecasting
              </h1>
              <p className="text-xl text-muted-foreground">
                Transform your business data into actionable insights with Olivia. 
                Make smarter decisions with real-time performance tracking and AI-driven predictions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => setLoginOpen(true)}>
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline">Watch Demo</Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <TrendingUp className="h-32 w-32 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              Everything You Need to Forecast with Confidence
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
      <section className="py-20">
        <div className="container max-w-4xl">
          <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center">
            <h2 className="font-display font-bold text-3xl mb-4">
              Ready to Make Smarter Decisions?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join growth strategists and financial planners using Olivia to drive data-backed growth.
            </p>
            <Button size="lg" variant="secondary" onClick={() => setLoginOpen(true)}>
              Get Started Today
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-muted-foreground">
          <p>© 2025 Olivia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
