import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import DataConnection from "./pages/DataConnection";
import Performance from "./pages/Performance";
import Forecasts from "./pages/Forecasts";
import Scenarios from "./pages/Scenarios";
import Playground from "./pages/Playground";
import PlaygroundEditor from "./pages/PlaygroundEditor";
import Favorites from "./pages/Favorites";
import Vision from "./pages/Vision";
import GettingStarted from "./pages/GettingStarted";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/getting-started" element={<GettingStarted />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forecasts" element={<Forecasts />} />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/playground/:fileId" element={<PlaygroundEditor />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/vision" element={<Vision />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/initial-data-connection-dashboard-setup" element={<DataConnection />} />
          <Route path="/understanding-current-past-performance" element={<Performance />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
