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
import { Badge } from '@/components/ui/badge';
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

const planOrder = ['basic', 'pro', 'enterprise'];

const plans = [
  {
    name: 'Basic',
    id: 'basic',
    features: [
      '1.000 pogovorov/mesec',
      '1 chatbot',
      'Osnovna prilagoditev',
      'Email podpora',
      '30 dni zgodovina',
      'Osnovni analytics'
    ]
  },
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
  const [isDowngrade, setIsDowngrade] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { widget, fetchWidget } = useWidget();
  const { user } = useAuth();
  const { toast } = useToast();

  // Set initial billing period based on user's current subscription
  useEffect(() => {
    if (widget?.billing_period) {
      setBillingPeriod(widget.billing_period as 'monthly' | 'yearly');
    }
  }, [widget?.billing_period]);

  const currentPlanName = widget?.plan ? planPrices[widget.plan as keyof typeof planPrices]?.name || widget.plan : 'Brez paketa';
  const currentPlanIndex = widget?.plan ? planOrder.indexOf(widget.plan) : -1;

  const handleSelectPlan = (planId: string) => {
    const selectedIndex = planOrder.indexOf(planId);
    const isDowngrading = selectedIndex < currentPlanIndex;
    
    setSelectedPlan(planId);
    setIsDowngrade(isDowngrading);
    setShowConfirmDialog(true);
  };

  const handleConfirmChange = async () => {
    if (!widget?.api_key || !user?.email || !selectedPlan) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za spremembo paketa.',
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
      
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error(result.error || 'Napaka pri ustvarjanju plačila');
      }
    } catch (error) {
      console.error('Plan change error:', error);
      toast({
        title: 'Napaka',
        description: error instanceof Error ? error.message : 'Nekaj je šlo narobe. Prosimo, poskusite znova.',
        variant: 'destructive',
      });
      setLoading(false);
      setSelectedPlan(null);
    }
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

  const getPlanButtonState = (planId: string) => {
    const planIndex = planOrder.indexOf(planId);
    
    if (planId === widget?.plan) {
      return { label: 'Trenutni paket', variant: 'outline' as const, disabled: true };
    }
    
    if (planIndex > currentPlanIndex) {
      return { label: `Nadgradi na ${planPrices[planId as keyof typeof planPrices].name}`, variant: 'default' as const, disabled: false };
    }
    
    return { label: `Downgradi na ${planPrices[planId as keyof typeof planPrices].name}`, variant: 'secondary' as const, disabled: false };
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Spremeni paket</DialogTitle>
            <DialogDescription>Izberi paket ki ti najbolj ustreza</DialogDescription>
          </DialogHeader>

          {/* Info text */}
          <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm text-muted-foreground">
            Ob spremembi paketa boste preusmerjeni na varno Stripe plačilno stran. Trenutna naročnina bo preklicana in nova aktivirana po uspešnem plačilu.
          </div>

          {/* Billing period toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg bg-muted p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mesečno
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  billingPeriod === 'yearly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Letno
                <Badge variant="secondary" className="bg-green-500/20 text-green-500 text-xs">
                  -20%
                </Badge>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(plan => {
              const prices = planPrices[plan.id as keyof typeof planPrices];
              const price = billingPeriod === 'monthly' ? prices.monthly : prices.yearly;
              const buttonState = getPlanButtonState(plan.id);
              const isCurrentPlan = widget?.plan === plan.id;
              
              return (
                <div
                  key={plan.id}
                  className={`border rounded-xl p-5 bg-card relative ${
                    isCurrentPlan ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  }`}
                >
                  {isCurrentPlan && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      Trenutni paket
                    </Badge>
                  )}
                  
                  <h3 className="text-lg font-bold text-foreground mt-1">{plan.name}</h3>
                  <div className="text-2xl font-bold my-3 text-foreground">
                    €{price}
                    <span className="text-xs text-muted-foreground/70 ml-1">+DDV</span>
                    <span className="text-sm text-muted-foreground font-normal">
                      /{billingPeriod === 'monthly' ? 'mesec' : 'leto'}
                    </span>
                  </div>
                  
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className="w-full"
                    variant={buttonState.variant}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading || buttonState.disabled}
                  >
                    {loading && selectedPlan === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {buttonState.label}
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade confirmation dialog */}
      <AlertDialog open={showConfirmDialog && !isDowngrade} onOpenChange={(open) => !open && setShowConfirmDialog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potrditev nadgradnje paketa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3" asChild>
              <div>
                <p>
                  Želite nadgraditi na <strong className="text-foreground">{getSelectedPlanName()}</strong> paket?
                </p>
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Trenutni paket:</span>
                    <span>{currentPlanName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nov paket:</span>
                    <span className="font-semibold text-green-500">{getSelectedPlanName()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nova cena:</span>
                    <span className="font-semibold">€{getSelectedPlanPrice()} <span className="text-xs opacity-70">+DDV</span>/{billingPeriod === 'monthly' ? 'mesec' : 'leto'}</span>
                  </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
                  <p className="text-amber-500 font-semibold mb-1">⚠️ Pomembno:</p>
                  <ul className="text-muted-foreground space-y-1 list-disc list-inside">
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
              onClick={handleConfirmChange}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Potrjujem nadgradnjo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Downgrade confirmation dialog */}
      <AlertDialog open={showConfirmDialog && isDowngrade} onOpenChange={(open) => !open && setShowConfirmDialog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potrditev downgrada paketa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3" asChild>
              <div>
                <p>
                  Želite downgradi na <strong className="text-foreground">{getSelectedPlanName()}</strong> paket?
                </p>
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Trenutni paket:</span>
                    <span>{currentPlanName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nov paket:</span>
                    <span className="font-semibold text-orange-500">{getSelectedPlanName()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nova cena:</span>
                    <span className="font-semibold">€{getSelectedPlanPrice()} <span className="text-xs opacity-70">+DDV</span>/{billingPeriod === 'monthly' ? 'mesec' : 'leto'}</span>
                  </div>
                </div>
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm">
                  <p className="text-destructive font-semibold mb-1">⚠️ Opozorilo:</p>
                  <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Izgubili boste dostop do funkcionalnosti višjega paketa</li>
                    <li>Vsi aktivni addoni bodo odstranjeni</li>
                    <li>Sprememba bo aktivirana v roku 72 ur</li>
                    <li>Sredstev ne vračamo</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Prekliči</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmChange}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Potrjujem downgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
