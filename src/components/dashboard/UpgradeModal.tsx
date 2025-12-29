import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
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

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans = [
  {
    name: 'Pro',
    id: 'pro',
    price: '119,99',
    priceYearly: '1.149,99',
    features: [
      '5.000 pogovorov/mesec',
      'Multilanguage (SLO + HR + SRB)',
      '+1 multi-channel kanal',
      'Analiza pogovorov',
      'Zbiranje kontaktov',
      'Support ticketi',
      'Napredni analytics',
      '60 dni zgodovina'
    ]
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    price: '299,99',
    priceYearly: '2.879,99',
    features: [
      '10.000 pogovorov/mesec',
      'Vse iz Pro paketa',
      '+2 multi-channel kanala',
      'Meeting booking',
      'Product recommendations',
      'Status naročil',
      '180 dni zgodovina',
      'Prioritetna podpora'
    ]
  }
];

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const { widget } = useWidget();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = async (planId: string) => {
    if (!widget?.api_key || !user?.email) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za nadgradnjo.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/create-upgrade-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: widget.api_key,
          current_plan: widget.plan,
          new_plan: planId,
          billing_period: billingPeriod,
          email: user.email,
          success_url: 'https://app.botmotion.ai/dashboard?upgrade=success',
          cancel_url: 'https://app.botmotion.ai/dashboard'
        })
      });

      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nadgradi paket</DialogTitle>
          <DialogDescription>Izberi paket ki ti najbolj ustreza</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 justify-center mb-6">
          <Button
            variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
            onClick={() => setBillingPeriod('monthly')}
            disabled={loading}
          >
            Mesečno
          </Button>
          <Button
            variant={billingPeriod === 'yearly' ? 'default' : 'outline'}
            onClick={() => setBillingPeriod('yearly')}
            disabled={loading}
          >
            Letno (20% popust)
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map(plan => (
            <div
              key={plan.id}
              className="border border-border rounded-xl p-6 bg-card"
            >
              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <div className="text-3xl font-bold my-4 text-foreground">
                €{billingPeriod === 'monthly' ? plan.price : plan.priceYearly}
                <span className="text-sm text-muted-foreground font-normal">
                  /{billingPeriod === 'monthly' ? 'mesec' : 'leto'}
                </span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-sm text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading || widget?.plan === plan.id}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {widget?.plan === plan.id ? 'Trenutni paket' : `Nadgradi na ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
