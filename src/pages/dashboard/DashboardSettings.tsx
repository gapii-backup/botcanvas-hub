import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bot, Copy, Check, Settings, Lock } from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function DashboardSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { widget, loading } = useWidget();
  const [copied, setCopied] = useState(false);

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

  if (loading) {
    return (
      <DashboardLayout title="Nastavitve" subtitle="Upravljajte nastavitve vašega chatbota">
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Nastavitve" subtitle="Upravljajte nastavitve vašega chatbota">
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
      </div>
    </DashboardLayout>
  );
}
