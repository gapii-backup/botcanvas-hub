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
  CheckCircle,
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

  const isActive = widget?.is_active === true;
  const subscriptionStatus = widget?.subscription_status || 'none';
  const plan = widget?.plan || 'basic';
  const apiKey = widget?.api_key;
  
  // Handle subscription success/cancelled from URL
  useEffect(() => {
    const subscriptionResult = searchParams.get('subscription');
    if (subscriptionResult === 'success') {
      toast({
        title: 'Naročnina aktivirana!',
        description: 'Vaša naročnina je bila uspešno aktivirana.',
      });
      fetchWidget();
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
  
  // Show subscription modal ONLY on first visit when is_active === true AND subscription_status === 'none'
  useEffect(() => {
    const modalShown = localStorage.getItem('subscription_modal_shown');
    if (isActive && subscriptionStatus === 'none' && !modalShown) {
      setShowSubscriptionModal(true);
      localStorage.setItem('subscription_modal_shown', 'true');
    }
  }, [isActive, subscriptionStatus]);

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
          api_key: widget.api_key,
          plan: widget.plan,
          billing_period: billingPeriod,
          user_email: user.email,
          addons: widget.addons || [],
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

  // Get banner config based on status
  const getBannerConfig = () => {
    if (!isActive) {
      return {
        icon: Clock,
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        borderColor: 'border-primary/50',
        title: '⏳ Vaš chatbot se pripravlja.',
        subtitle: 'Obvestili vas bomo po e-pošti ko bo pripravljen.'
      };
    }
    if (subscriptionStatus === 'none') {
      return {
        icon: Rocket,
        iconBg: 'bg-success/20',
        iconColor: 'text-success',
        borderColor: 'border-success/50',
        title: '🎉 Vaš chatbot je pripravljen!',
        subtitle: 'Aktivirajte naročnino za uporabo.'
      };
    }
    if (subscriptionStatus === 'active') {
      return {
        icon: CheckCircle2,
        iconBg: 'bg-success/20',
        iconColor: 'text-success',
        borderColor: 'border-success/50',
        title: '✅ Vaš chatbot je aktiven.',
        subtitle: 'Vaš chatbot uspešno deluje.'
      };
    }
    if (subscriptionStatus === 'failed') {
      return {
        icon: AlertCircle,
        iconBg: 'bg-destructive/20',
        iconColor: 'text-destructive',
        borderColor: 'border-destructive/50',
        title: '⚠️ Plačilo neuspešno.',
        subtitle: 'Prosimo posodobite plačilno metodo.'
      };
    }
    if (subscriptionStatus === 'cancelled') {
      return {
        icon: AlertCircle,
        iconBg: 'bg-warning/20',
        iconColor: 'text-warning',
        borderColor: 'border-warning/50',
        title: 'Naročnina preklicana.',
        subtitle: 'Za nadaljevanje uporabe obnovite naročnino.'
      };
    }
    return null;
  };

  // Get embed section config based on status
  const getEmbedSectionConfig = () => {
    if (!isActive) {
      return {
        icon: Clock,
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        message: '⏳ Vaš chatbot se pripravlja...',
        showButton: false,
        showCode: false
      };
    }
    if (subscriptionStatus === 'none') {
      return {
        icon: Lock,
        iconBg: 'bg-warning/20',
        iconColor: 'text-warning',
        message: 'Za prikaz embed kode aktivirajte naročnino',
        showButton: true,
        showCode: false
      };
    }
    if (subscriptionStatus === 'failed') {
      return {
        icon: AlertCircle,
        iconBg: 'bg-destructive/20',
        iconColor: 'text-destructive',
        message: '⚠️ Plačilo neuspešno. Prosimo posodobite plačilno metodo.',
        showButton: true,
        showCode: false
      };
    }
    if (subscriptionStatus === 'cancelled') {
      return {
        icon: AlertCircle,
        iconBg: 'bg-warning/20',
        iconColor: 'text-warning',
        message: 'Naročnina preklicana. Za nadaljevanje uporabe obnovite naročnino.',
        showButton: true,
        showCode: false
      };
    }
    if (subscriptionStatus === 'active') {
      return {
        showCode: true
      };
    }
    return { showCode: false, showButton: false };
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
  const bannerConfig = getBannerConfig();
  const embedConfig = getEmbedSectionConfig();

  return (
    <DashboardLayout>
      {/* Subscription Modal - Only show if is_active === true AND subscription_status === 'none' */}
      <Dialog open={showSubscriptionModal && isActive && subscriptionStatus === 'none'} onOpenChange={setShowSubscriptionModal}>
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
              {subscribing === 'monthly' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mesečna naročnina
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full border-success text-success hover:bg-success/10"
              onClick={() => handleSubscribe('yearly')}
              disabled={subscribing !== null}
            >
              {subscribing === 'yearly' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Letna naročnina
              <span className="ml-2 bg-success/20 text-success px-2 py-0.5 rounded text-sm font-semibold">-20%</span>
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

        {/* Subscription Activation Section - Show when is_active === true AND subscription_status === 'none' */}
        {isActive && subscriptionStatus === 'none' && (
          <div className="bg-gradient-to-r from-success/10 to-primary/10 border border-success/20 rounded-xl p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Vaš chatbot je pripravljen!</h3>
                <p className="text-muted-foreground">Za aktivacijo izberite naročniški paket</p>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <Button 
                className="flex-1"
                size="lg"
                onClick={() => handleSubscribe('monthly')}
                disabled={subscribing !== null}
              >
                {subscribing === 'monthly' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Mesečna naročnina
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-success to-emerald-600 hover:from-success/90 hover:to-emerald-700 text-primary-foreground"
                size="lg"
                onClick={() => handleSubscribe('yearly')}
                disabled={subscribing !== null}
              >
                {subscribing === 'yearly' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Letna naročnina
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-sm">-20%</span>
              </Button>
            </div>
          </div>
        )}

        {/* Status Banner */}
        {bannerConfig && (
          <div className={cn(
            "glass rounded-2xl p-4 animate-slide-up flex items-center gap-4",
            bannerConfig.borderColor
          )}>
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bannerConfig.iconBg)}>
              <bannerConfig.icon className={cn("h-5 w-5", bannerConfig.iconColor)} />
            </div>
            <div className="flex-1">
              <p className="text-foreground font-medium">{bannerConfig.title}</p>
              <p className="text-muted-foreground text-sm">{bannerConfig.subtitle}</p>
            </div>
            {/* Show "Uredi chatbota" button only if is_active === true */}
            {isActive && (
              <Button variant="outline" onClick={() => navigate('/customize')}>
                <Settings className="h-4 w-4 mr-2" />
                Uredi chatbota
              </Button>
            )}
          </div>
        )}

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

        {/* Embed Code Section */}
        {embedConfig.showCode ? (
          <div className="glass rounded-2xl p-6 animate-slide-up delay-400">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Embed koda</h2>
                <p className="text-sm text-muted-foreground">
                  Dodajte to kodo pred zaključni &lt;/body&gt; tag
                </p>
              </div>
            </div>

            <div className="relative">
              <pre className="bg-secondary/50 rounded-xl p-4 overflow-x-auto text-sm text-foreground border border-border">
                <code>{embedCode}</code>
              </pre>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-3 right-3"
                onClick={copyToClipboard}
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
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", embedConfig.iconBg)}>
                {embedConfig.icon && <embedConfig.icon className={cn("h-5 w-5", embedConfig.iconColor)} />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Embed koda</h2>
                <p className="text-sm text-muted-foreground">
                  {embedConfig.message}
                </p>
              </div>
            </div>
            {embedConfig.showButton && (
              <Button 
                className="mt-4"
                onClick={() => setShowSubscriptionModal(true)}
              >
                Aktiviraj naročnino
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}