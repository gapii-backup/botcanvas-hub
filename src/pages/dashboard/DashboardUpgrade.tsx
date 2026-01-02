import { useState } from 'react';
import { 
  Package,
  Plus,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Sparkles,
  Check,
  AlertTriangle,
  Languages,
  Calendar,
  Users,
  Ticket,
  Lightbulb,
  MessageSquare,
  CheckCircle
} from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { AddonModal } from '@/components/dashboard/AddonModal';
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

type FeatureItem = string;

const planPrices = {
  basic: { 
    monthly: 49.99, yearly: 479.99, name: 'Basic',
    features: [
      '2.000 pogovorov na mesec',
      'Podpora za 1 jezik',
      'Dodajanje Q&A vprašanj',
      'Nalaganje PDF/Word dokumentov',
      'Učenje iz vaše spletne strani',
      'Widget za vgradnjo na vašo spletno stran',
      'Osnovni pregled statistike pogovorov',
      'Zgodovina pogovorov – 30 dni'
    ] as FeatureItem[]
  },
  pro: { 
    monthly: 119.99, yearly: 1149.99, name: 'Pro',
    features: [
      'Vse iz BASIC paketa, plus:',
      '5.000 pogovorov na mesec',
      'Podpora za več jezikov',
      'Zbiranje kontaktov (leadov) neposredno v pogovoru',
      'Kreiranje support ticketov neposredno preko chatbota',
      'Napredni pregled statistike in analitike',
      'Zgodovina pogovorov – 60 dni'
    ] as FeatureItem[]
  },
  enterprise: { 
    monthly: 299.99, yearly: 2879.99, name: 'Enterprise',
    features: [
      'Vse iz PRO paketa, plus:',
      '10.000 pogovorov na mesec',
      'Rezervacija sestankov neposredno preko chatbota',
      'Pametna priporočila izdelkov (AI)',
      'Zgodovina pogovorov – 180 dni'
    ] as FeatureItem[]
  }
};

const planOrder = ['basic', 'pro', 'enterprise'];

type AddonItem = { id: string; name: string; price: number; period: string; proOnly?: boolean; icon: typeof Languages };

const allAddons: Record<string, AddonItem[]> = {
  monthly: [
    { id: 'capacity_1000', name: '+1.000 pogovorov', price: 12, period: 'mesec', icon: MessageSquare },
    { id: 'capacity_2000', name: '+2.000 pogovorov', price: 22, period: 'mesec', icon: MessageSquare },
    { id: 'capacity_5000', name: '+5.000 pogovorov', price: 52, period: 'mesec', icon: MessageSquare },
    { id: 'capacity_10000', name: '+10.000 pogovorov', price: 99, period: 'mesec', icon: MessageSquare },
    { id: 'multilanguage', name: 'Multilanguage', price: 30, period: 'mesec', icon: Languages },
    { id: 'booking', name: 'Rezervacija sestankov', price: 35, period: 'mesec', proOnly: true, icon: Calendar },
    { id: 'contacts', name: 'Zbiranje kontaktov', price: 15, period: 'mesec', icon: Users },
    { id: 'product_ai', name: 'Product AI', price: 50, period: 'mesec', icon: Lightbulb },
    { id: 'tickets', name: 'Support Ticketi', price: 35, period: 'mesec', icon: Ticket }
  ],
  yearly: [
    { id: 'capacity_1000', name: '+1.000 pogovorov', price: 12, period: 'mesec', icon: MessageSquare },
    { id: 'capacity_2000', name: '+2.000 pogovorov', price: 22, period: 'mesec', icon: MessageSquare },
    { id: 'capacity_5000', name: '+5.000 pogovorov', price: 52, period: 'mesec', icon: MessageSquare },
    { id: 'capacity_10000', name: '+10.000 pogovorov', price: 99, period: 'mesec', icon: MessageSquare },
    { id: 'multilanguage', name: 'Multilanguage', price: 288, period: 'leto', icon: Languages },
    { id: 'booking', name: 'Rezervacija sestankov', price: 336, period: 'leto', proOnly: true, icon: Calendar },
    { id: 'contacts', name: 'Zbiranje kontaktov', price: 144, period: 'leto', icon: Users },
    { id: 'product_ai', name: 'Product AI', price: 480, period: 'leto', icon: Lightbulb },
    { id: 'tickets', name: 'Support Ticketi', price: 336, period: 'leto', icon: Ticket }
  ]
};

