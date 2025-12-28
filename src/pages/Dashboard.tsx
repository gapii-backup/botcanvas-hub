import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Copy,
  Check,
  MessageSquare,
  Users,
  TrendingUp,
  Settings,
  AlertCircle,
  CheckCircle,
  Rocket,
  Lock,
  Loader2,
  Calendar,
  ExternalLink,
  Mail,
  BarChart3,
  CreditCard,
  HelpCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWidget } from '@/hooks/useWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useLeads } from '@/hooks/useLeads';
import { useConversationTopics } from '@/hooks/useConversationTopics';
import { useConversations, type Message } from '@/hooks/useConversations';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

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

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const { widget, loading, fetchWidget } = useWidget();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscribing, setSubscribing] = useState<'monthly' | 'yearly' | null>(null);
  const [activeSection, setActiveSection] = useState('dashboard');

  const tableName = widget?.table_name;
  const { stats, messagesByDay, loading: statsLoading } = useDashboardStats(tableName);
  const { leads, loading: leadsLoading } = useLeads(tableName);
  const { categories, topTopics, loading: topicsLoading } = useConversationTopics(tableName);
  const { conversations, loading: convsLoading, fetchMessages } = useConversations(tableName);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dateFilter, setDateFilter] = useState('');

  const isActive = widget?.is_active === true;
  const subscriptionStatus = widget?.subscription_status || 'none';
  const plan = widget?.plan || 'basic';
  const apiKey = widget?.api_key;
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

  const usagePercentage = stats.monthlyLimit > 0 
    ? Math.round((stats.monthlyCount / stats.monthlyLimit) * 100) 
    : 0;

  const currentPlanName = planNames[plan] || 'Basic';

  const handleSelectConversation = async (sessionId: string) => {
    setSelectedConversation(sessionId);
    const msgs = await fetchMessages(sessionId);
    setMessages(msgs);
  };

  const filteredConversations = conversations.filter(conv => {
    if (!dateFilter) return true;
    const convDate = new Date(conv.last_message_at).toISOString().split('T')[0];
    return convDate === dateFilter;
  });

  if (loading) {
    return (
      <DashboardSidebar 
        hasContactsAddon={false}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      >
        <div className="p-6 lg:p-8 space-y-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardSidebar>
    );
  }

  // Section renderers
  const renderDashboardSection = () => (
    <>
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
          onClick={() => setActiveSection('conversations')}
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
          onClick={() => setActiveSection('analytics')}
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
          onClick={() => setActiveSection('settings')}
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
    </>
  );

  const renderConversationsSection = () => (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Pogovori</h2>
        <p className="text-sm text-muted-foreground">Preglejte vse pogovore z vašim chatbotom</p>
      </div>

      {/* Filter po datumu */}
      <div className="flex items-center gap-3">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-48"
        />
        {dateFilter && (
          <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>
            <X className="h-4 w-4 mr-1" />
            Počisti filter
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
        {/* Levi panel - seznam pogovorov */}
        <div className="glass rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-foreground">Pogovori ({filteredConversations.length})</h3>
          </div>
          
          <ScrollArea className="flex-1">
            {convsLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Nalagam pogovore...
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <div
                  key={conv.session_id}
                  onClick={() => handleSelectConversation(conv.session_id)}
                  className={cn(
                    "p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedConversation === conv.session_id && "bg-primary/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground text-sm truncate max-w-[150px]">
                      {conv.session_id.slice(0, 20)}...
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(conv.last_message_at).toLocaleDateString('sl-SI')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {conv.message_count} sporočil
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(conv.last_message_at).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Ni pogovorov</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Desni panel - sporočila */}
        <div className="glass rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-foreground truncate">
              {selectedConversation ? `Pogovor: ${selectedConversation.slice(0, 30)}...` : 'Izberite pogovor'}
            </h3>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {selectedConversation ? (
              messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-foreground text-sm whitespace-pre-wrap">{msg.message}</p>
                      <span className="text-xs text-muted-foreground mt-2 block">
                        {new Date(msg.created_at).toLocaleString('sl-SI')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Izberite pogovor iz seznama na levi</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Usage Progress */}
      <div className="glass rounded-2xl p-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Poraba:</span>
            <span className="text-foreground font-medium">
              {stats.monthlyCount} / {stats.monthlyLimit} pogovorov
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          {usagePercentage > 80 && (
            <div className="flex items-center gap-2 text-warning text-sm mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>Približujete se mesečni omejitvi pogovorov</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="glass rounded-2xl p-6 animate-slide-up">
      <h2 className="text-lg font-semibold text-foreground mb-4">Analiza</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Kategorije pogovorov</h3>
          {categories.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ category }) => category}
                  >
                    {categories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              Ni podatkov o kategorijah
            </div>
          )}
        </div>

        {/* Top Topics */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Top 5 tem</h3>
          {topTopics.length > 0 ? (
            <div className="space-y-3">
              {topTopics.map((topic, index) => (
                <div key={topic.topic} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{index + 1}. {topic.topic}</span>
                  <span className="text-sm text-muted-foreground">{topic.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Ni podatkov o temah
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLeadsSection = () => (
    <div className="glass rounded-2xl p-6 animate-slide-up">
      <h2 className="text-lg font-semibold text-foreground mb-4">Leads</h2>
      
      {hasContactsAddon ? (
        leads.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.slice(0, 10).map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.email || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {lead.session_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(lead.created_at).toLocaleDateString('sl-SI')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Še ni zbranih kontaktov
          </div>
        )
      ) : (
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
            <Lock className="h-5 w-5" />
            <span>🔒 Odklenite zbiranje kontaktov z nadgradnjo paketa</span>
          </div>
          <Button onClick={() => navigate('/pricing')}>
            Nadgradi
          </Button>
        </div>
      )}
    </div>
  );

  const renderSettingsSection = () => (
    <>
      {/* Bot Settings Section */}
      <div className="glass rounded-2xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Nastavitve bota</h2>
          <Button variant="outline" onClick={() => navigate('/customize')}>
            <Settings className="h-4 w-4 mr-2" />
            Uredi videz chatbota
          </Button>
        </div>
        
        {/* Widget Preview */}
        <div className="bg-muted/50 rounded-lg p-4 h-64 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Predogled widgeta</p>
          </div>
        </div>
      </div>

      {/* Embed Code Section */}
      <div className="glass rounded-2xl p-6 animate-slide-up">
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

        {subscriptionStatus === 'active' ? (
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
        ) : (
          <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <Lock className="h-5 w-5 text-warning" />
            <span className="text-warning">Za prikaz embed kode aktivirajte naročnino</span>
          </div>
        )}
      </div>
    </>
  );

  const renderBillingSection = () => (
    <div className="glass rounded-2xl p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Računi</h2>
      </div>
      
      <div className="text-center py-12 text-muted-foreground">
        <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium text-foreground mb-2">Vaši računi</p>
        <p>Zgodovina plačil in upravljanje naročnine bo kmalu na voljo.</p>
      </div>
    </div>
  );

  const renderHelpSection = () => (
    <div className="glass rounded-2xl p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
          <HelpCircle className="h-5 w-5 text-success" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Pomoč</h2>
      </div>
      
      <div className="space-y-6">
        <div className="text-center py-8">
          <Mail className="h-12 w-12 mx-auto mb-4 text-primary opacity-75" />
          <p className="text-lg font-medium text-foreground mb-2">Potrebujete pomoč?</p>
          <p className="text-muted-foreground mb-4">Kontaktirajte nas na</p>
          <a 
            href="mailto:info@botmotion.ai" 
            className="text-primary hover:underline text-lg font-medium"
          >
            info@botmotion.ai
          </a>
        </div>
      </div>
    </div>
  );

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard': return 'Dashboard';
      case 'conversations': return 'Pogovori';
      case 'analytics': return 'Analiza';
      case 'leads': return 'Leads';
      case 'settings': return 'Nastavitve';
      case 'billing': return 'Računi';
      case 'help': return 'Pomoč';
      default: return 'Dashboard';
    }
  };

  return (
    <DashboardSidebar 
      hasContactsAddon={hasContactsAddon}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
    >
      {/* Subscription Modal */}
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

      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">{getSectionTitle()}</h1>
          <p className="text-muted-foreground mt-1">
            Upravljajte in spremljajte vašega AI chatbota
          </p>
        </div>

        {/* Render active section */}
        {activeSection === 'dashboard' && renderDashboardSection()}
        {activeSection === 'conversations' && renderConversationsSection()}
        {activeSection === 'analytics' && renderAnalyticsSection()}
        {activeSection === 'leads' && renderLeadsSection()}
        {activeSection === 'settings' && renderSettingsSection()}
        {activeSection === 'billing' && renderBillingSection()}
        {activeSection === 'help' && renderHelpSection()}
      </div>
    </DashboardSidebar>
  );
}
