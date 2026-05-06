import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AjirAuthProvider } from "@/hooks/use-ajir-auth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Stays from "./pages/Stays.tsx";
import Experiences from "./pages/Experiences.tsx";
import Services from "./pages/Services.tsx";
import Map from "./pages/Map.tsx";
import GiftCards from "./pages/GiftCards.tsx";
import Offers from "./pages/Offers.tsx";
import Dashboard from "./pages/Dashboard.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AjirAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/stays" element={<Stays />} />
            <Route path="/experiences" element={<Experiences />} />
            <Route path="/services" element={<Services />} />
            <Route path="/map" element={<Map />} />
            <Route path="/gift-cards" element={<GiftCards />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AjirAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
