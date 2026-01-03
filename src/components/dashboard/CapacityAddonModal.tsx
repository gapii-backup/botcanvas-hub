import { useState } from 'react';
import { Loader2, MessageCirclePlus, Phone, Mail, Sparkles, Info } from 'lucide-react';
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

type CapacityOption = { id: string; name: string; price: number; period: string };

// Capacity addoni so VEDNO mesečni - tudi za letne naročnine
const capacityOptionsAll: CapacityOption[] = [
  { id: 'capacity_1000', name: '+1.000 pogovorov', price: 12, period: 'mesec' },
  { id: 'capacity_2000', name: '+2.000 pogovorov', price: 22, period: 'mesec' },
  { id: 'capacity_5000', name: '+5.000 pogovorov', price: 52, period: 'mesec' },
  { id: 'capacity_10000', name: '+10.000 pogovorov', price: 99, period: 'mesec' },
];

interface CapacityAddonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CapacityAddonModal({ open, onOpenChange }: CapacityAddonModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedOption, setSelectedOption] = useState<CapacityOption | null>(null);
  const { widget, fetchWidget } = useWidget();
  const { user } = useAuth();
  const { toast } = useToast();

  const billingPeriod = widget?.billing_period || 'monthly';
  const isYearly = billingPeriod === 'yearly';
  
  // Get current addons from widget
  const currentAddons = (widget?.addons as string[] | null) || [];
  
  // Filter out already purchased addons - vsi capacity addoni so mesečni
  const capacityOptions = capacityOptionsAll.filter(option => !currentAddons.includes(option.id));

  const handleOptionClick = (option: CapacityOption) => {
    setSelectedOption(option);
    onOpenChange(false); // Close main dialog first
    setTimeout(() => setShowConfirmDialog(true), 150); // Then open confirmation
  };

  const handleConfirmAddon = async () => {
    if (!widget?.api_key || !selectedOption) {
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
          addon: selectedOption.id,
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
      setSelectedOption(null);
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
                {selectedOption?.name}
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
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCirclePlus className="h-5 w-5 text-amber-500" />
              Dodaj kapaciteto sporočil
            </DialogTitle>
            <DialogDescription>Izberite paket dodatnih sporočil</DialogDescription>
          </DialogHeader>

          {/* Opozorilo za mesečno zaračunavanje - samo za letne naročnine */}
          {isYearly && (
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-amber-500">Mesečno</strong> — Dodatni pogovori se <strong className="text-foreground">vedno zaračunavajo mesečno</strong>, ne glede na vaše obračunsko obdobje. Brez 20% popusta.
              </p>
            </div>
          )}

          <div className="space-y-3 my-4">
            {capacityOptions.length > 0 ? (
              capacityOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all text-left group"
                >
                  <div>
                    <span className="font-semibold text-foreground group-hover:text-amber-500 transition-colors">
                      {option.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">
                      €{option.price}
                      <span className="text-xs text-muted-foreground ml-1">+DDV</span>
                    </div>
                    <div className="text-xs text-muted-foreground">/{option.period}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-center">
                <p className="text-green-400 font-medium">✓ Že imate vse standardne funkcije</p>
              </div>
            )}

            {/* Custom option */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <div className="font-semibold text-amber-500 mb-2">Custom</div>
              <p className="text-sm text-muted-foreground mb-3">
                Za večje količine ali prilagojene potrebe nas kontaktirajte:
              </p>
              <div className="space-y-2 text-sm">
                <a 
                  href="mailto:info@botmotion.ai" 
                  className="flex items-center gap-2 text-foreground hover:text-amber-500 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  info@botmotion.ai
                </a>
                <a 
                  href="tel:+38641353600" 
                  className="flex items-center gap-2 text-foreground hover:text-amber-500 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  +386 41 353 600
                </a>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
          <AlertDialogHeader className="space-y-1">
            <AlertDialogTitle className="text-base">Potrditev nakupa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2" asChild>
              <div>
                {selectedOption && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div className="font-semibold text-foreground">{selectedOption.name}</div>
                    <div className="text-xl font-bold text-amber-500">
                      €{selectedOption.price}
                      <span className="text-xs text-muted-foreground/70 ml-1">+DDV/{selectedOption.period}</span>
                    </div>
                  </div>
                )}

                {isYearly ? (
                  <div className="bg-muted/50 rounded-lg p-3 text-xs">
                    <p className="font-medium text-foreground mb-1">Zaračunavanje:</p>
                    <p className="text-muted-foreground">Kapacitete se <strong className="text-foreground">vedno zaračunavajo MESEČNO</strong>.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-amber-200">
                      <p className="font-medium text-amber-300 text-xs mb-1">⚡ Takojšnje plačilo</p>
                      <p className="text-xs">Sorazmerni del cene bo zaračunan takoj iz vaše shranjene plačilne metode.</p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-2.5 text-xs">
                      <p className="font-medium text-foreground mb-1">Zaračunavanje:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• <strong className="text-foreground">Danes:</strong> Sorazmerni del cene</li>
                        <li>• <strong className="text-foreground">Naprej:</strong> €{selectedOption?.price} +DDV/mesec</li>
                      </ul>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/5 rounded-lg p-2">
                  <span>⚡</span>
                  <span>Aktivacija <strong>TAKOJ</strong> po potrditvi.</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="h-9 text-sm">Prekliči</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAddon} 
              className="bg-amber-500 hover:bg-amber-600 text-black h-9 text-sm"
            >
              Potrjujem nakup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
