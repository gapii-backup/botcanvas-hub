import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ArrowRight, Plus, X, MessageSquare, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useUserBot } from '@/hooks/useUserBot';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function Customize() {
  const navigate = useNavigate();
  const { userBot, loading, updateUserBot } = useUserBot();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [botConfig, setBotConfig] = useState({
    name: 'Moj AI Asistent',
    greeting: 'Pozdravljeni! Kako vam lahko pomagam?',
    primaryColor: '#3B82F6',
    darkMode: true,
    position: 'right' as 'left' | 'right',
    quickQuestions: ['Kakšne so vaše cene?', 'Kako vas lahko kontaktiram?'],
    bookingUrl: '',
  });

  const [newQuestion, setNewQuestion] = useState('');

  // Load config from Supabase
  useEffect(() => {
    if (userBot) {
      setBotConfig({
        name: userBot.bot_name || 'Moj AI Asistent',
        greeting: userBot.welcome_message || 'Pozdravljeni! Kako vam lahko pomagam?',
        primaryColor: userBot.primary_color || '#3B82F6',
        darkMode: userBot.dark_mode ?? true,
        position: (userBot.position as 'left' | 'right') || 'right',
        quickQuestions: userBot.quick_questions || ['Kakšne so vaše cene?', 'Kako vas lahko kontaktiram?'],
        bookingUrl: userBot.booking_url || '',
      });
    }
  }, [userBot]);

  const addQuickQuestion = () => {
    if (newQuestion.trim()) {
      setBotConfig({
        ...botConfig,
        quickQuestions: [...botConfig.quickQuestions, newQuestion.trim()],
      });
      setNewQuestion('');
    }
  };

  const removeQuickQuestion = (index: number) => {
    setBotConfig({
      ...botConfig,
      quickQuestions: botConfig.quickQuestions.filter((_, i) => i !== index),
    });
  };

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      await updateUserBot({
        bot_name: botConfig.name,
        welcome_message: botConfig.greeting,
        primary_color: botConfig.primaryColor,
        dark_mode: botConfig.darkMode,
        position: botConfig.position,
        quick_questions: botConfig.quickQuestions,
        booking_url: botConfig.bookingUrl || null,
      });
      navigate('/checkout');
    } catch (error) {
      toast({
        title: 'Napaka',
        description: 'Ni bilo mogoče shraniti nastavitev. Poskusite znova.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-[420px] border-r border-border p-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left sidebar - Settings */}
      <div className="w-[420px] border-r border-border p-6 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Prilagodite chatbota</h1>
          <p className="text-muted-foreground mt-1">
            Nastavite videz in vedenje vašega bota
          </p>
        </div>

        <Accordion type="multiple" defaultValue={['basic', 'appearance']} className="space-y-4">
          <AccordionItem value="basic" className="glass rounded-xl px-4 border-0">
            <AccordionTrigger className="text-foreground font-medium py-4">
              Osnovne informacije
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="space-y-2">
                <Label>Ime bota</Label>
                <Input
                  value={botConfig.name}
                  onChange={(e) => setBotConfig({ ...botConfig, name: e.target.value })}
                  placeholder="Npr. Prodajni asistent"
                />
              </div>
              <div className="space-y-2">
                <Label>Pozdravno sporočilo</Label>
                <Textarea
                  value={botConfig.greeting}
                  onChange={(e) => setBotConfig({ ...botConfig, greeting: e.target.value })}
                  placeholder="Sporočilo, ki ga uporabnik vidi ob odprtju"
                  rows={3}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="appearance" className="glass rounded-xl px-4 border-0">
            <AccordionTrigger className="text-foreground font-medium py-4">
              Videz
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="space-y-2">
                <Label>Glavna barva</Label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={botConfig.primaryColor}
                    onChange={(e) => setBotConfig({ ...botConfig, primaryColor: e.target.value })}
                    className="h-11 w-16 rounded-lg cursor-pointer bg-transparent"
                  />
                  <Input
                    value={botConfig.primaryColor}
                    onChange={(e) => setBotConfig({ ...botConfig, primaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Temna tema</Label>
                <Switch
                  checked={botConfig.darkMode}
                  onCheckedChange={(checked) => setBotConfig({ ...botConfig, darkMode: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label>Pozicija</Label>
                <div className="flex gap-2">
                  <Button
                    variant={botConfig.position === 'left' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBotConfig({ ...botConfig, position: 'left' })}
                    className="flex-1"
                  >
                    Levo
                  </Button>
                  <Button
                    variant={botConfig.position === 'right' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBotConfig({ ...botConfig, position: 'right' })}
                    className="flex-1"
                  >
                    Desno
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="questions" className="glass rounded-xl px-4 border-0">
            <AccordionTrigger className="text-foreground font-medium py-4">
              Hitra vprašanja
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="space-y-2">
                {botConfig.quickQuestions.map((q, i) => (
                  <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
                    <span className="flex-1 text-sm text-foreground truncate">{q}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeQuickQuestion(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Novo vprašanje..."
                  onKeyPress={(e) => e.key === 'Enter' && addQuickQuestion()}
                />
                <Button variant="outline" size="icon" onClick={addQuickQuestion}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="booking" className="glass rounded-xl px-4 border-0">
            <AccordionTrigger className="text-foreground font-medium py-4">
              Rezervacije (opcijsko)
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-2">
                <Label>URL za rezervacije</Label>
                <Input
                  value={botConfig.bookingUrl}
                  onChange={(e) => setBotConfig({ ...botConfig, bookingUrl: e.target.value })}
                  placeholder="https://calendly.com/..."
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex gap-3 mt-8 pt-6 border-t border-border">
          <Button variant="outline" onClick={() => navigate('/pricing')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazaj
          </Button>
          <Button variant="glow" className="flex-1" onClick={handleContinue} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Nadaljuj na plačilo
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right side - Preview */}
      <div className="flex-1 flex items-center justify-center p-8 bg-muted/30 relative">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        </div>

        {/* Phone mockup */}
        <div className="relative w-[375px] h-[700px] bg-background rounded-[40px] border-4 border-secondary shadow-2xl overflow-hidden animate-fade-in">
          {/* Phone notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-secondary rounded-b-2xl" />
          
          {/* Preview content */}
          <div className="absolute inset-4 top-8 bg-card rounded-2xl overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Simulated website header */}
              <div className="h-12 bg-secondary/50 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/50" />
                <div className="w-3 h-3 rounded-full bg-warning/50" />
                <div className="w-3 h-3 rounded-full bg-success/50" />
                <div className="flex-1 bg-muted rounded-full h-6 ml-4" />
              </div>

              {/* Page content simulation */}
              <div className="flex-1 p-4 space-y-4">
                <div className="h-8 bg-muted rounded-lg w-2/3" />
                <div className="h-4 bg-muted/60 rounded w-full" />
                <div className="h-4 bg-muted/60 rounded w-4/5" />
                <div className="h-32 bg-muted/40 rounded-xl mt-4" />
                <div className="h-4 bg-muted/60 rounded w-full" />
                <div className="h-4 bg-muted/60 rounded w-3/4" />
              </div>

              {/* Chat widget */}
              <div
                className={cn(
                  'absolute bottom-4 w-80',
                  botConfig.position === 'right' ? 'right-4' : 'left-4'
                )}
              >
                {/* Chat window */}
                <div
                  className={cn(
                    'rounded-2xl shadow-2xl overflow-hidden mb-4 animate-slide-up',
                    botConfig.darkMode ? 'bg-card border border-border' : 'bg-background'
                  )}
                >
                  {/* Header */}
                  <div
                    className="p-4 flex items-center gap-3"
                    style={{ backgroundColor: botConfig.primaryColor }}
                  >
                    <div className="h-10 w-10 rounded-full bg-foreground/20 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{botConfig.name}</p>
                      <p className="text-xs text-foreground/70">Običajno odgovori v nekaj sekundah</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-4 space-y-3">
                    <div className="flex gap-2">
                      <div
                        className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: botConfig.primaryColor }}
                      >
                        <MessageSquare className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-2 max-w-[200px]">
                        <p className="text-sm text-foreground">{botConfig.greeting}</p>
                      </div>
                    </div>

                    {/* Quick questions */}
                    {botConfig.quickQuestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {botConfig.quickQuestions.slice(0, 2).map((q, i) => (
                          <button
                            key={i}
                            className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-secondary transition-colors text-foreground"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-border">
                    <div className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
                      <input
                        type="text"
                        placeholder="Vnesite sporočilo..."
                        className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                        disabled
                      />
                      <button
                        className="h-8 w-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: botConfig.primaryColor }}
                      >
                        <Send className="h-4 w-4 text-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
