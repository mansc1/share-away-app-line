
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import LineCallbackPage from "./pages/LineCallbackPage";
import TripManagePage from "./pages/TripManagePage";
import TripNewPage from "./pages/TripNewPage";
import JoinTripPage from "./pages/JoinTripPage";
import { LineAuthProvider } from "./contexts/LineAuthContext";
import { TripProvider } from "./contexts/TripContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LineAuthProvider>
          <TripProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth/line/callback" element={<LineCallbackPage />} />
              <Route path="/app" element={<Index />} />
              <Route path="/trip/manage" element={<TripManagePage />} />
              <Route path="/trip/new" element={<TripNewPage />} />
              <Route path="/join/:token" element={<JoinTripPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TripProvider>
        </LineAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
