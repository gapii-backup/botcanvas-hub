import { useState } from 'react';
import { 
  CreditCard, 
  Package, 
  Calendar,
  ExternalLink,
  Loader2
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
    capacity_1000: 12, capacity_2000: 22, capacity_5000: 52, capacity_10000: 99,
    multilanguage: 30, booking: 35, contacts: 15, product_ai: 50, tickets: 35
  },
  yearly: {
    capacity_10000: 99, multilanguage: 288, booking: 336, contacts: 144, product_ai: 480, tickets: 336
  }
};

const addonNames: Record<string, string> = {
  capacity_1000: '+1.000 pogovorov',
  capacity_2000: '+2.000 pogovorov',
  capacity_5000: '+5.000 pogovorov',
  capacity_10000: '+10.000 pogovorov',
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
                    {planNames[currentPlan] || 'Basic'}
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
                <p className="text-sm text-muted-foreground mb-1">Skupna cena</p>
                <div>
                  <span className="text-xl font-bold text-foreground">
                    €{totalPrice.toFixed(2)}
                    <span className="text-xs text-muted-foreground/70 ml-1">+DDV</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      /{billingPeriod === 'monthly' ? 'mesec' : 'leto'}
                    </span>
                  </span>
                  {hasAddons && (
                    <p className="text-xs text-muted-foreground mt-1">(paket + dodatki)</p>
                  )}
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Naslednje plačilo</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xl font-bold text-foreground">{getNextPaymentDate()}</span>
                </div>
              </div>
            </div>

            {/* Aktivni dodatki */}
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-3">Aktivni dodatki</p>
              {activeAddonIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activeAddonIds.map(addonId => (
                    <Badge 
                      key={addonId} 
                      variant="secondary" 
                      className="bg-primary/10 text-primary border border-primary/30 px-3 py-1"
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

        {/* PLAČILNA METODA */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Plačilna metoda in zgodovina plačil
            </CardTitle>
            <CardDescription>
              Upravljajte plačilno metodo in preglejte zgodovino plačil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-6">
              <p className="text-muted-foreground mb-4">
                Upravljajte plačilno metodo, preglejte račune ali prekličite naročnino.
              </p>
              <Button 
                onClick={handleManagePayment}
                disabled={portalLoading}
                className="gap-2"
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Odpri Stripe portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
