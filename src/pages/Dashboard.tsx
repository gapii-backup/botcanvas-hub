import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Bot,
  Copy,
  Check,
  MessageSquare,
  Users,
  TrendingUp,
  Settings,
  AlertCircle,
  Clock,
  CheckCircle2,
  Rocket,
  Lock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWidget } from '@/hooks/useWidget';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const subscriptionPrices: Record<string, { monthly: string; yearly: string }> = {
  basic: {
    monthly: 'price_1SjJKK6cfwnnZsVXWEAaqZYr',
    yearly: 'price_1SjJLk6cfwnnZsVX1FhA81fq'
  },
  pro: {
    monthly: 'price_1SjJKk6cfwnnZsVXYShVZi6o',
    yearly: 'price_1SjJMB6cfwnnZsVXhImgf35D'
  },
  enterprise: {
    monthly: 'price_1SjJL86cfwnnZsVXkJ2gbn2z',
    yearly: 'price_1SjJMi6cfwnnZsVXCcGoMNVY'
  }
};

const planPrices: Record<string, { monthly: number; yearly: number }> = {
  basic: { monthly: 29, yearly: 278 },
  pro: { monthly: 59, yearly: 566 },
  enterprise: { monthly: 149, yearly: 1430 }
};

const planNames: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise'
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const { widget, loading, fetchWidget } = useWidget();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscribing, setSubscribing] = useState<'monthly' | 'yearly' | null>(null);

  const isActive = widget?.status === 'active' && widget?.is_active;
  const isSetupPaid = widget?.status === 'setup_paid';
  const apiKey = widget?.api_key;
  const subscriptionStatus = widget?.subscription_status || 'none';
  const plan = widget?.plan || 'basic';
  
  // Handle subscription success/cancelled from URL
  useEffect(() => {
    const subscriptionResult = searchParams.get('subscription');
    if (subscriptionResult === 'success') {
      toast({
        title: 'Naročnina aktivirana!',
        description: 'Vaša naročnina je bila uspešno aktivirana.',
      });
      // Refresh widget data to get updated subscription_status
      fetchWidget();
      // Clear the URL parameter
      setSearchParams({});
    } else if (subscriptionResult === 'cancelled') {
      toast({
        title: 'Naročnina preklicana',
        description: 'Niste dokončali plačila naročnine.',
        variant: 'destructive',
      });
      setSearchParams({});
    }
  }, [searchParams]);
  
  // Show subscription modal when is_active is true but subscription_status is 'none'
  useEffect(() => {
    if (widget?.is_active && subscriptionStatus === 'none') {
      setShowSubscriptionModal(true);
    }
  }, [widget?.is_active, subscriptionStatus]);

  const embedCode = apiKey
    ? `<script src="https://cdn.botmotion.ai/widget.js" data-key="${apiKey}"></script>`
    : `<script src="https://cdn.botmotion.ai/widget.js" data-key="YOUR_API_KEY"></script>`;

  const copyToClipboard = () => {
    if (!apiKey) {
      toast({
        title: 'API ključ ni na voljo',
        description: 'Vaš chatbot še ni aktiven.',
        variant: 'destructive',
      });
      return;
    }
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast({
      title: 'Kopirano!',
      description: 'Embed koda je bila kopirana v odložišče.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubscribe = async (billingPeriod: 'monthly' | 'yearly') => {
    if (!widget?.plan || !user?.email) {
      toast({
        title: 'Napaka',
        description: 'Manjkajo podatki za naročnino.',
        variant: 'destructive',
      });
      return;
    }

    const priceId = subscriptionPrices[widget.plan]?.[billingPeriod];
    if (!priceId) {
      toast({
        title: 'Napaka',
        description: 'Neveljavni naročniški paket.',
        variant: 'destructive',
      });
      return;
    }

    setSubscribing(billingPeriod);
    
    try {
      const response = await fetch('https://hub.botmotion.ai/webhook/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_id: priceId,
          api_key: widget.api_key,
          plan: widget.plan,
          billing_period: billingPeriod,
          user_email: user.email,
          success_url: 'https://app.botmotion.ai/dashboard?subscription=success',
          cancel_url: 'https://app.botmotion.ai/dashboard?subscription=cancelled'
        })
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Napaka',
        description: 'Napaka pri ustvarjanju naročnine. Prosimo, poskusite znova.',
        variant: 'destructive',
      });
      setSubscribing(null);
    }
  };

  const stats = [
    { label: 'Sporočila danes', value: '0', icon: MessageSquare, change: '+0%' },
    { label: 'Aktivni uporabniki', value: '0', icon: Users, change: '+0%' },
    { label: 'Konverzijska stopnja', value: '0%', icon: TrendingUp, change: '+0%' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const currentPlanPrices = planPrices[plan] || planPrices.basic;
  const currentPlanName = planNames[plan] || 'Basic';

  return (
    <DashboardLayout>
      {/* Subscription Modal */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-success" />
              </div>
              <DialogTitle className="text-xl">🎉 Vaš chatbot je pripravljen!</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              Za aktivacijo izberite naročniški paket za <span className="font-semibold text-foreground">{currentPlanName}</span> paket
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => handleSubscribe('monthly')}
              disabled={subscribing !== null}
            >
              {subscribing === 'monthly' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Mesečna naročnina (€{currentPlanPrices.monthly}/mesec)
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full border-success text-success hover:bg-success/10"
              onClick={() => handleSubscribe('yearly')}
              disabled={subscribing !== null}
            >
              {subscribing === 'yearly' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Letna naročnina -20% (€{currentPlanPrices.yearly}/leto)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Upravljajte in spremljajte vašega AI chatbota
          </p>
        </div>

        {/* Setup Paid Banner */}
        {isSetupPaid && (
          <div className="glass rounded-2xl p-4 border-primary/50 animate-slide-up flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-medium">Vaš chatbot se pripravlja</p>
              <p className="text-muted-foreground text-sm">
                Obvestili vas bomo po e-pošti ko bo pripravljen.
              </p>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div
          className={cn(
            'glass rounded-2xl p-6 animate-slide-up',
            isActive ? 'border-success/50' : 'border-warning/50'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'h-14 w-14 rounded-xl flex items-center justify-center',
                  isActive ? 'bg-success/20' : 'bg-warning/20'
                )}
              >
                {isActive ? (
                  <CheckCircle2 className="h-7 w-7 text-success" />
                ) : (
                  <AlertCircle className="h-7 w-7 text-warning" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {isActive ? 'Chatbot je aktiven' : 'Chatbot čaka na aktivacijo'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {isActive
                    ? 'Vaš chatbot uspešno deluje na vaši spletni strani.'
                    : 'Dodajte embed kodo na vašo spletno stran za aktivacijo.'}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/customize')}>
              <Settings className="h-4 w-4 mr-2" />
              Uredi chatbota
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass rounded-2xl p-6 animate-slide-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Embed Code Section - Only show if subscription is active */}
        {subscriptionStatus === 'active' ? (
          <div className="glass rounded-2xl p-6 animate-slide-up delay-400">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Embed koda</h2>
                <p className="text-sm text-muted-foreground">
                  {apiKey
                    ? 'Dodajte to kodo pred zaključni </body> tag'
                    : 'API ključ bo na voljo po aktivaciji chatbota'}
                </p>
              </div>
            </div>

            <div className="relative">
              <pre className={cn(
                "bg-secondary/50 rounded-xl p-4 overflow-x-auto text-sm text-foreground border border-border",
                !apiKey && "opacity-50"
              )}>
                <code>{embedCode}</code>
              </pre>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-3 right-3"
                onClick={copyToClipboard}
                disabled={!apiKey}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Kopirano
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Kopiraj
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 animate-slide-up delay-400 border-warning/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <Lock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Embed koda</h2>
                <p className="text-sm text-muted-foreground">
                  Embed koda bo na voljo po aktivaciji naročnine
                </p>
              </div>
            </div>
            <Button 
              className="mt-4"
              onClick={() => setShowSubscriptionModal(true)}
            >
              Aktiviraj naročnino
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}