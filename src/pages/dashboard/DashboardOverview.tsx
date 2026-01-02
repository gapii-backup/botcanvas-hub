import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Users,
  Settings,
  CheckCircle,
  Loader2,
  BarChart3,
  Bot,
  BookOpen,
  Zap,
  Code,
  Copy,
  Check,
  Mail,
  UserCheck,
  CreditCard,
  HelpCircle,
  Headphones,
} from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MessageUsageCard } from '@/components/dashboard/MessageUsageCard';

import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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

// Embed code state
  const [copied, setCopied] = useState(false);
  const apiKey = widget?.api_key;
  const embedCode = apiKey
    ? `<script src="https://cdn.botmotion.ai/widget.js" data-key="${apiKey}"></script>`
    : `<script src="https://cdn.botmotion.ai/widget.js" data-key="YOUR_API_KEY"></script>`;
  const isActive = widget?.is_active === true;
  const subscriptionStatus = widget?.subscription_status || 'none';
  const plan = widget?.plan || 'basic';
  const hasContactsAddon = Array.isArray(widget?.addons) && widget.addons.includes('contacts');

  // Copy embed code to clipboard
  const copyEmbedCode = () => {
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
        {/* Chatbot Status Card */}
        <div className="glass rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center">
                <Bot className="h-7 w-7 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-foreground">{widget?.bot_name || 'Moj Chatbot'}</h2>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    subscriptionStatus === 'active' 
                      ? "bg-success/20 text-success" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <span className={cn(
                      "inline-block w-1.5 h-1.5 rounded-full mr-1",
                      subscriptionStatus === 'active' ? "bg-success" : "bg-muted-foreground"
                    )} />
                    {subscriptionStatus === 'active' ? 'Aktiven' : 'Neaktiven'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {plan ? `${planNames[plan]} paket` : 'Brez paketa'} 
                  {widget?.billing_period && ` • ${widget.billing_period === 'yearly' ? 'Letno' : 'Mesečno'}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => navigate('/dashboard/upgrade')}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold shadow-lg shadow-amber-500/25"
              >
                <Zap className="h-4 w-4 mr-1" />
                Nadgradi
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/settings')}>
                <Settings className="h-4 w-4 mr-1" />
                Uredi
              </Button>
            </div>
          </div>
        </div>

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

        {/* Stats Grid - 4 cards in a row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.messagesToday}</p>
            <p className="text-xs text-muted-foreground mt-1">Sporočila danes</p>
          </div>

          <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-success/20 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.sessionsToday}</p>
            <p className="text-xs text-muted-foreground mt-1">Uporabniki danes</p>
          </div>

          <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center">
                <Mail className="h-4 w-4 text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.humanMessagesCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Sporočila ta mesec</p>
          </div>

          <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-warning/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-warning" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.conversationsThisMonth}</p>
            <p className="text-xs text-muted-foreground mt-1">Uporabniki ta mesec</p>
          </div>
        </div>

        {/* Leads card - separate row if addon is active */}
        {hasContactsAddon && (
          <div className="glass rounded-2xl p-5 animate-slide-up max-w-xs" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.leadsCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Leads</p>
          </div>
        )}

        {/* Quick Shortcuts - 3x3 Grid */}
        <div className="glass rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-foreground">Hitri dostop</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/dashboard/conversations')}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/20 group-hover:bg-primary/30 flex items-center justify-center transition-colors">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Pogovori</span>
            </button>
            
            <button
              onClick={() => navigate('/dashboard/analytics')}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-success/10 hover:border-success/30 border border-transparent transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-success/20 group-hover:bg-success/30 flex items-center justify-center transition-colors">
                <BarChart3 className="h-6 w-6 text-success" />
              </div>
              <span className="text-sm font-medium text-foreground">Analitika</span>
            </button>
            
            <button
              onClick={() => navigate('/dashboard/knowledge')}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-warning/10 hover:border-warning/30 border border-transparent transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-warning/20 group-hover:bg-warning/30 flex items-center justify-center transition-colors">
                <BookOpen className="h-6 w-6 text-warning" />
              </div>
              <span className="text-sm font-medium text-foreground">Znanje</span>
            </button>
            
            <button
              onClick={() => navigate('/dashboard/contacts')}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-accent/10 hover:border-accent/30 border border-transparent transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-accent/20 group-hover:bg-accent/30 flex items-center justify-center transition-colors">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <span className="text-sm font-medium text-foreground">Kontakti</span>
            </button>
            
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-muted group-hover:bg-muted/80 flex items-center justify-center transition-colors">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">Nastavitve</span>
            </button>
            
            <button
              onClick={() => navigate('/dashboard/upgrade')}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-amber-500/10 hover:border-amber-500/30 border border-transparent transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 group-hover:bg-amber-500/30 flex items-center justify-center transition-colors">
                <Zap className="h-6 w-6 text-amber-500" />
              </div>
              <span className="text-sm font-medium text-foreground">Nadgradi</span>
            </button>
            
            <button
              onClick={() => navigate('/dashboard/subscription')}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-transparent transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500/30 flex items-center justify-center transition-colors">
                <CreditCard className="h-6 w-6 text-emerald-500" />
              </div>
              <span className="text-sm font-medium text-foreground">Naročnina</span>
            </button>
            
            <button
              onClick={() => navigate('/dashboard/support')}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-blue-500/10 hover:border-blue-500/30 border border-transparent transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center transition-colors">
                <Headphones className="h-6 w-6 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-foreground">Podpora</span>
            </button>
            
            <button
              onClick={() => navigate('/dashboard/help')}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-violet-500/10 hover:border-violet-500/30 border border-transparent transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-violet-500/20 group-hover:bg-violet-500/30 flex items-center justify-center transition-colors">
                <HelpCircle className="h-6 w-6 text-violet-500" />
              </div>
              <span className="text-sm font-medium text-foreground">Pomoč</span>
            </button>
          </div>
        </div>

        {/* Embed Code Card */}
        <div className="glass rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Embed koda</h3>
            </div>
            <Button variant="outline" size="sm" onClick={copyEmbedCode}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Kopirano' : 'Kopiraj'}
            </Button>
          </div>
          <textarea
            readOnly
            value={embedCode}
            className="w-full p-3 rounded-lg bg-muted/50 text-sm font-mono text-foreground border border-border/50 resize-none"
            rows={2}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Prilepite to kodo na vašo spletno stran
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
