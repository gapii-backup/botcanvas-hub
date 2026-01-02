import { useState } from 'react';
import { 
  Package,
  Plus,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Sparkles
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
import { UpgradeModal } from '@/components/dashboard/UpgradeModal';
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

const planPrices = {
  basic: { monthly: 49.99, yearly: 479.99, name: 'Basic' },
  pro: { monthly: 119.99, yearly: 1149.99, name: 'Pro' },
  enterprise: { monthly: 299.99, yearly: 2879.99, name: 'Enterprise' }
};

const planOrder = ['basic', 'pro', 'enterprise'];

type AddonItem = { id: string; name: string; price: number; period: string; proOnly?: boolean };

const allAddons: Record<string, AddonItem[]> = {
  monthly: [
    { id: 'capacity_1000', name: '+1.000 pogovorov', price: 12, period: 'mesec' },
    { id: 'capacity_2000', name: '+2.000 pogovorov', price: 22, period: 'mesec' },
    { id: 'capacity_5000', name: '+5.000 pogovorov', price: 52, period: 'mesec' },
    { id: 'capacity_10000', name: '+10.000 pogovorov', price: 99, period: 'mesec' },
    { id: 'multilanguage', name: 'Multilanguage', price: 30, period: 'mesec' },
    { id: 'booking', name: 'Rezervacija sestankov', price: 35, period: 'mesec', proOnly: true },
    { id: 'contacts', name: 'Zbiranje kontaktov', price: 15, period: 'mesec' },
    { id: 'product_ai', name: 'Product AI', price: 50, period: 'mesec' },
    { id: 'tickets', name: 'Support Ticketi', price: 35, period: 'mesec' }
  ],
  yearly: [
    // Capacity addoni - VEDNO mesečni
    { id: 'capacity_1000', name: '+1.000 pogovorov', price: 12, period: 'mesec' },
    { id: 'capacity_2000', name: '+2.000 pogovorov', price: 22, period: 'mesec' },
    { id: 'capacity_5000', name: '+5.000 pogovorov', price: 52, period: 'mesec' },
    { id: 'capacity_10000', name: '+10.000 pogovorov', price: 99, period: 'mesec' },
    // Ostali addoni - letni
    { id: 'multilanguage', name: 'Multilanguage', price: 288, period: 'leto' },
    { id: 'booking', name: 'Rezervacija sestankov', price: 336, period: 'leto', proOnly: true },
    { id: 'contacts', name: 'Zbiranje kontaktov', price: 144, period: 'leto' },
    { id: 'product_ai', name: 'Product AI', price: 480, period: 'leto' },
    { id: 'tickets', name: 'Support Ticketi', price: 336, period: 'leto' }
  ]
};

const getAddonDetails = (addonId: string, billingPeriod: string): AddonItem => {
  const addons = allAddons[billingPeriod] || allAddons.monthly;
  return addons.find(a => a.id === addonId) || { 
    id: addonId, 
    name: addonId, 
    price: 0, 
    period: billingPeriod === 'yearly' ? 'leto' : 'mesec' 
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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [displayBillingPeriod, setDisplayBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

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

  const openUpgradeModal = () => {
    if (widget?.billing_period) {
      setDisplayBillingPeriod(widget.billing_period as 'monthly' | 'yearly');
    }
    setUpgradeModalOpen(true);
  };

  return (
    <DashboardLayout title="Nadgradi" subtitle="Spremenite paket ali dodajte dodatke">
      <div className="space-y-6 animate-slide-up">
        {/* SPREMENI PAKET */}
        <Card className="overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-yellow-500/5 to-orange-500/5">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-b border-amber-500/20">
            <CardTitle className="flex items-center gap-2 text-amber-500">
              <Sparkles className="h-5 w-5" />
              Spremeni paket
            </CardTitle>
            <CardDescription>Izberite paket ki najbolj ustreza vašim potrebam</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Billing period toggle */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-xl bg-amber-500/10 p-1.5 border border-amber-500/20">
                <button
                  onClick={() => setDisplayBillingPeriod('monthly')}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    displayBillingPeriod === 'monthly'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/25'
                      : 'text-amber-600 hover:text-amber-500 hover:bg-amber-500/10'
                  }`}
                >
                  Mesečno
                </button>
                <button
                  onClick={() => setDisplayBillingPeriod('yearly')}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    displayBillingPeriod === 'yearly'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/25'
                      : 'text-amber-600 hover:text-amber-500 hover:bg-amber-500/10'
                  }`}
                >
                  Letno
                  <Badge className="bg-green-500 text-white text-xs border-0">
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
                    className={`rounded-xl p-5 border-2 transition-all duration-200 ${
                      isExactCurrentPlan 
                        ? 'border-amber-500 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 shadow-lg shadow-amber-500/10' 
                        : 'border-amber-500/20 bg-card/50 hover:border-amber-500/40 hover:bg-amber-500/5'
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
                    {isExactCurrentPlan && (
                      <Button
                        className="w-full border-amber-500/30 text-amber-500"
                        size="sm"
                        variant="outline"
                        disabled
                      >
                        Trenutni paket
                      </Button>
                    )}
                    {!isExactCurrentPlan && isUpgrade && (
                      <Button
                        onClick={openUpgradeModal}
                        className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0 shadow-lg shadow-amber-500/25"
                        size="sm"
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                        Nadgradi
                      </Button>
                    )}
                    {!isExactCurrentPlan && isDowngrade && (
                      <Button
                        onClick={openUpgradeModal}
                        className="w-full gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:text-amber-500"
                        size="sm"
                        variant="outline"
                      >
                        <ArrowDownCircle className="h-4 w-4" />
                        Downgradi
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* DODATKI */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Dodatki
            </CardTitle>
            <CardDescription>Upravljajte dodatne funkcionalnosti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Aktivni dodatki */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Aktivni dodatki</h4>
                {activeAddons.length > 0 ? (
                  <div className="space-y-2">
                    {activeAddons.map(addon => (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5"
                      >
                        <div>
                          <span className="font-medium text-foreground">{addon.name}</span>
                          <div className="text-sm text-muted-foreground">
                            €{addon.price}
                            <span className="text-xs ml-1">+DDV</span>
                            /{addon.period}
                          </div>
                        </div>
                        <Button
                          onClick={() => setCancelAddonDialog(addon.id)}
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                        >
                          <X className="h-3 w-3" />
                          Prekliči
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-border bg-muted/20 text-center">
                    <p className="text-muted-foreground text-sm">Ni aktivnih dodatkov</p>
                  </div>
                )}
              </div>

              {/* Razpoložljivi dodatki */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Razpoložljivi dodatki</h4>
                {availableAddons.length > 0 ? (
                  <div className="space-y-2">
                    {availableAddons.map(addon => (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                      >
                        <div>
                          <span className="font-medium text-foreground">{addon.name}</span>
                          <div className="text-sm text-muted-foreground">
                            €{addon.price}
                            <span className="text-xs ml-1">+DDV</span>
                            /{addon.period}
                          </div>
                        </div>
                        <Button
                          onClick={() => openAddonModal(addon.id)}
                          size="sm"
                          variant="outline"
                          className="gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Dodaj
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-border bg-muted/20 text-center">
                    <p className="text-muted-foreground text-sm">Vsi dodatki so že aktivni</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Addon Modal */}
      <AddonModal open={addonModalOpen} onOpenChange={setAddonModalOpen} addon={selectedAddon} />

      {/* Upgrade Modal */}
      <UpgradeModal 
        open={upgradeModalOpen} 
        onOpenChange={setUpgradeModalOpen} 
        initialBillingPeriod={displayBillingPeriod}
      />

      {/* Cancel Addon Dialog */}
      <AlertDialog open={!!cancelAddonDialog} onOpenChange={() => setCancelAddonDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Preklic addona</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3" asChild>
              <div>
                <p>
                  Ali ste prepričani da želite preklicati addon{' '}
                  <strong className="text-foreground">
                    {cancelAddonDialog ? getAddonDetails(cancelAddonDialog, billingPeriod).name : ''}
                  </strong>
                  ?
                </p>

                <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-3 text-sm">
                  <p className="text-amber-400 font-semibold">⚠️ Pomembno:</p>
                  <p className="text-amber-200 mt-1">
                    Addon bo takoj odstranjen. Sredstev ne vračamo.
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
              Prekliči addon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}