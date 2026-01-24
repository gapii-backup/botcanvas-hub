import { useState } from 'react';
import { 
  CreditCard, 
  Package, 
  Calendar,
  ExternalLink,
  Loader2,
  FileText,
  Shield,
  RefreshCw
} from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const planPrices = {
  monthly: { basic: 49.99, pro: 119.99, enterprise: 299.99 },
  yearly: { basic: 479.99, pro: 1149.99, enterprise: 2879.99 }
};

const addonPrices = {
  monthly: {
    capacity_500: 18, capacity_1000: 32, capacity_2500: 70, capacity_5000: 120,
    multilanguage: 30, booking: 35, contacts: 15, product_ai: 50, tickets: 35
  },
  yearly: {
    // Capacity - mesečne cene (vedno mesečni)
    capacity_500: 18, capacity_1000: 32, capacity_2500: 70, capacity_5000: 120,
    // Ostalo - letne cene
    multilanguage: 288, booking: 336, contacts: 144, product_ai: 480, tickets: 336
  }
};

const addonNames: Record<string, string> = {
  capacity_500: '+500 pogovorov',
  capacity_1000: '+1.000 pogovorov',
  capacity_2500: '+2.500 pogovorov',
  capacity_5000: '+5.000 pogovorov',
  multilanguage: 'Multilanguage',
  booking: 'Rezervacija sestankov',
  contacts: 'Zbiranje kontaktov',
  product_ai: 'Product AI',
  tickets: 'Support Ticketi'
};

const planNames: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise'
};

const calculateTotalPrice = (plan: string, billingPeriod: string, addons: string[]): number => {
  const period = billingPeriod as 'monthly' | 'yearly';
  const planPrice = planPrices[period]?.[plan as keyof typeof planPrices.monthly] || 0;
  const periodAddonPrices = addonPrices[period] || addonPrices.monthly;
  const addonTotal = (addons || []).reduce((sum, addon) => {
    return sum + (periodAddonPrices[addon as keyof typeof periodAddonPrices] || 0);
  }, 0);
  return planPrice + addonTotal;
};

export default function DashboardSubscription() {
  const { widget, loading } = useWidget();
  const { toast } = useToast();
  const [portalLoading, setPortalLoading] = useState(false);

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
  const totalPrice = calculateTotalPrice(currentPlan, billingPeriod, activeAddonIds);
  const hasAddons = activeAddonIds.length > 0;

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
          return_url: 'https://app.botmotion.ai/dashboard/upgrade'
        })
      });

      const result = await response.json();

      if (result.portalUrl) {
        // On mobile open in same tab, on desktop open in new tab
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          window.location.href = result.portalUrl;
        } else {
          window.open(result.portalUrl, '_blank');
        }
        setPortalLoading(false);
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

  const getNextPaymentDate = () => {
    const startDate = widget?.billing_period_start ? new Date(widget.billing_period_start) : new Date();
    const today = new Date();
    
    // Calculate next payment date based on billing_period_start
    let nextDate = new Date(startDate);
    
    if (billingPeriod === 'monthly') {
      // For monthly, keep incrementing by 1 month until we're past today
      while (nextDate <= today) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
    } else {
      // For yearly, keep incrementing by 1 year until we're past today
      while (nextDate <= today) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
    }
    
    const day = nextDate.getDate();
    const month = nextDate.getMonth() + 1;
    const year = nextDate.getFullYear();
    return `${day}. ${month}. ${year}`;
  };

  const subscriptionStatus = widget?.subscription_status || 'active';
  const normalizedSubscriptionStatus = String(subscriptionStatus).toLowerCase();
  const isCanceling = ['canceling', 'cancelling', 'cenceling', 'canceled', 'cancelled'].includes(
    normalizedSubscriptionStatus
  );
  const isActive = widget?.is_active !== false && normalizedSubscriptionStatus === 'active';

  return (
    <DashboardLayout title="Naročnina" subtitle="Upravljajte svojo naročnino">
      <div className="space-y-6 animate-slide-up">
        {/* PREGLED NAROČNINE - polovična širina */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Pregled naročnine
              </CardTitle>
              <CardDescription>Podatki o vaši trenutni naročnini</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Trenutni paket</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">
                    {normalizedSubscriptionStatus === 'cancelled' ? 'Neaktivno' : (planNames[currentPlan] || 'Basic')}
                  </span>
                  {normalizedSubscriptionStatus !== 'cancelled' && (
                    isCanceling ? (
                      <Badge className="bg-red-500/20 text-red-500 border border-red-500/30">
                        V preklicu
                      </Badge>
                    ) : widget?.is_active === false ? (
                      <Badge className="bg-red-500/20 text-red-500 border border-red-500/30">
                        Neaktiven
                      </Badge>
                    ) : isActive ? (
                      <Badge className="bg-green-500/20 text-green-500 border border-green-500/30">
                        Aktiven
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-500 border border-red-500/30">
                        Neaktiven
                      </Badge>
                    )
                  )}
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Billing period</p>
                <span className="text-xl font-bold text-foreground">
                  {normalizedSubscriptionStatus === 'cancelled' ? '—' : (billingPeriod === 'monthly' ? 'Mesečno' : 'Letno')}
                </span>
              </div>

              {/* Aktivni dodatki */}
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-3">Aktivni dodatki</p>
                {normalizedSubscriptionStatus === 'cancelled' ? (
                  <p className="text-sm text-muted-foreground/70">—</p>
                ) : activeAddonIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeAddonIds.map(addonId => (
                      <Badge 
                        key={addonId} 
                        variant="secondary" 
                        className="bg-green-500/10 text-green-500 border border-green-500/30 px-3 py-1"
                      >
                        {addonNames[addonId] || addonId}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground/70">Ni aktivnih dodatkov</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PLAČILNA METODA IN ZGODOVINA - enaka širina */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Plačilna metoda in zgodovina
              </CardTitle>
              <CardDescription>
                Upravljajte plačilno metodo in preglejte zgodovino plačil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Portal features */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Plačilna metoda</p>
                    <p className="text-xs text-muted-foreground">Posodobite ali zamenjajte plačilno kartico</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Računi in fakture</p>
                    <p className="text-xs text-muted-foreground">Preglejte in prenesite vse pretekle račune</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Upravljanje naročnine</p>
                    <p className="text-xs text-muted-foreground">Prekličite ali ponovno aktivirajte naročnino</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleManagePayment}
                disabled={portalLoading}
                className="gap-2 w-full"
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Odpri Stripe portal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
