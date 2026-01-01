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
  Activity,
  ChevronRight,
  Bot,
  ExternalLink,
  BookOpen,
  Zap,
} from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useConversations } from '@/hooks/useConversations';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MessageUsageCard } from '@/components/dashboard/MessageUsageCard';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { sl } from 'date-fns/locale';
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
  const { stats, messagesByDay, loading: statsLoading } = useDashboardStats(tableName);
  
  // Conversations hook - za zadnje pogovore
  const { conversations, loading: convsLoading } = useConversations(tableName);

  // Knowledge stats
  const [knowledgeStats, setKnowledgeStats] = useState({ qaCount: 0, docsCount: 0, lastUpdate: null as string | null });

  const isActive = widget?.is_active === true;
  const subscriptionStatus = widget?.subscription_status || 'none';
  const plan = widget?.plan || 'basic';
  const hasContactsAddon = Array.isArray(widget?.addons) && widget.addons.includes('contacts');
  
  // Get only first 5 conversations for preview
  const recentConversations = conversations.slice(0, 5);

  // Fetch knowledge stats
  useEffect(() => {
    if (!widget?.table_name) return;
    
    const fetchKnowledgeStats = async () => {
      // Get Q&A count
      const { count: qaCount } = await supabase
        .from('knowledge_qa')
        .select('*', { count: 'exact', head: true })
        .eq('table_name', widget.table_name);
      
      // Get documents count and last update
      const { count: docsCount, data: docs } = await supabase
        .from('knowledge_documents')
        .select('created_at', { count: 'exact' })
        .eq('table_name', widget.table_name)
        .order('created_at', { ascending: false })
        .limit(1);
      
      setKnowledgeStats({
        qaCount: qaCount || 0,
        docsCount: docsCount || 0,
        lastUpdate: docs?.[0]?.created_at || null
      });
    };
    
    fetchKnowledgeStats();
  }, [widget?.table_name]);

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
              {widget?.website_url && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={widget.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                    <ExternalLink className="h-4 w-4" />
                    Odpri stran
                  </a>
                </Button>
              )}
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

        {/* Activity Trend - Last 7 Days */}
        {messagesByDay && messagesByDay.length > 0 && (
          <div className="glass rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Aktivnost zadnjih 7 dni</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/analytics')}>
                Podrobnosti
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={messagesByDay}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Conversations Preview */}
        {recentConversations.length > 0 && (
          <div className="glass rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Zadnji pogovori</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/conversations')}>
                Vsi pogovori
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {recentConversations.map((conv) => (
                <div 
                  key={conv.session_id}
                  className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/dashboard/conversations')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conv.first_question || 'Brez vprašanja'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.first_answer || 'Brez odgovora'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: sl })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Knowledge Base Status */}
        <div className="glass rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Baza znanja</h3>
                <p className="text-sm text-muted-foreground">
                  {knowledgeStats.qaCount} vprašanj • {knowledgeStats.docsCount} dokumentov
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/knowledge')}>
              Uredi
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          {knowledgeStats.lastUpdate && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Zadnja posodobitev: {formatDistanceToNow(new Date(knowledgeStats.lastUpdate), { addSuffix: true, locale: sl })}
              </p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            onClick={() => navigate('/dashboard/knowledge')}
            className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="font-medium text-foreground">Baza znanja</p>
              <p className="text-sm text-muted-foreground">Q&A in dokumenti</p>
            </div>
          </button>
          {hasContactsAddon && (
            <button
              onClick={() => navigate('/dashboard/contacts')}
              className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-foreground">Kontakti</p>
                <p className="text-sm text-muted-foreground">Leads in podatki</p>
              </div>
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Nastavitve</p>
              <p className="text-sm text-muted-foreground">Uredite chatbota</p>
            </div>
          </button>
          {plan === 'basic' && (
            <button
              onClick={() => navigate('/dashboard/upgrade')}
              className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left border border-primary/20"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Nadgradnja</p>
                <p className="text-sm text-muted-foreground">Pro funkcije</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
