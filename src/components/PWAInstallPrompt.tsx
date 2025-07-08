import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Download, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detect if app is already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Check if user has already dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 3600 * 24);
      if (daysSinceDismissed < 7) { // Don't show again for 7 days
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 3 seconds if user hasn't interacted
      setTimeout(() => {
        if (!hasInteracted && !standalone) {
          setShowInstallDialog(true);
        }
      }, 3000);
    };

    // Detect user interaction
    const handleUserInteraction = () => {
      setHasInteracted(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('scroll', handleUserInteraction);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
    };
  }, [hasInteracted]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallDialog(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallDialog(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  const handleIOSInstall = () => {
    setShowInstallDialog(false);
    // Show iOS-specific instructions
    alert('Para instalar no iOS:\n1. Toque no ícone de compartilhar\n2. Selecione "Adicionar à Tela de Início"\n3. Toque em "Adicionar"');
  };

  // Don't show if already installed
  if (isStandalone) return null;

  // Show different UI for iOS vs Android/Desktop
  if (isIOS && showInstallDialog) {
    return (
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Instalar Minhas finanças - Moto
            </DialogTitle>
            <DialogDescription>
              Instale o Minhas finanças - Moto na sua tela inicial para acesso rápido e melhor experiência.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
              <div className="text-center space-y-2">
                <Share className="h-8 w-8 text-primary mx-auto" />
                <p className="text-sm font-medium">Para instalar no iOS:</p>
                <ol className="text-xs text-muted-foreground space-y-1">
                  <li>1. Toque no ícone de compartilhar</li>
                  <li>2. Selecione "Adicionar à Tela de Início"</li>
                  <li>3. Toque em "Adicionar"</li>
                </ol>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleIOSInstall} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Entendi
              </Button>
              <Button variant="outline" size="icon" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Android/Desktop install prompt
  if (deferredPrompt && showInstallDialog) {
    return (
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Instalar LocAuto
            </DialogTitle>
            <DialogDescription>
              Instale o LocAuto como um aplicativo para acesso rápido e melhor experiência.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
              <div className="text-center space-y-2">
                <Smartphone className="h-12 w-12 text-primary mx-auto" />
                <p className="text-sm font-medium">Aplicativo Nativo</p>
                <p className="text-xs text-muted-foreground">
                  Funciona offline • Notificações • Acesso rápido
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleInstallClick} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Instalar App
              </Button>
              <Button variant="outline" size="icon" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};

export default PWAInstallPrompt;