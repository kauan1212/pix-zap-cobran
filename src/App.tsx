import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ClientPortal from "./pages/ClientPortal";
import NotFound from "./pages/NotFound";
import React, { useEffect, useState } from 'react';

const queryClient = new QueryClient();

const App = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/client/:token" element={<ClientPortal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        {showInstallBanner && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0099cc', color: 'white', padding: 16, zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Instale o LocAuto na sua tela inicial para acesso rápido!</span>
            <button style={{ background: 'white', color: '#0099cc', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 'bold', marginLeft: 16 }} onClick={handleInstallClick}>
              Instalar App
            </button>
          </div>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