const getAddonDetails = (addonId: string, billingPeriod: string): AddonItem => {
  const addons = allAddons[billingPeriod] || allAddons.monthly;
  return addons.find(a => a.id === addonId) || { 
    id: addonId, 
    name: addonId, 
    price: 0, 
    period: billingPeriod === 'yearly' ? 'leto' : 'mesec',
    icon: MessageSquare
  };
};

const getFilteredAddons = (billingPeriod: string, plan: string, activeAddonIds: string[]): AddonItem[] => {
  const periodAddons = allAddons[billingPeriod] || allAddons.monthly;
  const showBooking = plan === 'pro' || plan === 'enterprise';
  
  return periodAddons.filter(addon => {
    if (activeAddonIds.includes(addon.id)) return false;
    if (addon.proOnly && !showBooking) return false;
    return true;
  });
};

export default function DashboardUpgrade() {
  const { widget, loading, fetchWidget } = useWidget();
  const { user } = useAuth();
  const { toast } = useToast();
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<string | null>(null);
  const [cancelAddonDialog, setCancelAddonDialog] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [displayBillingPeriod, setDisplayBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  
  // Upgrade/Downgrade confirmation state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    planId: string | null;
    isDowngrade: boolean;
  }>({ open: false, planId: null, isDowngrade: false });
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Initialize display billing period from widget when it loads
  const [initialized, setInitialized] = useState(false);
  if (!initialized && widget?.billing_period) {
    setDisplayBillingPeriod(widget.billing_period as 'monthly' | 'yearly');
    setInitialized(true);
  }

  if (loading) {
    return (
      <DashboardLayout title="Nadgradi" subtitle="Spremenite paket ali dodajte dodatke">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const currentPlan = widget?.plan || 'basic';
  const billingPeriod = widget?.billing_period || 'monthly';
  const activeAddonIds = (widget?.addons as string[]) || [];
  const currentPlanIndex = planOrder.indexOf(currentPlan);
  
  const availableAddons = getFilteredAddons(billingPeriod, currentPlan, activeAddonIds);
  const activeAddons = activeAddonIds.map(addonId => getAddonDetails(addonId, billingPeriod));

  const handleCancelAddon = async (addonId: string) => {
    if (!widget?.api_key || !user?.email) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za preklic.',
        variant: 'destructive',
      });
      return;
    }

    const addonDetails = getAddonDetails(addonId, billingPeriod);

    setCancelLoading(true);
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/cancel-addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: widget.api_key,
          addon: addonId,
          addon_name: addonDetails.name,
          user_email: user.email
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Addon preklican',
          description: 'Addon bo takoj odstranjen.',
        });
        await fetchWidget();
      } else {
        throw new Error(result.error || 'Napaka pri preklicu addona');
      }
    } catch (error: any) {
      toast({
        title: 'Napaka',
        description: error.message || 'Nekaj je šlo narobe',
        variant: 'destructive',
      });
    } finally {
      setCancelLoading(false);
      setCancelAddonDialog(null);
    }
  };

  const openAddonModal = (addon: string) => {
    setSelectedAddon(addon);
    setAddonModalOpen(true);
  };

  const openConfirmDialog = (planId: string, isDowngrade: boolean) => {
    setConfirmDialog({ open: true, planId, isDowngrade });
  };

  const handleConfirmChange = async () => {
    if (!widget?.api_key || !user?.email || !confirmDialog.planId) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za spremembo paketa.',
        variant: 'destructive',
      });
      return;
    }

    setUpgradeLoading(true);
    
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/create-upgrade-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: widget.api_key,
          new_plan: confirmDialog.planId,
          billing_period: displayBillingPeriod,
          email: user.email,
          cancel_url: window.location.href,
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
      setUpgradeLoading(false);
      setConfirmDialog({ open: false, planId: null, isDowngrade: false });
    }
  };

  const getSelectedPlanPrice = () => {
    if (!confirmDialog.planId) return 0;
    const prices = planPrices[confirmDialog.planId as keyof typeof planPrices];
    return displayBillingPeriod === 'monthly' ? prices.monthly : prices.yearly;
  };

  const getSelectedPlanName = () => {
    if (!confirmDialog.planId) return '';
    return planPrices[confirmDialog.planId as keyof typeof planPrices]?.name || confirmDialog.planId;
  };

  return (
    <DashboardLayout title="Nadgradi" subtitle="Spremenite paket ali dodajte dodatke">
      <div className="space-y-6 animate-slide-up">
        {/* SPREMENI PAKET */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Spremeni paket
            </CardTitle>
            <CardDescription>Izberite paket ki najbolj ustreza vašim potrebam</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Billing period toggle */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-lg bg-muted p-1">
                <button
                  onClick={() => setDisplayBillingPeriod('monthly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    displayBillingPeriod === 'monthly'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Mesečno
                </button>
                <button
                  onClick={() => setDisplayBillingPeriod('yearly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                    displayBillingPeriod === 'yearly'
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(planPrices).map(([planId, planData]) => {
                const isExactCurrentPlan = currentPlan === planId && billingPeriod === displayBillingPeriod;
                const planIndex = planOrder.indexOf(planId);
                const isHigherPlan = planIndex > currentPlanIndex;
                const isLowerPlan = planIndex < currentPlanIndex;
                const isSamePlanDifferentBilling = currentPlan === planId && billingPeriod !== displayBillingPeriod;
                const price = displayBillingPeriod === 'monthly' ? planData.monthly : planData.yearly;
                
                const monthlyCost = planData.monthly * 12;
                const yearlyCost = planData.yearly;
                const savings = Math.round(monthlyCost - yearlyCost);
                
                const isUpgrade = isHigherPlan || (isSamePlanDifferentBilling && displayBillingPeriod === 'yearly');
                const isDowngrade = isLowerPlan || (isSamePlanDifferentBilling && displayBillingPeriod === 'monthly');
                
                return (
                  <div
                    key={planId}
                    className={`rounded-xl p-5 border-2 transition-all duration-200 flex flex-col ${
                      isExactCurrentPlan 
                        ? 'border-amber-500 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 shadow-lg shadow-amber-500/10' 
                        : 'border-border bg-muted/30 hover:border-amber-500/40 hover:bg-amber-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-foreground">{planData.name}</h3>
                      {isExactCurrentPlan && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                          Trenutni
                        </Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      €{price}
                      <span className="text-xs text-muted-foreground/70 ml-1">+DDV</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        /{displayBillingPeriod === 'monthly' ? 'mes' : 'leto'}
                      </span>
                    </div>
                    {displayBillingPeriod === 'yearly' ? (
                      <div className="text-xs text-green-500 font-semibold mb-4">
                        Prihranite €{savings}/leto
                      </div>
                    ) : (
                      <div className="mb-4 h-4" />
                    )}
                    
                    {/* Features list */}
                    <ul className="space-y-2.5 mb-6 flex-grow">
                      {planData.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {isExactCurrentPlan && (
                      <Button
                        className="w-full border-amber-500/30 text-amber-500 mt-auto"
                        size="sm"
                        variant="outline"
                        disabled
                      >
                        Trenutni paket
                      </Button>
                    )}
                    {!isExactCurrentPlan && isUpgrade && (
                      <Button
                        onClick={() => openConfirmDialog(planId, false)}
                        className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0 shadow-lg shadow-amber-500/25 mt-auto"
                        size="sm"
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                        Upgrade
                      </Button>
                    )}
                    {!isExactCurrentPlan && isDowngrade && (
                      <Button
                        onClick={() => openConfirmDialog(planId, true)}
                        className="w-full gap-2 mt-auto"
                        size="sm"
                        variant="secondary"
                      >
                        <ArrowDownCircle className="h-4 w-4" />
                        Downgrade
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* DODATNE FUNKCIJE */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Dodatne funkcije
            </CardTitle>
            <CardDescription>Dodajte dodatne funkcionalnosti vašemu chatbotu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vse funkcije - gumbi */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">Razpoložljive funkcije</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {(allAddons[billingPeriod] || allAddons.monthly)
                  .filter(addon => {
                    // Skrij booking za Basic plan
                    if (addon.proOnly && currentPlan !== 'pro' && currentPlan !== 'enterprise') {
                      return false;
                    }
                    return true;
                  })
                  .map(addon => {
                  const isActive = activeAddonIds.includes(addon.id);
                  const IconComponent = addon.icon;
                  
                  return (
                    <button
                      key={addon.id}
                      onClick={() => !isActive && openAddonModal(addon.id)}
                      disabled={isActive}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 w-full
                        ${isActive 
                          ? 'border-green-500 bg-green-500/10 cursor-default' 
                          : 'border-border bg-muted/30 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer hover:scale-105'
                        }
                      `}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-green-500/20' : 'bg-muted'}`}>
                        {isActive ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <IconComponent className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <span className={`text-sm font-medium text-center ${isActive ? 'text-green-500' : 'text-foreground'}`}>
                        {addon.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        €{addon.price}/{addon.period}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aktivne funkcije */}
            {activeAddons.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Aktivne funkcije</h4>
                <div className="space-y-2">
                  {activeAddons.map(addon => {
                    const IconComponent = addon.icon;
                    return (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-green-500/30 bg-green-500/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/20">
                            <IconComponent className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <span className="font-medium text-foreground">{addon.name}</span>
                            <div className="text-sm text-muted-foreground">
                              €{addon.price}
                              <span className="text-xs ml-1">+DDV</span>
                              /{addon.period}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => setCancelAddonDialog(addon.id)}
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-3 w-3" />
                          Odstrani
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Addon Modal */}
      <AddonModal open={addonModalOpen} onOpenChange={setAddonModalOpen} addon={selectedAddon} />

      {/* Upgrade Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open && !confirmDialog.isDowngrade} onOpenChange={(open) => !open && setConfirmDialog({ open: false, planId: null, isDowngrade: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potrditev upgrade paketa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3" asChild>
              <div>
                <p>
                  Želite nadgraditi na <strong className="text-foreground">{getSelectedPlanName()}</strong> paket?
                </p>
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Trenutni paket:</span>
                    <span>{planPrices[currentPlan as keyof typeof planPrices]?.name || currentPlan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nov paket:</span>
                    <span className="font-semibold text-green-500">{getSelectedPlanName()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span>Naročnina ({displayBillingPeriod === 'monthly' ? 'mesečna' : 'letna'}):</span>
                    <span>€{getSelectedPlanPrice()} <span className="text-xs opacity-70">+DDV</span></span>
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
                      <span>Nov paket bo aktiviran v roku 72 ur</span>
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
            <AlertDialogCancel disabled={upgradeLoading}>Prekliči</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmChange}
              disabled={upgradeLoading}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0"
            >
              {upgradeLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Potrjujem upgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Downgrade Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open && confirmDialog.isDowngrade} onOpenChange={(open) => !open && setConfirmDialog({ open: false, planId: null, isDowngrade: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potrditev downgrade paketa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3" asChild>
              <div>
                <p>
                  Želite downgrade na <strong className="text-foreground">{getSelectedPlanName()}</strong> paket?
                </p>
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Trenutni paket:</span>
                    <span>{planPrices[currentPlan as keyof typeof planPrices]?.name || currentPlan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nov paket:</span>
                    <span className="font-semibold text-orange-500">{getSelectedPlanName()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span>Nova cena:</span>
                    <span className="font-semibold">€{getSelectedPlanPrice()} <span className="text-xs opacity-70">+DDV</span>/{displayBillingPeriod === 'monthly' ? 'mesec' : 'leto'}</span>
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
                      <span>Sprememba bo aktivirana v roku 72 ur</span>
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
            <AlertDialogCancel disabled={upgradeLoading}>Prekliči</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmChange}
              disabled={upgradeLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {upgradeLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Potrjujem downgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Addon Dialog */}
      <AlertDialog open={!!cancelAddonDialog} onOpenChange={() => setCancelAddonDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Preklic funkcije</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3" asChild>
              <div>
                <p>
                  Ali ste prepričani da želite preklicati funkcijo{' '}
                  <strong className="text-foreground">
                    {cancelAddonDialog ? getAddonDetails(cancelAddonDialog, billingPeriod).name : ''}
                  </strong>
                  ?
                </p>

                <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-3 text-sm">
                  <p className="text-amber-400 font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Pomembno:
                  </p>
                  <p className="text-amber-200 mt-1">
                    Funkcija bo takoj odstranjena. Sredstev ne vračamo.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Prekliči</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelAddonDialog && handleCancelAddon(cancelAddonDialog)}
              disabled={cancelLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Prekliči funkcijo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}