import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useWidget } from '@/hooks/useWidget';
import { useAuth } from '@/contexts/AuthContext';

type AddonItem = { id: string; name: string; price: number; period: string; proOnly?: boolean };

const allAddons: Record<string, AddonItem[]> = {
  monthly: [
    { id: 'capacity_500', name: '+500 pogovorov', price: 18, period: 'mesec' },
    { id: 'capacity_1000', name: '+1.000 pogovorov', price: 32, period: 'mesec' },
    { id: 'capacity_2500', name: '+2.500 pogovorov', price: 70, period: 'mesec' },
    { id: 'capacity_5000', name: '+5.000 pogovorov', price: 120, period: 'mesec' },
    { id: 'multilanguage', name: 'Multilanguage', price: 30, period: 'mesec' },
    { id: 'booking', name: 'Rezervacija sestankov', price: 35, period: 'mesec', proOnly: true },
    { id: 'contacts', name: 'Zbiranje kontaktov', price: 20, period: 'mesec' },
    { id: 'product_ai', name: 'Product AI', price: 80, period: 'mesec' },
    { id: 'tickets', name: 'Support Ticketi', price: 35, period: 'mesec' }
  ],
  yearly: [
    // Capacity addoni - VEDNO mesečni
    { id: 'capacity_500', name: '+500 pogovorov', price: 18, period: 'mesec' },
    { id: 'capacity_1000', name: '+1.000 pogovorov', price: 32, period: 'mesec' },
    { id: 'capacity_2500', name: '+2.500 pogovorov', price: 70, period: 'mesec' },
    { id: 'capacity_5000', name: '+5.000 pogovorov', price: 120, period: 'mesec' },
    // Ostali addoni - letni
    { id: 'multilanguage', name: 'Multilanguage', price: 288, period: 'leto' },
    { id: 'booking', name: 'Rezervacija sestankov', price: 336, period: 'leto', proOnly: true },
    { id: 'contacts', name: 'Zbiranje kontaktov', price: 192, period: 'leto' },
    { id: 'product_ai', name: 'Product AI', price: 768, period: 'leto' },
    { id: 'tickets', name: 'Support Ticketi', price: 336, period: 'leto' }
  ]
};

const getAddonDetails = (addonId: string, billingPeriod: string): AddonItem | null => {
  const addons = allAddons[billingPeriod] || allAddons.monthly;
  return addons.find(a => a.id === addonId) || null;
};

interface AddonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addon: string | null;
}

