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
  basic: { monthly: 49.99, yearly: 479.99, name: 'Basic' },
  pro: { monthly: 119.99, yearly: 1149.99, name: 'Pro' },
  enterprise: { monthly: 299.99, yearly: 2879.99, name: 'Enterprise' }
};

const addonNames: Record<string, string> = {
  contacts: 'Zbiranje kontaktov',
  tickets: 'Support Ticketi'
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
        </div>
      </DashboardLayout>
    );
  }

  const currentPlan = widget?.plan || 'basic';
  const billingPeriod = widget?.billing_period || 'monthly';
  const activeAddons = (widget?.addons as string[]) || [];
  const currentPlanData = planPrices[currentPlan as keyof typeof planPrices];

  const handleManageSubscription = async () => {
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
                      {addonNames[addon] || addon}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* UPRAVLJAJ NAROČNINO */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Upravljanje naročnine
            </CardTitle>
            <CardDescription>
              Odprite portal za upravljanje vaše naročnine, plačilnih metod in dodatkov
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-6">
              <p className="text-muted-foreground mb-4">
                Na Stripe portalu lahko:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-6">
                <li>Dodate ali odstranite dodatke</li>
                <li>Nadgradite ali spremenite paket</li>
                <li>Posodobite plačilno metodo</li>
                <li>Prekličete naročnino</li>
                <li>Vidite zgodovino plačil in račune</li>
              </ul>
              <Button 
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="gap-2"
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Upravljaj naročnino
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
