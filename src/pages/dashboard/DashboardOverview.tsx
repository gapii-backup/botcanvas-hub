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
  TicketCheck,
  Sparkles,
  Shield,
  Clock,
  Lock,
} from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MessageUsageCard } from '@/components/dashboard/MessageUsageCard';
import { SubscriptionPopup } from '@/components/dashboard/SubscriptionPopup';
import { EmbedCodePopup } from '@/components/dashboard/EmbedCodePopup';

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
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  const [showEmbedCodePopup, setShowEmbedCodePopup] = useState(false);

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
  const normalizedSubscriptionStatus = String(subscriptionStatus).toLowerCase();
  const isCanceling = ['canceling', 'cancelling', 'cenceling', 'canceled', 'cancelled'].includes(
    normalizedSubscriptionStatus
  );
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
      // Show embed code popup after successful subscription
      setShowEmbedCodePopup(true);
    } else if (subscriptionResult === 'cancelled') {
      toast({
        title: 'Naročnina preklicana',
        description: 'Niste dokončali plačila naročnine.',
        variant: 'destructive',
      });
      setSearchParams({});
    }
  }, [searchParams]);

  // Show subscription popup when user lands on dashboard with active bot but no subscription
  useEffect(() => {
    if (!loading && widget?.is_active === true && (widget?.subscription_status === 'none' || !widget?.subscription_status)) {
      // Small delay to let page load first
      const timer = setTimeout(() => {
        setShowSubscriptionPopup(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, widget?.is_active, widget?.subscription_status]);

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
        <div className="glass rounded-2xl p-4 sm:p-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="h-14 w-14 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: widget?.bot_icon_background || 'hsl(var(--primary) / 0.2)' }}
              >
                {widget?.bot_avatar ? (
                  <img 
                    src={widget.bot_avatar} 
                    alt="Bot avatar" 
                    className="h-full w-full object-cover"
                  />
                ) : widget?.bot_icon && Array.isArray(widget.bot_icon) && widget.bot_icon.length > 0 ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={widget.bot_icon_color || 'currentColor'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-7 w-7"
                    style={{ color: widget.bot_icon_color || 'hsl(var(--primary))' }}
                  >
                    {(widget.bot_icon as string[]).map((pathData: string, i: number) => {
                      // Handle rect elements
                      if (pathData.startsWith('rect ')) {
                        const props: Record<string, string> = {};
                        pathData.replace('rect ', '').split(' ').forEach(attr => {
                          const [key, value] = attr.split('=');
                          if (key && value) props[key] = value.replace(/"/g, '');
                        });
                        return <rect key={i} {...props} />;
                      }
                      return <path key={i} d={pathData} />;
                    })}
                  </svg>
                ) : (
                  <Bot className="h-7 w-7 text-primary" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-foreground">{widget?.bot_name || 'Moj Chatbot'}</h2>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    normalizedSubscriptionStatus === 'cancelled'
                      ? "bg-red-500/20 text-red-500"
                      : isCanceling 
                        ? "bg-red-500/20 text-red-500"
                        : subscriptionStatus === 'active' 
                          ? "bg-success/20 text-success" 
                          : "bg-muted text-muted-foreground"
                  )}>
                    <span className={cn(
                      "inline-block w-1.5 h-1.5 rounded-full mr-1",
                      normalizedSubscriptionStatus === 'cancelled'
                        ? "bg-red-500"
                        : isCanceling 
                          ? "bg-red-500"
                          : subscriptionStatus === 'active' ? "bg-success" : "bg-muted-foreground"
                    )} />
                    {normalizedSubscriptionStatus === 'cancelled' ? 'Neaktivno' : isCanceling ? 'V preklicu' : widget?.is_active === false ? 'Neaktiven' : subscriptionStatus === 'active' ? 'Aktiven' : 'Neaktiven'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {normalizedSubscriptionStatus === 'cancelled' ? '' : plan ? `${planNames[plan]} paket` : 'Brez paketa'} 
                  {normalizedSubscriptionStatus !== 'cancelled' && widget?.billing_period && ` • ${widget.billing_period === 'yearly' ? 'Letno' : 'Mesečno'}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                size="sm" 
                onClick={() => navigate('/dashboard/upgrade')}
                className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold shadow-lg shadow-amber-500/25"
              >
                <Zap className="h-4 w-4 mr-1" />
                Nadgradi
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/settings')} className="flex-1 sm:flex-none">
                <Settings className="h-4 w-4 mr-1" />
                Uredi
              </Button>
              {user?.email === 'gasper.perko2@gmail.com' && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="flex-1 sm:flex-none">
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </Button>
              )}
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
          <div className="rounded-2xl p-6 md:p-8 animate-slide-up border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-yellow-500/10 shadow-lg shadow-amber-500/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
                <CheckCircle className="w-6 h-6 md:w-7 md:h-7 text-amber-950" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">Vaš chatbot je pripravljen!</h3>
                <p className="text-amber-200/80 text-sm md:text-base">Za aktivacijo izberite naročniški paket</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25"
                size="lg"
                onClick={() => handleSubscribe('monthly')}
                disabled={subscribing !== null}
              >
                {subscribing === 'monthly' && <Loader2 className="h-5 w-5 mr-2 animate-spin text-amber-950" />}
                <span className="font-bold text-amber-950">Mesečna naročnina</span>
              </Button>
              <Button 
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 border-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30"
                size="lg"
                onClick={() => handleSubscribe('yearly')}
                disabled={subscribing !== null}
              >
                {subscribing === 'yearly' && <Loader2 className="h-5 w-5 mr-2 animate-spin text-amber-950" />}
                <span className="font-bold text-amber-950">Letna naročnina</span>
                <span className="ml-3 bg-amber-600 text-amber-100 px-2.5 py-1 rounded-md text-sm font-bold">-20%</span>
              </Button>
            </div>
          </div>
        )}

        {/* Setup Pending Banner */}
        {widget?.status === 'setup_paid' && widget?.is_active === false && (
          <div className="glass rounded-2xl p-6 animate-slide-up border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="h-7 w-7 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Vaš chatbot se pripravlja</h3>
                <p className="text-muted-foreground mt-1">To lahko traja do 24 ur. Obvestili vas bomo, ko bo pripravljen.</p>
              </div>
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
            <p className="text-xs text-muted-foreground mt-1">Sporočila v zadnjem mesecu</p>
          </div>

          <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-warning/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-warning" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.conversationsThisMonth}</p>
            <p className="text-xs text-muted-foreground mt-1">Uporabniki v zadnjem mesecu</p>
          </div>
        </div>


        {/* Quick Shortcuts - Responsive Grid */}
        <div className="glass rounded-2xl p-4 sm:p-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Zap className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-foreground">Hitri dostop</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Pogovori */}
            <button
              onClick={() => navigate('/dashboard/conversations')}
              className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/20 group-hover:bg-primary/30 flex items-center justify-center transition-colors">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground text-center">Pogovori</span>
            </button>
            
            {/* Baza znanja */}
            <button
              onClick={() => navigate('/dashboard/knowledge')}
              className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-warning/10 hover:border-warning/30 border border-transparent transition-all"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-warning/20 group-hover:bg-warning/30 flex items-center justify-center transition-colors">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground text-center">Baza znanja</span>
            </button>
            
            {/* Analiza */}
            <button
              onClick={() => navigate('/dashboard/analytics')}
              className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-success/10 hover:border-success/30 border border-transparent transition-all"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-success/20 group-hover:bg-success/30 flex items-center justify-center transition-colors">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground text-center">Analiza</span>
            </button>
            
            {/* Kontakti */}
            <button
              onClick={() => navigate('/dashboard/contacts')}
              className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-accent/10 hover:border-accent/30 border border-transparent transition-all"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-accent/20 group-hover:bg-accent/30 flex items-center justify-center transition-colors">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground text-center">Kontakti</span>
            </button>
            
            {/* Support Ticketi */}
            <button
              onClick={() => navigate('/dashboard/support')}
              className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-blue-500/10 hover:border-blue-500/30 border border-transparent transition-all"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center transition-colors">
                <TicketCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground text-center">Support</span>
            </button>
            
            {/* Nadgradi */}
            <button
              onClick={() => navigate('/dashboard/upgrade')}
              className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-amber-500/10 hover:border-amber-500/30 border border-transparent transition-all"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-500/20 group-hover:bg-amber-500/30 flex items-center justify-center transition-colors">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground text-center">Nadgradi</span>
            </button>
            
            {/* Naročnina */}
            <button
              onClick={() => navigate('/dashboard/subscription')}
              className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-transparent transition-all"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500/30 flex items-center justify-center transition-colors">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground text-center">Naročnina</span>
            </button>
            
            {/* Nastavitve */}
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent transition-all"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-muted group-hover:bg-muted/80 flex items-center justify-center transition-colors">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground text-center">Nastavitve</span>
            </button>
            
            {/* Pomoč */}
            <button
              onClick={() => navigate('/dashboard/help')}
              className="group flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-violet-500/10 hover:border-violet-500/30 border border-transparent transition-all"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-violet-500/20 group-hover:bg-violet-500/30 flex items-center justify-center transition-colors">
                <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-violet-500" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground text-center">Pomoč</span>
            </button>
          </div>
        </div>

        {/* Embed Code Card */}
        <div className="flex justify-center">
          <div className="glass rounded-2xl p-4 sm:p-6 animate-slide-up w-full max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Embed koda</h3>
            </div>
            {widget?.status !== 'setup_paid' && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={copyEmbedCode}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="hidden sm:inline">{copied ? 'Kopirano' : 'Kopiraj kodo'}</span>
                <span className="sm:hidden">{copied ? 'Kopirano' : 'Kopiraj'}</span>
              </Button>
            )}
          </div>
          
          {widget?.status === 'setup_paid' ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Embed koda bo na voljo, ko bo vaš chatbot aktiven.
              </p>
            </div>
          ) : (
            <>
              {/* Code block */}
              <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                <code className="text-xs sm:text-sm font-mono text-foreground break-all">
                  {embedCode}
                </code>
              </div>
              
              {/* Help button below code block */}
              <div className="mt-3">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto gap-2 bg-blue-500 hover:bg-blue-600 text-white border-0"
                  onClick={() => navigate('/dashboard/docs')}
                >
                  <HelpCircle className="h-4 w-4" />
                  Potrebujete pomoč pri namestitvi?
                </Button>
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Subscription Popup */}
      <SubscriptionPopup
        open={showSubscriptionPopup}
        onOpenChange={setShowSubscriptionPopup}
        onSubscribe={handleSubscribe}
        subscribing={subscribing}
      />

      {/* Embed Code Popup after subscription */}
      <EmbedCodePopup
        open={showEmbedCodePopup}
        onOpenChange={setShowEmbedCodePopup}
        embedCode={embedCode}
      />
    </DashboardLayout>
  );
}
