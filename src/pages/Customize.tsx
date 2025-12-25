import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ArrowRight, Plus, X, Loader2 } from 'lucide-react';
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

  // Build iframe URL with query parameters
  const previewUrl = useMemo(() => {
    const params = new URLSearchParams({
      color: botConfig.primaryColor,
      name: botConfig.name,
      message: botConfig.greeting,
      position: botConfig.position,
      mode: botConfig.darkMode ? 'dark' : 'light',
      questions: encodeURIComponent(JSON.stringify(botConfig.quickQuestions)),
      booking: botConfig.bookingUrl || ''
    });
    return `https://cdn.botmotion.ai/widget-preview.html?${params.toString()}`;
  }, [botConfig]);

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

      {/* Right side - Widget Preview */}
      <div className="flex-1 flex items-center justify-center p-8 bg-muted/30 relative">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        </div>

        {/* Phone frame with iframe */}
        <div className="relative w-[375px] h-[700px] bg-background rounded-[40px] border-4 border-secondary shadow-2xl overflow-hidden animate-fade-in">
          {/* Phone notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-secondary rounded-b-2xl z-10" />
          
          {/* Widget iframe */}
          <iframe
            key={previewUrl}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Widget Preview"
          />
        </div>
      </div>
    </div>
  );
}
