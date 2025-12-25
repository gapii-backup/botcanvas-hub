import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserBot } from '@/hooks/useUserBot';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const { userBot, loading } = useUserBot();

  const isActive = userBot?.status === 'active';
  const apiKey = userBot?.api_key;

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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Upravljajte in spremljajte vašega AI chatbota
          </p>
        </div>

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

        {/* Embed Code Section */}
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
      </div>
    </DashboardLayout>
  );
}
