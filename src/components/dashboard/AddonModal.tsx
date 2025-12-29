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
import { useToast } from '@/hooks/use-toast';
import { useWidget } from '@/hooks/useWidget';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AddonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addon: string | null;
}

const addons: Record<string, { name: string; description: string; priceMonthly: string; priceYearly: string }> = {
  contacts: {
    name: 'Zbiranje kontaktov',
    description: 'Avtomatsko zbirajte email naslove obiskovalcev',
    priceMonthly: '25',
    priceYearly: '240'
  },
  tickets: {
    name: 'Support Ticketi',
    description: 'Prejemajte support tickete direktno iz chatbota',
    priceMonthly: '35',
    priceYearly: '336'
  }
};

export function AddonModal({ open, onOpenChange, addon }: AddonModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const { widget } = useWidget();
  const { user } = useAuth();
  const { toast } = useToast();

  if (!addon || !addons[addon]) {
    return null;
  }

  const addonData = addons[addon];

  const handleAddonPurchase = async () => {
    if (!widget?.api_key || !user?.email) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za nakup.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/create-addon-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: widget.api_key,
          addon: addon,
          billing_period: billingPeriod,
          email: user.email
        })
      });

      const result = await response.json();

      if (result.success) {
        const addonName = addon ? addons[addon]?.name : addon;
        toast({ 
          title: 'Addon dodan!', 
          description: `${addonName} je bil uspešno dodan k vaši naročnini.` 
        });
        window.location.reload();
      } else {
        throw new Error(result.error || 'Napaka pri dodajanju addona');
      }
    } catch (error) {
      console.error('Addon purchase error:', error);
      toast({
        title: 'Napaka',
        description: 'Nekaj je šlo narobe. Prosimo, poskusite znova.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj {addonData.name}</DialogTitle>
          <DialogDescription>{addonData.description}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 my-6">
          <div
            className={cn(
              'flex-1 border rounded-xl p-4 cursor-pointer transition-colors',
              billingPeriod === 'monthly'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground'
            )}
            onClick={() => !loading && setBillingPeriod('monthly')}
          >
            <div className="font-bold text-foreground">Mesečno</div>
            <div className="text-2xl font-bold text-foreground">
              €{addonData.priceMonthly}
              <span className="text-sm text-muted-foreground font-normal">/mesec</span>
            </div>
          </div>
          <div
            className={cn(
              'flex-1 border rounded-xl p-4 cursor-pointer transition-colors',
              billingPeriod === 'yearly'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground'
            )}
            onClick={() => !loading && setBillingPeriod('yearly')}
          >
            <div className="font-bold text-foreground">
              Letno{' '}
              <span className="text-success text-sm font-normal">20% popust</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              €{addonData.priceYearly}
              <span className="text-sm text-muted-foreground font-normal">/leto</span>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={handleAddonPurchase} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Dodaj addon
        </Button>
      </DialogContent>
    </Dialog>
  );
}
