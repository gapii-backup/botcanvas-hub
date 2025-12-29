import { useState } from 'react';
import { 
  Receipt, 
  Check, 
  Loader2, 
  Package, 
  Plus, 
  X,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const planPrices = {
  basic: { monthly: 49.99, yearly: 479.99, name: 'Basic' },
  pro: { monthly: 119.99, yearly: 1149.99, name: 'Pro' },
  enterprise: { monthly: 299.99, yearly: 2879.99, name: 'Enterprise' }
};

const planFeatures: Record<string, string[]> = {
  basic: [
    '1.000 pogovorov/mesec',
    'Osnovni AI model',
    '1 multi-channel kanal',
    'Email podpora',
    '30 dni zgodovina'
  ],
  pro: [
    '5.000 pogovorov/mesec',
    'Multilanguage (SLO + HR + SRB)',
    '+1 multi-channel kanal',
    'Analiza pogovorov',
    'Zbiranje kontaktov',
    'Support ticketi',
    'Napredni analytics',
    '60 dni zgodovina'
  ],
  enterprise: [
    '10.000 pogovorov/mesec',
    'Vse iz Pro paketa',
    '+2 multi-channel kanala',
    'Meeting booking',
    'Product recommendations',
    'Status naročil',
    '180 dni zgodovina',
    'Prioritetna podpora'
  ]
};

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

export default function DashboardSubscription() {
  const { widget, loading, fetchWidget } = useWidget();
  const { user } = useAuth();
  const { toast } = useToast();

  const [cancelAddonDialog, setCancelAddonDialog] = useState<string | null>(null);
  const [addAddonDialog, setAddAddonDialog] = useState<string | null>(null);
  const [upgradeDialog, setUpgradeDialog] = useState<string | null>(null);
  const [cancelSubscriptionDialog, setCancelSubscriptionDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (loading) {
    return (
      <DashboardLayout title="Naročnina" subtitle="Upravljajte svojo naročnino in dodatke">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const currentPlan = widget?.plan || 'basic';
  const billingPeriod = widget?.billing_period || 'monthly';
  const activeAddons = (widget?.addons as string[]) || [];
  const currentPlanData = planPrices[currentPlan as keyof typeof planPrices];

  const handleCancelAddon = async (addon: string) => {
    if (!widget?.api_key || !user?.email) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za preklic.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/cancel-addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: widget.api_key,
          addon: addon,
          user_email: user.email
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Addon preklican',
          description: 'Addon bo ostal aktiven do konca trenutnega plačilnega obdobja.'
        });
        setCancelAddonDialog(null);
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
      setActionLoading(false);
    }
  };

  const handleAddAddon = async (addon: string) => {
    if (!widget?.api_key || !user?.email) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za nakup.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/create-addon-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: widget.api_key,
          addon: addon,
          billing_period: billingPeriod,
          user_email: user.email
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Addon dodan!',
          description: result.message || 'Addon je bil uspešno dodan k vaši naročnini.'
        });
        setAddAddonDialog(null);
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
      setActionLoading(false);
    }
  };

  const handleUpgrade = async (newPlan: string) => {
    if (!widget?.api_key || !user?.email) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za nadgradnjo.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/create-upgrade-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: widget.api_key,
          new_plan: newPlan,
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
    } catch (error: any) {
      toast({
        title: 'Napaka',
        description: error.message || 'Nekaj je šlo narobe',
        variant: 'destructive',
      });
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!widget?.api_key || !user?.email) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za preklic.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: widget.api_key,
          user_email: user.email
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Naročnina preklicana',
          description: 'Vaša naročnina bo ostala aktivna do konca trenutnega plačilnega obdobja.'
        });
        setCancelSubscriptionDialog(false);
        await fetchWidget();
      } else {
        throw new Error(result.error || 'Napaka pri preklicu naročnine');
      }
    } catch (error: any) {
      toast({
        title: 'Napaka',
        description: error.message || 'Nekaj je šlo narobe',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const availableAddons = Object.keys(addonPrices).filter(
    addon => !activeAddons.includes(addon)
  );

  const getNextPaymentDate = () => {
    // Simulate next payment date (30 days from now for monthly, 365 for yearly)
    const today = new Date();
    const daysToAdd = billingPeriod === 'monthly' ? 30 : 365;
    const nextDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return nextDate.toLocaleDateString('sl-SI');
  };

  return (
    <DashboardLayout title="Naročnina" subtitle="Upravljajte svojo naročnino in dodatke">
      <div className="space-y-8 animate-slide-up">
        {/* 1. PREGLED NAROČNINE */}
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
                    <Badge key={addon} variant="outline" className="bg-primary/10 border-primary/30">
                      {addonPrices[addon]?.name || addon}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. UPRAVLJANJE ADDONOV */}
        {activeAddons.length > 0 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <X className="h-5 w-5 text-primary" />
                Upravljanje dodatkov
              </CardTitle>
              <CardDescription>Prekličite dodatke ki jih ne potrebujete več</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeAddons.map(addon => {
                  const addonData = addonPrices[addon];
                  if (!addonData) return null;
                  const price = billingPeriod === 'yearly' ? addonData.yearly : addonData.monthly;

                  return (
                    <div key={addon} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{addonData.name}</p>
                        <p className="text-sm text-muted-foreground">
                          €{price}/{billingPeriod === 'monthly' ? 'mesec' : 'leto'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setCancelAddonDialog(addon)}
                      >
                        Prekliči
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. NADGRADNJA PAKETA */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Nadgradnja paketa
            </CardTitle>
            <CardDescription>Izberite paket ki vam najbolj ustreza</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['basic', 'pro', 'enterprise'] as const).map(planId => {
                const planData = planPrices[planId];
                const price = billingPeriod === 'monthly' ? planData.monthly : planData.yearly;
                const isCurrentPlan = currentPlan === planId;
                const features = planFeatures[planId];

                return (
                  <div
                    key={planId}
                    className={`rounded-xl p-6 border ${
                      isCurrentPlan 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-foreground">{planData.name}</h3>
                      {isCurrentPlan && (
                        <Badge className="bg-primary text-primary-foreground">Trenutni</Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-4">
                      €{price}
                      <span className="text-sm text-muted-foreground font-normal">
                        /{billingPeriod === 'monthly' ? 'mesec' : 'leto'}
                      </span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? 'outline' : 'default'}
                      disabled={isCurrentPlan || actionLoading}
                      onClick={() => setUpgradeDialog(planId)}
                    >
                      {isCurrentPlan ? 'Trenutni paket' : `Nadgradi na ${planData.name}`}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 4. DODAJANJE ADDONOV */}
        {availableAddons.length > 0 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Dodaj dodatke
              </CardTitle>
              <CardDescription>Razširite funkcionalnost vašega chatbota</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableAddons.map(addon => {
                  const addonData = addonPrices[addon];
                  const price = billingPeriod === 'yearly' ? addonData.yearly : addonData.monthly;

                  return (
                    <div key={addon} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{addonData.name}</p>
                        <p className="text-sm text-muted-foreground">{addonData.description}</p>
                        <p className="text-sm font-medium text-primary mt-1">
                          €{price}/{billingPeriod === 'monthly' ? 'mesec' : 'leto'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setAddAddonDialog(addon)}
                        disabled={actionLoading}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Dodaj
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 5. PREKLIC NAROČNINE */}
        <Card className="glass border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Preklic naročnine
            </CardTitle>
            <CardDescription>Trajno prekličite vašo naročnino</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Če prekličete naročnino, bo vaš dostop ostal aktiven do konca trenutnega plačilnega obdobja. 
              Po tem datumu boste izgubili dostop do vseh funkcij.
            </p>
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setCancelSubscriptionDialog(true)}
            >
              Prekliči naročnino
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Addon Dialog */}
      <AlertDialog open={!!cancelAddonDialog} onOpenChange={() => setCancelAddonDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Preklic dodatka</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Ali ste prepričani da želite preklicati dodatek{' '}
                <strong className="text-foreground">
                  {cancelAddonDialog && addonPrices[cancelAddonDialog]?.name}
                </strong>?
              </p>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-200 text-sm">
                Dodatek bo ostal aktiven do konca trenutnega plačilnega obdobja.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Prekliči</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelAddonDialog && handleCancelAddon(cancelAddonDialog)}
              disabled={actionLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Potrjujem preklic
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Addon Dialog */}
      <AlertDialog open={!!addAddonDialog} onOpenChange={() => setAddAddonDialog(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Potrditev nakupa dodatka</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4" asChild>
              <div>
                {addAddonDialog && addonPrices[addAddonDialog] && (
                  <>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <div className="font-semibold text-foreground text-lg">
                        {addonPrices[addAddonDialog].name}
                      </div>
                      <div className="text-2xl font-bold text-primary mt-1">
                        €{billingPeriod === 'yearly' 
                          ? addonPrices[addAddonDialog].yearly 
                          : addonPrices[addAddonDialog].monthly}
                        <span className="text-sm text-muted-foreground font-normal">
                          /{billingPeriod === 'monthly' ? 'mesec' : 'leto'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-200">
                      <p className="font-medium text-amber-300 mb-2">⚡ Takojšnje plačilo</p>
                      <p className="text-sm">
                        Sorazmerni del cene za obdobje do vašega naslednjega plačila bo zaračunan takoj iz vaše shranjene plačilne metode.
                      </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                      <p className="font-medium text-foreground">Kako deluje zaračunavanje:</p>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span><strong className="text-foreground">Danes:</strong> Zaračuna se sorazmerni del cene</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span><strong className="text-foreground">Od naslednjega obdobja:</strong> Addon se zaračuna skupaj z naročnino po polni ceni</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/5 rounded-lg p-3">
                      <span>⏱️</span>
                      <span>Addon bo aktiviran v roku <strong>72 ur</strong> po potrditvi nakupa.</span>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={actionLoading}>Prekliči</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => addAddonDialog && handleAddAddon(addAddonDialog)}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Potrjujem nakup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Plan Dialog */}
      <AlertDialog open={!!upgradeDialog} onOpenChange={() => setUpgradeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potrditev nadgradnje paketa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3" asChild>
              <div>
                {upgradeDialog && planPrices[upgradeDialog as keyof typeof planPrices] && (
                  <>
                    <p>
                      Želite nadgraditi na{' '}
                      <strong className="text-foreground">
                        {planPrices[upgradeDialog as keyof typeof planPrices].name}
                      </strong>{' '}
                      paket?
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Trenutni paket:</span>
                        <span>{currentPlanData?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nov paket:</span>
                        <span className="font-semibold text-primary">
                          {planPrices[upgradeDialog as keyof typeof planPrices].name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nova cena:</span>
                        <span className="font-semibold">
                          €{billingPeriod === 'monthly'
                            ? planPrices[upgradeDialog as keyof typeof planPrices].monthly
                            : planPrices[upgradeDialog as keyof typeof planPrices].yearly}
                          /{billingPeriod === 'monthly' ? 'mesec' : 'leto'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
                      <p className="text-amber-300 font-semibold mb-1">⚠️ Pomembno:</p>
                      <ul className="text-amber-200 space-y-1 list-disc list-inside">
                        <li>Vaša trenutna naročnina bo preklicana</li>
                        <li>Vsi aktivni addoni bodo odstranjeni</li>
                        <li>Nov paket bo aktiviran v roku 72 ur</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Prekliči</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => upgradeDialog && handleUpgrade(upgradeDialog)}
              disabled={actionLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Potrjujem nadgradnjo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={cancelSubscriptionDialog} onOpenChange={setCancelSubscriptionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Preklic naročnine</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Ali ste prepričani da želite preklicati naročnino?
              </p>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-destructive">To dejanje bo:</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Preklicalo vašo naročnino</li>
                  <li>Vaš dostop bo ostal aktiven do konca trenutnega plačilnega obdobja ({getNextPaymentDate()})</li>
                  <li>Vsi aktivni dodatki bodo prav tako preklicani</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Prekliči</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={actionLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Da, prekliči naročnino
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
