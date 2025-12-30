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
    { id: 'capacity_10000', name: '+10.000 pogovorov', price: 99, period: 'leto' },
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
  const [planChangeDialog, setPlanChangeDialog] = useState<{ plan: string; isUpgrade: boolean } | null>(null);
  const [planChangeLoading, setPlanChangeLoading] = useState(false);

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

  const handlePlanChange = async (newPlan: string) => {
    if (!widget?.api_key || !user?.email) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za spremembo paketa.',
        variant: 'destructive',
      });
      return;
    }

    setPlanChangeLoading(true);
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: widget.api_key,
          new_plan: newPlan,
          billing_period: billingPeriod,
          user_email: user.email,
          return_url: window.location.href
        })
      });

      const result = await response.json();

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else if (result.success) {
        toast({
          title: 'Paket spremenjen',
          description: 'Vaš paket je bil uspešno spremenjen.',
        });
        await fetchWidget();
      } else {
        throw new Error(result.error || 'Napaka pri spremembi paketa');
      }
    } catch (error: any) {
      toast({
        title: 'Napaka',
        description: error.message || 'Nekaj je šlo narobe',
        variant: 'destructive',
      });
    } finally {
      setPlanChangeLoading(false);
      setPlanChangeDialog(null);
    }
  };

  const openAddonModal = (addon: string) => {
    setSelectedAddon(addon);
    setAddonModalOpen(true);
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(planPrices).map(([planId, planData]) => {
                const isCurrentPlan = currentPlan === planId;
                const planIndex = planOrder.indexOf(planId);
                const isUpgrade = planIndex > currentPlanIndex;
                const isDowngrade = planIndex < currentPlanIndex;
                const price = billingPeriod === 'monthly' ? planData.monthly : planData.yearly;
                
                return (
                  <div
                    key={planId}
                    className={`rounded-lg p-4 border ${
                      isCurrentPlan 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-foreground">{planData.name}</h3>
                      {isCurrentPlan && (
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          Trenutni
                        </Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-4">
                      €{price}
                      <span className="text-xs text-muted-foreground/70 ml-1">+DDV</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        /{billingPeriod === 'monthly' ? 'mes' : 'leto'}
                      </span>
                    </div>
                    {isUpgrade && (
                      <Button
                        onClick={() => setPlanChangeDialog({ plan: planId, isUpgrade: true })}
                        className="w-full gap-2"
                        size="sm"
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                        Nadgradi
                      </Button>
                    )}
                    {isDowngrade && (
                      <Button
                        onClick={() => setPlanChangeDialog({ plan: planId, isUpgrade: false })}
                        className="w-full gap-2"
                        size="sm"
                        variant="secondary"
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

      {/* Plan Change Dialog */}
      <AlertDialog open={!!planChangeDialog} onOpenChange={() => setPlanChangeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {planChangeDialog?.isUpgrade ? 'Nadgradnja paketa' : 'Downgrade paketa'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3" asChild>
              <div>
                <p>
                  Ali ste prepričani da želite {planChangeDialog?.isUpgrade ? 'nadgraditi' : 'downgradati'} na paket{' '}
                  <strong className="text-foreground">
                    {planChangeDialog ? planPrices[planChangeDialog.plan as keyof typeof planPrices]?.name : ''}
                  </strong>
                  ?
                </p>

                {!planChangeDialog?.isUpgrade && (
                  <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-3 text-sm">
                    <p className="text-amber-400 font-semibold">⚠️ Pomembno:</p>
                    <p className="text-amber-200 mt-1">
                      Pri downgradu lahko izgubite dostop do nekaterih funkcionalnosti.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Prekliči</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => planChangeDialog && handlePlanChange(planChangeDialog.plan)}
              disabled={planChangeLoading}
            >
              {planChangeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {planChangeDialog?.isUpgrade ? 'Nadgradi' : 'Downgradi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
