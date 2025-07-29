import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ClientPortal from "./pages/ClientPortal";
import NotFound from "./pages/NotFound";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import AccountFrozenModal from "./components/AccountFrozenModal";
import AccessDeniedModal from "./components/AccessDeniedModal";
import React, { useEffect, useState } from 'react';
import { useServiceWorkerUpdate } from "./hooks/useServiceWorkerUpdate";
import { useAuth } from "./contexts/AuthContext";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  const { isUpdateAvailable, update } = useServiceWorkerUpdate();
  const { user } = useAuth();
  const [showFrozenModal, setShowFrozenModal] = useState(false);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [frozenReason, setFrozenReason] = useState('');

  useEffect(() => {
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Add viewport meta tag for mobile optimization
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
    }
  }, []);

  // Verificar status da conta quando o usuário estiver logado
  useEffect(() => {
    if (user) {
      checkAccountStatus();
    }
  }, [user]);

  const checkAccountStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('access_granted, account_frozen, frozen_reason')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        if (data.account_frozen) {
          setFrozenReason(data.frozen_reason || 'Falta de pagamento');
          setShowFrozenModal(true);
        } else if (!data.access_granted) {
          setShowAccessDeniedModal(true);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status da conta:', error);
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
        <PWAInstallPrompt />
        
        {/* Modais de controle de acesso */}
        <AccountFrozenModal 
          isOpen={showFrozenModal} 
          onClose={() => setShowFrozenModal(false)}
          frozenReason={frozenReason}
        />
        <AccessDeniedModal 
          isOpen={showAccessDeniedModal} 
          onClose={() => setShowAccessDeniedModal(false)}
        />
        
        {isUpdateAvailable && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded shadow-lg z-50">
            <p>Uma nova atualização está disponível.</p>
            <button
              className="mt-2 px-4 py-2 bg-white text-blue-600 rounded font-bold"
              onClick={update}
            >
              Confirmar e atualizar
            </button>
          </div>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
