import { useState } from 'react';
import { Loader2, MessageCirclePlus, Phone, Mail } from 'lucide-react';
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

const monthlyCapacityOptions: CapacityOption[] = [
  { id: 'capacity_1000', name: '+1.000 pogovorov', price: 12, period: 'mesec' },
  { id: 'capacity_2000', name: '+2.000 pogovorov', price: 22, period: 'mesec' },
  { id: 'capacity_5000', name: '+5.000 pogovorov', price: 52, period: 'mesec' },
  { id: 'capacity_10000', name: '+10.000 pogovorov', price: 99, period: 'mesec' },
];

const yearlyCapacityOptions: CapacityOption[] = [
  { id: 'capacity_10000', name: '+10.000 pogovorov', price: 99, period: 'leto' },
];

interface CapacityAddonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CapacityAddonModal({ open, onOpenChange }: CapacityAddonModalProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedOption, setSelectedOption] = useState<CapacityOption | null>(null);
  const { widget, fetchWidget } = useWidget();
  const { user } = useAuth();
  const { toast } = useToast();

  const billingPeriod = widget?.billing_period || 'monthly';
  const isYearly = billingPeriod === 'yearly';
  const capacityOptions = isYearly ? yearlyCapacityOptions : monthlyCapacityOptions;

  const handleOptionClick = (option: CapacityOption) => {
    setSelectedOption(option);
    setShowConfirmDialog(true);
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

    setLoading(true);
    setShowConfirmDialog(false);
    
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
          title: 'Addon dodan!',
          description: result.message || 'Addon je bil uspešno dodan k vaši naročnini.'
        });
        onOpenChange(false);
        window.location.reload();
      } else {
        throw new Error(result.error || 'Napaka pri dodajanju addona');
      }
    } catch (error: any) {
      toast({
        title: 'Napaka',
        description: error.message || 'Nekaj je šlo narobe',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setSelectedOption(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCirclePlus className="h-5 w-5 text-amber-500" />
              Dodaj kapaciteto sporočil
            </DialogTitle>
            <DialogDescription>Izberite paket dodatnih sporočil</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4">
            {capacityOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option)}
                disabled={loading}
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
            ))}

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
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Potrditev nakupa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4" asChild>
              <div>
                {selectedOption && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <div className="font-semibold text-foreground text-lg">{selectedOption.name}</div>
                    <div className="text-2xl font-bold text-amber-500 mt-1">
                      €{selectedOption.price}
                      <span className="text-xs text-muted-foreground/70 ml-1">+DDV</span>
                      <span className="text-sm text-muted-foreground font-normal">
                        /{selectedOption.period}
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-200">
                  <p className="font-medium text-amber-300 mb-2">⚡ Takojšnje plačilo</p>
                  <p className="text-sm">
                    Sorazmerni del cene za obdobje do vašega naslednjega plačila bo zaračunan takoj iz vaše shranjene plačilne metode.
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                  <p className="font-medium text-foreground">Kako deluje zaračunavanje:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span><strong className="text-foreground">Danes:</strong> Zaračuna se sorazmerni del cene</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span><strong className="text-foreground">Od naslednjega obdobja:</strong> Addon se zaračuna skupaj z naročnino po polni ceni</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/5 rounded-lg p-3">
                  <span>⏱️</span>
                  <span>Kapaciteta bo aktivirana v roku <strong>72 ur</strong> po potrditvi nakupa.</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={loading}>Prekliči</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAddon} 
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Potrjujem nakup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
