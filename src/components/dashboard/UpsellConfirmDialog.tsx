import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type AddonConfig = {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
};

interface UpsellConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addon: AddonConfig | null;
  billingPeriod: string;
  apiKey: string;
  onSuccess: (addonId: string) => void;
}

export function UpsellConfirmDialog({
  open,
  onOpenChange,
  addon,
  billingPeriod,
  apiKey,
  onSuccess,
}: UpsellConfirmDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  if (!addon) return null;

  const isYearly = billingPeriod === 'yearly';
  const price = isYearly ? addon.yearlyPrice : addon.monthlyPrice;
  const period = isYearly ? 'leto' : 'mesec';

  const handleConfirmAddon = async () => {
    if (!apiKey) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za nakup.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/create-addon-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          addon: addon.id,
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
        setIsProcessing(false);
        onOpenChange(false);
        onSuccess(addon.id);
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
                {addon.name}
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Potrditev nakupa</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4" asChild>
            <div>
              <div className="bg-muted/80 rounded-lg p-4">
                <div className="font-semibold text-foreground text-lg">{addon.name}</div>
                <div className="text-2xl font-bold text-amber-500 mt-1">
                  €{price}
                  <span className="text-xs text-muted-foreground/70 ml-1">+DDV/{period}</span>
                </div>
              </div>

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
                    <span><strong className="text-foreground">Od naslednjega obdobja:</strong> Funkcija se zaračuna skupaj z naročnino po polni ceni (€{price} +DDV/{period})</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <span>⚡</span>
                <span>Funkcija bo aktivirana v roku <strong>24 ur</strong> po potrditvi nakupa.</span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel>Prekliči</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmAddon}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            Potrjujem nakup
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
