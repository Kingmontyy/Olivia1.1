import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span>Olivia</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link to="/settings">
            <Button variant="ghost">Settings</Button>
          </Link>
          <Button>Get Started</Button>
        </div>
      </div>
    </nav>
  );
};
