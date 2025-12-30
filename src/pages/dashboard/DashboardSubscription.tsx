import { useState } from 'react';
import { 
  CreditCard, 
  Package, 
  Calendar,
  ExternalLink,
  Loader2,
  Plus,
  X,
  ArrowUpCircle
} from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { UpgradeModal } from '@/components/dashboard/UpgradeModal';
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
    // Already active, don't show in available
    if (activeAddonIds.includes(addon.id)) return false;
    // Booking only for pro/enterprise
    if (addon.proOnly && !showBooking) return false;
    return true;
  });
};

export default function DashboardSubscription() {
  const { widget, loading, fetchWidget } = useWidget();
  const { user } = useAuth();
  const { toast } = useToast();
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<string | null>(null);
  const [cancelAddonDialog, setCancelAddonDialog] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  if (loading) {
    return (
      <DashboardLayout title="Naročnina" subtitle="Upravljajte svojo naročnino">
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
  const currentPlanData = planPrices[currentPlan as keyof typeof planPrices];
  
  const availableAddons = getFilteredAddons(billingPeriod, currentPlan, activeAddonIds);
  const activeAddons = activeAddonIds.map(addonId => getAddonDetails(addonId, billingPeriod));

  const handleManagePayment = async () => {
    if (!widget?.api_key) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za odprtje portala.',
        variant: 'destructive',
      });
      return;
    }

    setPortalLoading(true);
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: widget.api_key,
          return_url: window.location.href
        })
      });

      const result = await response.json();

      if (result.portalUrl) {
        window.location.href = result.portalUrl;
      } else {
        throw new Error(result.error || 'Napaka pri odpiranju portala');
      }
    } catch (error: any) {
      toast({
        title: 'Napaka',
        description: error.message || 'Nekaj je šlo narobe',
        variant: 'destructive',
      });
      setPortalLoading(false);
    }
  };

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

  const getNextPaymentDate = () => {
    const today = new Date();
    const daysToAdd = billingPeriod === 'monthly' ? 30 : 365;
    const nextDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return nextDate.toLocaleDateString('sl-SI');
  };

  return (
    <DashboardLayout title="Naročnina" subtitle="Upravljajte svojo naročnino">
      <div className="space-y-6 animate-slide-up">
        {/* PREGLED NAROČNINE */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Pregled naročnine
            </CardTitle>
            <CardDescription>Podatki o vaši trenutni naročnini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Trenutni paket</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">
                    {currentPlanData?.name || 'Basic'}
                  </span>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    Aktiven
                  </Badge>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Billing period</p>
                <span className="text-xl font-bold text-foreground">
                  {billingPeriod === 'monthly' ? 'Mesečno' : 'Letno'}
                </span>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Cena</p>
                <span className="text-xl font-bold text-foreground">
                  €{currentPlanData ? (billingPeriod === 'monthly' ? currentPlanData.monthly : currentPlanData.yearly) : '0'}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{billingPeriod === 'monthly' ? 'mesec' : 'leto'}
                  </span>
                </span>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Naslednje plačilo</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xl font-bold text-foreground">{getNextPaymentDate()}</span>
                </div>
              </div>
            </div>

            {activeAddons.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">Aktivni dodatki</p>
                <div className="flex flex-wrap gap-2">
                  {activeAddons.map(addon => (
                    <div key={addon.id} className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-foreground">
                        {addon.name}
                      </span>
                      <button
                        onClick={() => setCancelAddonDialog(addon.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Prekliči addon"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* UPRAVLJANJE PLAČILNE METODE */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Plačilna metoda
            </CardTitle>
            <CardDescription>
              Upravljajte plačilno metodo in preglejte zgodovino plačil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-6">
              <p className="text-muted-foreground mb-4">
                Na Stripe portalu lahko:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-6">
                <li>Posodobite plačilno metodo</li>
                <li>Vidite zgodovino plačil in račune</li>
                <li>Prekličete naročnino</li>
              </ul>
              <Button 
                onClick={handleManagePayment}
                disabled={portalLoading}
                variant="outline"
                className="gap-2"
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Upravljaj plačilno metodo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* NADGRADNJA PAKETA */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-primary" />
              Nadgradnja paketa
            </CardTitle>
            <CardDescription>
              Nadgradite na višji paket za več funkcionalnosti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(planPrices).map(([planId, planData]) => {
                const isCurrentPlan = currentPlan === planId;
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
                      <span className="text-sm font-normal text-muted-foreground">
                        /{billingPeriod === 'monthly' ? 'mes' : 'leto'}
                      </span>
                    </div>
                    {!isCurrentPlan && (
                      <Button
                        onClick={() => setUpgradeModalOpen(true)}
                        className="w-full"
                        size="sm"
                      >
                        Nadgradi
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* DODAJANJE ADDONOV */}
        {availableAddons.length > 0 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Razpoložljivi dodatki
              </CardTitle>
              <CardDescription>
                Dodajte dodatne funkcionalnosti svoji naročnini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableAddons.map(addon => (
                  <div
                    key={addon.id}
                    className="rounded-lg p-4 border border-border bg-muted/30"
                  >
                    <h3 className="font-bold text-foreground">{addon.name}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xl font-bold text-foreground">
                        €{addon.price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{addon.period}
                        </span>
                      </div>
                      <Button
                        onClick={() => openAddonModal(addon.id)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Dodaj
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
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
                  <ul className="text-amber-200 mt-2 space-y-1 list-disc list-inside">
                    <li>Addon bo takoj odstranjen in ne boste imeli več dostopa</li>
                    <li>Če ste že plačali do konca obdobja, vam sredstev ne vračamo</li>
                    <li>Addon lahko kadarkoli znova dodate</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>Prekliči</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelAddonDialog && handleCancelAddon(cancelAddonDialog)}
              disabled={cancelLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Da, odstrani addon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