export function AddonModal({ open, onOpenChange, addon }: AddonModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { widget, fetchWidget } = useWidget();
  const { user } = useAuth();
  const { toast } = useToast();

  const billingPeriod = widget?.billing_period || 'monthly';
  const isYearly = billingPeriod === 'yearly';
  const isCapacity = addon?.startsWith('capacity_');
  const addonData = addon ? getAddonDetails(addon, billingPeriod) : null;

  if (!addon || !addonData) {
    return null;
  }

  const handleAddonClick = () => {
    onOpenChange(false); // Close main dialog first
    setTimeout(() => setShowConfirmDialog(true), 150); // Then open confirmation
  };

  const handleConfirmAddon = async () => {
    if (!widget?.api_key) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za nakup.',
        variant: 'destructive',
      });
      return;
    }

    setShowConfirmDialog(false);
    setIsProcessing(true);
    
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/create-addon-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: widget.api_key,
          addon: addon,
          billing_period: billingPeriod,
          user_email: user?.email,
          cancel_url: window.location.href
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Funkcija dodana!',
          description: result.message || 'Funkcija je bila uspešno dodana k vaši naročnini.'
        });
        onOpenChange(false);
        // Refresh the page to reload all data
        window.location.reload();
      } else {
        throw new Error(result.error || 'Napaka pri dodajanju funkcije');
      }
    } catch (error: any) {
      toast({
        title: 'Napaka',
        description: error.message || 'Nekaj je šlo narobe',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  // Show processing overlay when addon is being added
  if (isProcessing) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm [&>button]:hidden">
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 animate-pulse flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-black animate-bounce" />
              </div>
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-amber-500/30 animate-ping" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Dodajanje funkcije...</h3>
              <p className="text-sm text-muted-foreground">
                {addonData?.name}
              </p>
              <div className="flex items-center justify-center gap-1 pt-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md max-h-[70vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dodaj funkcijo: {addonData.name}</DialogTitle>
            <DialogDescription>Dodajte funkcionalnost svoji naročnini</DialogDescription>
          </DialogHeader>

          <div className="my-6">
            {/* Za kapacitete pri letni naročnini - posebna kartica */}
            {isCapacity && isYearly ? (
              <div className="border border-amber-500/50 rounded-xl p-4 bg-amber-500/5">
                <div className="font-bold text-amber-500">
                  Mesečno
                  <span className="text-muted-foreground text-sm font-normal ml-2">brez popusta</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  €{addonData.price}
                  <span className="text-xs text-muted-foreground/70 ml-1">+DDV</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    /{addonData.period}
                  </span>
                </div>
                <p className="text-xs text-amber-500/80 mt-2">
                  Kapacitete se vedno zaračunavajo mesečno, ne glede na vaše obračunsko obdobje.
                </p>
              </div>
            ) : (
              /* Za ostale addone - standardna kartica */
              <div className="border border-primary rounded-xl p-4 bg-primary/5">
                <div className="font-bold text-foreground">
                  {billingPeriod === 'monthly' ? 'Mesečno' : 'Letno'}
                  {billingPeriod === 'yearly' && (
                    <span className="text-success text-sm font-normal ml-2">20% popust</span>
                  )}
                </div>
                <div className="text-2xl font-bold text-foreground">
                  €{addonData.price}
                  <span className="text-xs text-muted-foreground/70 ml-1">+DDV</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    /{addonData.period}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Billing period se ujema z vašo obstoječo naročnino
                </p>
              </div>
            )}
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black border-0 shadow-lg shadow-amber-500/25" 
            onClick={handleAddonClick}
          >
            Dodaj funkcijo
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Potrditev nakupa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4" asChild>
              <div>
                <div className="bg-muted/80 rounded-lg p-4">
                  <div className="font-semibold text-foreground text-lg">{addonData.name}</div>
                  <div className="text-2xl font-bold text-amber-500 mt-1">
                    €{addonData.price}
                    <span className="text-xs text-muted-foreground/70 ml-1">+DDV/{addonData.period}</span>
                  </div>
                </div>

                {/* Za kapacitete pri letni naročnini - poenostavljena vsebina */}
                {isCapacity && isYearly ? (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                    <p className="font-medium text-foreground">Kako deluje zaračunavanje:</p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>Kapacitete se <strong className="text-foreground">vedno zaračunavajo MESEČNO</strong> (ne letno), saj se dodatni pogovori obračunavajo mesečno.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>Cena: <strong className="text-foreground">€{addonData.price} +DDV/mesec</strong></span>
                      </li>
                    </ul>
                  </div>
                ) : (
                  /* Za ostale addone - standardna vsebina */
                  <>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                      <p className="font-medium text-amber-500 mb-2 flex items-center gap-2">
                        <span>⚡</span>
                        Takojšnje plačilo
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Sorazmerni del cene za obdobje do vašega naslednjega plačila bo zaračunan takoj iz vaše shranjene plačilne metode.
                      </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                      <p className="font-medium text-foreground">Kako deluje zaračunavanje:</p>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span><strong className="text-foreground">Danes:</strong> Zaračuna se sorazmerni del cene (npr. če je do naslednjega plačila še pol obdobja, plačate pol cene)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span><strong className="text-foreground">Od naslednjega obdobja:</strong> Funkcija se zaračuna skupaj z naročnino po polni ceni (€{addonData.price} +DDV/{addonData.period})</span>
                        </li>
                      </ul>
                    </div>
                  </>
                )}

                {addon?.startsWith('capacity_') ? (
                  <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <span>⚡</span>
                    <span>Kapaciteta bo aktivirana <strong>TAKOJ</strong> po potrditvi nakupa.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <span>⚡</span>
                    <span>Funkcija bo aktivirana v roku <strong>72 ur</strong> po potrditvi nakupa.</span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isProcessing}>Prekliči</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAddon} 
              disabled={isProcessing}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Potrjujem nakup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
