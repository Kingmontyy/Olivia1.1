import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import DataConnection from "./pages/DataConnection";
import Performance from "./pages/Performance";
import Forecasting from "./pages/Forecasting";
import Scenarios from "./pages/Scenarios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/initial-data-connection-dashboard-setup" element={<DataConnection />} />
          <Route path="/understanding-current-past-performance" element={<Performance />} />
          <Route path="/forecasting-scenario-planning" element={<Forecasting />} />
          <Route path="/saving-managing-scenarios" element={<Scenarios />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
