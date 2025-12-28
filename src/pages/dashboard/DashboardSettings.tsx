import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bot, Copy, Check, Settings, Lock, Home, MessagesSquare, MousePointer } from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WidgetPreview, TriggerPreview } from '@/components/widget/WidgetPreview';

type PreviewType = 'home' | 'chat' | 'trigger';

export default function DashboardSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { widget, loading } = useWidget();
  const { config } = useWizardConfig();
  const [copied, setCopied] = useState(false);
  const [activePreview, setActivePreview] = useState<PreviewType>('home');

  const subscriptionStatus = widget?.subscription_status || 'none';
  const apiKey = widget?.api_key;

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

  const previewTabs = [
    { id: 'home' as const, label: 'Domača stran', icon: Home },
    { id: 'chat' as const, label: 'Pogovor', icon: MessagesSquare },
    { id: 'trigger' as const, label: 'Gumb', icon: MousePointer },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Nastavitve" subtitle="Upravljajte nastavitve vašega chatbota">
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Nastavitve" subtitle="Upravljajte nastavitve vašega chatbota">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left side - Settings & Embed Code */}
        <div className="space-y-6">
          {/* Bot Settings Section */}
          <div className="glass rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Nastavitve bota</h2>
              <Button variant="outline" onClick={() => navigate('/customize')}>
                <Settings className="h-4 w-4 mr-2" />
                Uredi videz chatbota
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Prilagodite izgled in obnašanje vašega AI asistenta.
            </p>
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
        </div>

        {/* Right side - Widget Preview */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Predogled vašega AI asistenta</h2>
            <p className="text-sm text-muted-foreground">Tako bo izgledal vaš chatbot na spletni strani.</p>
          </div>

          {/* Preview tabs */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            {previewTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePreview(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activePreview === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Preview container */}
          <div 
            className="rounded-2xl border border-border overflow-hidden"
            style={{
              backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground) / 0.2) 1px, transparent 1px)`,
              backgroundSize: '12px 12px',
              backgroundColor: 'hsl(var(--muted) / 0.4)',
            }}
          >
            <div className="p-6 flex items-center justify-center min-h-[500px]">
              {activePreview === 'home' && (
                <WidgetPreview config={config} showChat={false} showHome={true} />
              )}
              {activePreview === 'chat' && (
                <WidgetPreview config={config} showChat={true} showHome={false} />
              )}
              {activePreview === 'trigger' && (
                <TriggerPreview config={config} />
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
