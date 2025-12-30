import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Users,
  TrendingUp,
  Settings,
  CheckCircle,
  Loader2,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MessageUsageCard } from '@/components/dashboard/MessageUsageCard';

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

const planNames: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise'
};

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { widget, loading, fetchWidget } = useWidget();
  const [subscribing, setSubscribing] = useState<'monthly' | 'yearly' | null>(null);

  const tableName = widget?.table_name;
  const { stats, loading: statsLoading } = useDashboardStats(tableName);

  const isActive = widget?.is_active === true;
  const subscriptionStatus = widget?.subscription_status || 'none';
  const plan = widget?.plan || 'basic';
  const hasContactsAddon = Array.isArray(widget?.addons) && widget.addons.includes('contacts');
  
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

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Upravljajte in spremljajte vašega AI chatbota">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" subtitle="Upravljajte in spremljajte vašega AI chatbota">
      <div className="space-y-8">
        {/* Message Usage Card */}
        {subscriptionStatus === 'active' && (
          <MessageUsageCard
            tableName={widget?.table_name}
            billingPeriodStart={widget?.billing_period_start}
            messagesLimit={widget?.messages_limit}
            billingPeriod={widget?.billing_period}
          />
        )}

        {/* Subscription Activation Section */}
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

        {/* Stats Grid - 4 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.messagesToday}</p>
            <p className="text-sm text-muted-foreground mt-1">Sporočila danes</p>
          </div>

          <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-success" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.conversationsThisMonth}</p>
            <p className="text-sm text-muted-foreground mt-1">Pogovori ta mesec</p>
          </div>

          {hasContactsAddon && (
            <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-warning" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.leadsCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Leads</p>
            </div>
          )}

          <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: hasContactsAddon ? '300ms' : '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.conversionRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">Konverzijska stopnja</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/dashboard/conversations')}
            className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Pogovori</p>
              <p className="text-sm text-muted-foreground">Preglejte aktivnost</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/dashboard/analytics')}
            className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground">Analiza</p>
              <p className="text-sm text-muted-foreground">Teme in kategorije</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Settings className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="font-medium text-foreground">Nastavitve</p>
              <p className="text-sm text-muted-foreground">Uredite chatbota</p>
            </div>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
