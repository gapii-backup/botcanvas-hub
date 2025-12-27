import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Palette, MessageSquare, Layout, ArrowLeft, Bot, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { useUserBot } from '@/hooks/useUserBot';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function Complete() {
  const navigate = useNavigate();
  const { config, resetConfig } = useWizardConfig();
  const { updateUserBot } = useUserBot();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleContinueToCheckout = async () => {
    setIsSaving(true);
    try {
      await updateUserBot({
        bot_name: config.name,
        primary_color: config.primaryColor,
        dark_mode: config.darkMode,
        welcome_message: config.welcomeMessage,
        quick_questions: config.quickQuestions,
        position: config.position,
      });
      
      toast({
        title: 'Shranjeno!',
        description: 'Vaše nastavitve so bile shranjene.',
      });
      
      resetConfig();
      navigate('/checkout');
    } catch (error) {
      toast({
        title: 'Napaka',
        description: 'Ni bilo mogoče shraniti nastavitev.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>
            <span className="font-medium text-foreground">Konfiguracija zaključena</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Povzetek nastavitev</h1>
          <p className="text-muted-foreground">Preglejte vaše nastavitve pred plačilom.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Settings summary */}
          <div className="space-y-4">
            {/* Step 1 summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  Osnovni izgled
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ime agenta:</span>
                  <span className="font-medium">{config.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Glavna barva:</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: config.primaryColor }}
                    />
                    <span className="font-mono text-xs">{config.primaryColor}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tema:</span>
                  <span className="font-medium">{config.darkMode ? 'Temna' : 'Svetla'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stil glave:</span>
                  <span className="font-medium">{config.headerStyle === 'gradient' ? 'Gradient' : 'Enobarvno'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Chat nastavitve
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Naslov:</span>
                  <span className="font-medium">{config.homeTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Podnaslov:</span>
                  <span className="font-medium truncate max-w-[200px]">{config.homeSubtitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hitra vprašanja:</span>
                  <span className="font-medium">{config.quickQuestions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email polje:</span>
                  <span className="font-medium">{config.showEmailField ? 'Da' : 'Ne'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Layout className="h-4 w-4 text-primary" />
                  Bubble & pozicija
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Welcome bubble:</span>
                  <span className="font-medium">{config.showBubble ? 'Da' : 'Ne'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pozicija:</span>
                  <span className="font-medium">{config.position === 'right' ? 'Desno' : 'Levo'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stil gumba:</span>
                  <span className="font-medium">{config.triggerStyle === 'floating' ? 'Plavajoči' : 'Robni'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Odmik:</span>
                  <span className="font-medium">{config.verticalOffset}px</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full widget preview */}
          <div 
            className="rounded-2xl border border-border overflow-hidden lg:sticky lg:top-8"
            style={{
              backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)`,
              backgroundSize: '16px 16px',
              backgroundColor: 'hsl(var(--muted) / 0.3)',
            }}
          >
            <div className="p-8 flex items-center justify-center min-h-[500px]">
              <div className="w-full max-w-[320px]">
                {/* Widget preview */}
                <div 
                  className="rounded-t-2xl p-4 flex items-center gap-3"
                  style={{ 
                    background: config.headerStyle === 'gradient'
                      ? `linear-gradient(135deg, ${config.primaryColor}, ${config.primaryColor}cc)` 
                      : config.primaryColor
                  }}
                >
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{config.name}</h3>
                    <p className="text-xs text-white/70">Online</p>
                  </div>
                </div>
                <div className={cn(
                  "rounded-b-2xl p-6",
                  config.darkMode ? "bg-zinc-900" : "bg-white"
                )}>
                  <div className="text-center mb-6">
                    <h4 className={cn(
                      "text-lg font-semibold",
                      config.darkMode ? "text-white" : "text-zinc-900"
                    )}>
                      {config.homeTitle}
                    </h4>
                    <p className={cn(
                      "text-sm mt-1",
                      config.darkMode ? "text-zinc-400" : "text-zinc-500"
                    )}>
                      {config.homeSubtitle}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {config.quickQuestions.slice(0, 3).map((q, i) => (
                      <button
                        key={i}
                        className={cn(
                          "w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors",
                          config.darkMode 
                            ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" 
                            : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={() => navigate('/customize/step-3')} size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazaj
          </Button>
          <Button onClick={handleContinueToCheckout} size="lg" variant="glow" disabled={isSaving}>
            <CreditCard className="h-4 w-4 mr-2" />
            {isSaving ? 'Shranjujem...' : 'Nadaljuj na plačilo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
