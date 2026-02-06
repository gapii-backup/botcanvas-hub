import { useState, useEffect } from 'react';
import { 
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';
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

interface ProUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const planPrices = {
  pro: { monthly: 129.99, yearly: 1299.99, name: 'Pro' },
  enterprise: { monthly: 299.99, yearly: 2999.99, name: 'Enterprise' }
};

const planOrder = ['basic', 'pro', 'enterprise'];

const plans = [
  {
    name: 'Pro',
    id: 'pro',
    features: [
      'Vse iz BASIC paketa, plus:',
      '3.000 pogovorov na mesec',
      'Podpora za več jezikov',
      'Zbiranje kontaktov (leadov) neposredno v pogovoru',
      'Kreiranje support ticketov neposredno preko chatbota',
      'Napredni pregled statistike in analitike',
      'Zgodovina pogovorov – 60 dni'
    ]
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    features: [
      'Vse iz PRO paketa, plus:',
      '8.000 pogovorov na mesec',
      'Rezervacija sestankov neposredno preko chatbota',
      'Pametna priporočila izdelkov (AI)',
      'Tedensko AI poročilo o uspešnosti',
      'Zgodovina pogovorov – 180 dni'
    ]
  }
];

export function ProUpgradeModal({ open, onOpenChange }: ProUpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isDowngrade, setIsDowngrade] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { widget } = useWidget();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (widget?.billing_period) {
      setBillingPeriod(widget.billing_period as 'monthly' | 'yearly');
    }
  }, [widget?.billing_period]);

  const currentPlanName = widget?.plan ? (planPrices[widget.plan as keyof typeof planPrices]?.name || widget.plan) : 'Brez paketa';
  const currentPlanIndex = widget?.plan ? planOrder.indexOf(widget.plan) : -1;
  const widgetBillingPeriod = widget?.billing_period || 'monthly';

  const isExactCurrentPlan = (planId: string) => {
    return widget?.plan === planId && widgetBillingPeriod === billingPeriod;
  };

  const handleSelectPlan = (planId: string) => {
    const selectedIndex = planOrder.indexOf(planId);
    const isDowngrading = selectedIndex < currentPlanIndex && widgetBillingPeriod === billingPeriod;
    
    setSelectedPlan(planId);
    setIsDowngrade(isDowngrading);
    onOpenChange(false); // Close main dialog first
    setTimeout(() => setShowConfirmDialog(true), 150); // Then open confirmation
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
          email: user.email,
          cancel_url: window.location.href
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
    const isExact = isExactCurrentPlan(planId);
    const isSamePlanDifferentBilling = widget?.plan === planId && widgetBillingPeriod !== billingPeriod;
    
    if (isExact) {
      return { label: 'Trenutni paket', variant: 'outline' as const, disabled: true };
    }
    
    if (isSamePlanDifferentBilling) {
      if (billingPeriod === 'yearly') {
        return { label: 'Nadgradi', variant: 'default' as const, disabled: false };
      } else {
        return { label: 'Downgradi', variant: 'secondary' as const, disabled: false };
      }
    }
    
    if (planIndex > currentPlanIndex) {
      return { label: 'Nadgradi', variant: 'default' as const, disabled: false };
    }
    
    return { label: 'Downgradi', variant: 'secondary' as const, disabled: false };
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl max-h-[70vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nadgradi na Pro ali Enterprise</DialogTitle>
            <DialogDescription>Ta funkcionalnost je na voljo v Pro in Enterprise paketu</DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm text-muted-foreground">
            Ob spremembi paketa boste preusmerjeni na varno Stripe plačilno stran. Trenutna naročnina bo preklicana in nova aktivirana po uspešnem plačilu.
          </div>

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
                  -17%
                </Badge>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(plan => {
              const prices = planPrices[plan.id as keyof typeof planPrices];
              const price = billingPeriod === 'monthly' ? prices.monthly : prices.yearly;
              const buttonState = getPlanButtonState(plan.id);
              const isExact = isExactCurrentPlan(plan.id);
              
              const monthlyCost = prices.monthly * 12;
              const yearlyCost = prices.yearly;
              const savings = Math.round(monthlyCost - yearlyCost);
              
              return (
                <div
                  key={plan.id}
                  className={`border rounded-xl p-5 bg-card relative flex flex-col ${
                    isExact ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  }`}
                >
                  {isExact && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      Trenutni paket
                    </Badge>
                  )}
                  
                  <h3 className="text-lg font-bold text-foreground mt-1">{plan.name}</h3>
                  <div className="text-2xl font-bold my-2 text-foreground">
                    €{price}
                    <span className="text-sm text-muted-foreground font-normal">
                      /{billingPeriod === 'monthly' ? 'mesec' : 'leto'}
                    </span>
                  </div>
                  {billingPeriod === 'yearly' ? (
                    <div className="text-xs text-green-500 font-medium mb-3">
                      Prihranite €{savings}/leto
                    </div>
                  ) : (
                    <div className="mb-3 h-4" />
                  )}
                  
                  <ul className="space-y-2.5 mb-4 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full mt-auto ${
                      buttonState.variant === 'default' 
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0 shadow-lg shadow-amber-500/25' 
                        : ''
                    }`}
                    variant={buttonState.variant === 'default' ? undefined : buttonState.variant}
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
                    <span className="font-semibold">€{getSelectedPlanPrice()}/{billingPeriod === 'monthly' ? 'mesec' : 'leto'}</span>
                  </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
                  <p className="text-amber-500 font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Pomembno:
                  </p>
                  <ul className="text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>Vaša trenutna naročnina bo preklicana</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>Vse aktivne funkcije bodo odstranjene</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>Nov paket bo aktiviran v roku 24 ur</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>Vaš chatbot bo med pripravljalnim obdobjem ostal AKTIVEN</span>
                    </li>
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
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0 shadow-lg shadow-amber-500/25"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Potrjujem upgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                    <span className="font-semibold">€{getSelectedPlanPrice()}/{billingPeriod === 'monthly' ? 'mesec' : 'leto'}</span>
                  </div>
                </div>
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm">
                  <p className="text-destructive font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Opozorilo:
                  </p>
                  <ul className="text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>Izgubili boste dostop do funkcionalnosti višjega paketa</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>Vse aktivne funkcije bodo odstranjene</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>Sprememba bo aktivirana v roku 24 ur</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>Sredstev ne vračamo</span>
                    </li>
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
