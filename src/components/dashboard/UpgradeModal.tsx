import { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
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

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const planPrices = {
  basic: { monthly: 49.99, yearly: 479.99, name: 'Basic' },
  pro: { monthly: 119.99, yearly: 1149.99, name: 'Pro' },
  enterprise: { monthly: 299.99, yearly: 2879.99, name: 'Enterprise' }
};

const plans = [
  {
    name: 'Pro',
    id: 'pro',
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
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { widget, fetchWidget } = useWidget();
  const { user } = useAuth();
  const { toast } = useToast();

  // Set initial billing period based on widget's current subscription
  useEffect(() => {
    if (widget?.billing_period) {
      setBillingPeriod(widget.billing_period as 'monthly' | 'yearly');
    }
  }, [widget?.billing_period]);

  const currentPlanName = widget?.plan ? planPrices[widget.plan as keyof typeof planPrices]?.name || widget.plan : 'Brez paketa';

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setShowConfirmDialog(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!widget?.api_key || !user?.email || !selectedPlan) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za nadgradnjo.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setShowConfirmDialog(false);
    
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/create-upgrade-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: widget.api_key,
          new_plan: selectedPlan,
          billing_period: billingPeriod,
          email: user.email
        })
      });

      const result = await response.json();
      
      // Upgrade VEDNO redirecta na Stripe Checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error(result.error || 'Napaka pri ustvarjanju plačila');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Napaka',
        description: error instanceof Error ? error.message : 'Nekaj je šlo narobe. Prosimo, poskusite znova.',
        variant: 'destructive',
      });
      setLoading(false);
      setSelectedPlan(null);
    }
    // NE resetiramo loading state ker gremo na Stripe
  };

  const getSelectedPlanPrice = () => {
    if (!selectedPlan) return 0;
    const prices = planPrices[selectedPlan as keyof typeof planPrices];
    return billingPeriod === 'monthly' ? prices.monthly : prices.yearly;
  };

  const getSelectedPlanName = () => {
    if (!selectedPlan) return '';
    return planPrices[selectedPlan as keyof typeof planPrices]?.name || selectedPlan;
  };

  return (
    <>
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
            {plans.map(plan => {
              const prices = planPrices[plan.id as keyof typeof planPrices];
              const price = billingPeriod === 'monthly' ? prices.monthly : prices.yearly;
              
              return (
                <div
                  key={plan.id}
                  className="border border-border rounded-xl p-6 bg-card"
                >
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <div className="text-3xl font-bold my-4 text-foreground">
                    €{price}
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
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading || widget?.plan === plan.id}
                  >
                    {loading && selectedPlan === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {widget?.plan === plan.id ? 'Trenutni paket' : `Nadgradi na ${plan.name}`}
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potrditev nadgradnje paketa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3" asChild>
              <div>
                <p>
                  Želite nadgraditi na <strong className="text-foreground">{getSelectedPlanName()}</strong> paket?
                </p>
                <div className="bg-slate-800 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Trenutni paket:</span>
                    <span>{currentPlanName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nov paket:</span>
                    <span className="font-semibold text-green-400">{getSelectedPlanName()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nova cena:</span>
                    <span className="font-semibold">€{getSelectedPlanPrice()}/{billingPeriod === 'monthly' ? 'mesec' : 'leto'}</span>
                  </div>
                </div>
                <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-3 text-sm">
                  <p className="text-amber-400 font-semibold mb-1">⚠️ Pomembno:</p>
                  <ul className="text-amber-200 space-y-1 list-disc list-inside">
                    <li>Vaša trenutna naročnina bo preklicana</li>
                    <li>Vsi aktivni addoni bodo odstranjeni</li>
                    <li>Nov paket bo aktiviran v roku 72 ur</li>
                    <li>Zaračunavanje se začne ob naslednjem plačilnem obdobju</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Prekliči</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmUpgrade}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Potrjujem nadgradnjo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
