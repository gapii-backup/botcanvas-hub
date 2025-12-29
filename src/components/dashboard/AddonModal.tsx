import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface AddonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addon: string | null;
}

const addonPrices: Record<string, { monthly: number; yearly: number; name: string; description: string }> = {
  contacts: {
    monthly: 15,
    yearly: 144,
    name: 'Zbiranje kontaktov',
    description: 'Avtomatsko zbirajte email naslove obiskovalcev'
  },
  tickets: {
    monthly: 35,
    yearly: 336,
    name: 'Support Ticketi',
    description: 'Prejemajte support tickete direktno iz chatbota'
  }
};

export function AddonModal({ open, onOpenChange, addon }: AddonModalProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { widget, fetchWidget } = useWidget();
  const { toast } = useToast();

  if (!addon || !addonPrices[addon]) {
    return null;
  }

  const addonData = addonPrices[addon];
  const billingPeriod = widget?.billing_period || 'monthly';
  const price = billingPeriod === 'yearly' ? addonData.yearly : addonData.monthly;

  const handleAddonClick = () => {
    setShowConfirmDialog(true);
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

    setLoading(true);
    setShowConfirmDialog(false);
    
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/create-addon-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: widget.api_key,
          addon: addon,
          billing_period: billingPeriod
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Addon dodan!',
          description: result.message || 'Addon je bil uspešno dodan k vaši naročnini.'
        });
        onOpenChange(false);
        await fetchWidget();
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
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj {addonData.name}</DialogTitle>
            <DialogDescription>{addonData.description}</DialogDescription>
          </DialogHeader>

          <div className="my-6">
            <div className="border border-primary rounded-xl p-4 bg-primary/5">
              <div className="font-bold text-foreground">
                {billingPeriod === 'monthly' ? 'Mesečno' : 'Letno'}
                {billingPeriod === 'yearly' && (
                  <span className="text-success text-sm font-normal ml-2">20% popust</span>
                )}
              </div>
              <div className="text-2xl font-bold text-foreground">
                €{price}
                <span className="text-sm text-muted-foreground font-normal">
                  /{billingPeriod === 'monthly' ? 'mesec' : 'leto'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Billing period se ujema z vašo obstoječo naročnino
              </p>
            </div>
          </div>

          <Button className="w-full" onClick={handleAddonClick} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Dodaj addon
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potrditev nakupa addona</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3" asChild>
              <div>
                <p>
                  Želite dodati <strong className="text-foreground">{addonData.name}</strong> k vaši naročnini?
                </p>
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cena:</span>
                    <span className="font-semibold text-foreground">
                      €{price}/{billingPeriod === 'monthly' ? 'mesec' : 'leto'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Začetek zaračunavanja:</span>
                    <span className="text-foreground">Ob naslednjem plačilnem obdobju</span>
                  </div>
                </div>
                <p className="text-amber-400 text-sm">
                  ⚠️ Addon bo aktiviran v roku 72 ur po potrditvi.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Prekliči</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAddon} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Potrjujem nakup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
