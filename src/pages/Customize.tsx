import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ArrowRight, Plus, X, Loader2 } from 'lucide-react';
import { useUserBot } from '@/hooks/useUserBot';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function Customize() {
  const navigate = useNavigate();
  const { userBot, loading, updateUserBot } = useUserBot();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [botConfig, setBotConfig] = useState({
    // Osnovne info
    name: 'Moj AI Asistent',
    greeting: 'Pozdravljeni! Kako vam lahko pomagam?',
    homeTitle: 'Pozdravljeni!',
    homeSubtitle: 'Kako vam lahko pomagam?',
    
    // Barve
    primaryColor: '#3B82F6',
    darkMode: true,
    headerStyle: 'gradient' as 'gradient' | 'solid',
    botIconBackground: '#3B82F6',
    botIconColor: '#FFFFFF',
    
    // Pozicija
    position: 'right' as 'left' | 'right',
    verticalOffset: 24,
    triggerStyle: 'floating' as 'floating' | 'edge',
    edgeTriggerText: 'Klikni me',
    
    // Funkcije
    quickQuestions: ['Kakšne so vaše cene?', 'Kako vas kontaktiram?'],
    showEmailField: true,
    showBubble: true,
    bookingEnabled: false,
    bookingUrl: '',
    supportEnabled: true,
  });

  const [newQuestion, setNewQuestion] = useState('');

  // Build iframe URL with query parameters
  const previewUrl = useMemo(() => {
    const params = new URLSearchParams({
      preview: 'true',
      color: botConfig.primaryColor,
      name: botConfig.name,
      message: botConfig.greeting,
      title: botConfig.homeTitle,
      subtitle: botConfig.homeSubtitle,
      position: botConfig.position,
      mode: botConfig.darkMode ? 'dark' : 'light',
      headerStyle: botConfig.headerStyle,
      iconBg: botConfig.botIconBackground,
      iconColor: botConfig.botIconColor,
      offset: String(botConfig.verticalOffset),
      trigger: botConfig.triggerStyle,
      edgeText: botConfig.edgeTriggerText,
      questions: encodeURIComponent(JSON.stringify(botConfig.quickQuestions)),
      booking: botConfig.bookingUrl,
      bookingEnabled: String(botConfig.bookingEnabled),
      supportEnabled: String(botConfig.supportEnabled),
      bubble: String(botConfig.showBubble),
      emailField: String(botConfig.showEmailField),
    });
    return `https://cdn.botmotion.ai/widget-preview.html?${params.toString()}`;
  }, [botConfig]);

  // Load config from Supabase
  useEffect(() => {
    if (userBot) {
      setBotConfig((prev) => ({
        ...prev,
        name: userBot.bot_name || 'Moj AI Asistent',
        greeting: userBot.welcome_message || 'Pozdravljeni! Kako vam lahko pomagam?',
        primaryColor: userBot.primary_color || '#3B82F6',
        darkMode: userBot.dark_mode ?? true,
        position: (userBot.position as 'left' | 'right') || 'right',
        quickQuestions: userBot.quick_questions || ['Kakšne so vaše cene?', 'Kako vas kontaktiram?'],
        bookingUrl: userBot.booking_url || '',
      }));
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
        <div className="flex-1 border-r border-border p-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <div className="w-[450px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left sidebar - Settings */}
      <div className="flex-1 border-r border-border p-6 flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Prilagodite chatbota</h1>
          <p className="text-muted-foreground mt-1">
            Nastavite videz in vedenje vašega bota
          </p>
        </div>

        {/* Grid layout for all settings */}
        <div className="flex-1 grid grid-cols-3 gap-6">
          {/* Column 1: Osnovne informacije + Barve */}
          <div className="space-y-6">
            {/* Osnovne informacije */}
            <div className="glass rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">
                Osnovne informacije
              </h3>
              <div className="space-y-1">
                <Label className="text-sm">Ime bota</Label>
                <Input
                  value={botConfig.name}
                  onChange={(e) => setBotConfig({ ...botConfig, name: e.target.value })}
                  placeholder="Npr. Prodajni asistent"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Pozdravno sporočilo</Label>
                <Textarea
                  value={botConfig.greeting}
                  onChange={(e) => setBotConfig({ ...botConfig, greeting: e.target.value })}
                  placeholder="Sporočilo ob odprtju"
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Naslov na domači strani</Label>
                <Input
                  value={botConfig.homeTitle}
                  onChange={(e) => setBotConfig({ ...botConfig, homeTitle: e.target.value })}
                  placeholder="Pozdravljeni!"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Podnaslov na domači strani</Label>
                <Input
                  value={botConfig.homeSubtitle}
                  onChange={(e) => setBotConfig({ ...botConfig, homeSubtitle: e.target.value })}
                  placeholder="Kako vam lahko pomagam?"
                />
              </div>
            </div>

            {/* Barve in tema */}
            <div className="glass rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">
                Barve in tema
              </h3>
              <div className="space-y-1">
                <Label className="text-sm">Glavna barva</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={botConfig.primaryColor}
                    onChange={(e) => setBotConfig({ ...botConfig, primaryColor: e.target.value })}
                    className="h-9 w-12 rounded-lg cursor-pointer bg-transparent"
                  />
                  <Input
                    value={botConfig.primaryColor}
                    onChange={(e) => setBotConfig({ ...botConfig, primaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <Label className="text-sm">Temna tema</Label>
                <Switch
                  checked={botConfig.darkMode}
                  onCheckedChange={(checked) => setBotConfig({ ...botConfig, darkMode: checked })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Stil headerja</Label>
                <div className="flex gap-2">
                  <Button
                    variant={botConfig.headerStyle === 'gradient' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBotConfig({ ...botConfig, headerStyle: 'gradient' })}
                    className="flex-1 h-8"
                  >
                    Gradient
                  </Button>
                  <Button
                    variant={botConfig.headerStyle === 'solid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBotConfig({ ...botConfig, headerStyle: 'solid' })}
                    className="flex-1 h-8"
                  >
                    Solid
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Barva ozadja ikone</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={botConfig.botIconBackground}
                    onChange={(e) => setBotConfig({ ...botConfig, botIconBackground: e.target.value })}
                    className="h-9 w-12 rounded-lg cursor-pointer bg-transparent"
                  />
                  <Input
                    value={botConfig.botIconBackground}
                    onChange={(e) => setBotConfig({ ...botConfig, botIconBackground: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Barva ikone</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={botConfig.botIconColor}
                    onChange={(e) => setBotConfig({ ...botConfig, botIconColor: e.target.value })}
                    className="h-9 w-12 rounded-lg cursor-pointer bg-transparent"
                  />
                  <Input
                    value={botConfig.botIconColor}
                    onChange={(e) => setBotConfig({ ...botConfig, botIconColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Pozicija + Hitra vprašanja */}
          <div className="space-y-6">
            {/* Pozicija in gumb */}
            <div className="glass rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">
                Pozicija in gumb
              </h3>
              <div className="space-y-1">
                <Label className="text-sm">Pozicija</Label>
                <div className="flex gap-2">
                  <Button
                    variant={botConfig.position === 'left' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBotConfig({ ...botConfig, position: 'left' })}
                    className="flex-1 h-8"
                  >
                    Levo
                  </Button>
                  <Button
                    variant={botConfig.position === 'right' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBotConfig({ ...botConfig, position: 'right' })}
                    className="flex-1 h-8"
                  >
                    Desno
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Odmik od spodaj (px)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={botConfig.verticalOffset}
                  onChange={(e) => setBotConfig({ ...botConfig, verticalOffset: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Stil gumba</Label>
                <div className="flex gap-2">
                  <Button
                    variant={botConfig.triggerStyle === 'floating' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBotConfig({ ...botConfig, triggerStyle: 'floating' })}
                    className="flex-1 h-8"
                  >
                    Plavajoči
                  </Button>
                  <Button
                    variant={botConfig.triggerStyle === 'edge' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBotConfig({ ...botConfig, triggerStyle: 'edge' })}
                    className="flex-1 h-8"
                  >
                    Robni
                  </Button>
                </div>
              </div>
              {botConfig.triggerStyle === 'edge' && (
                <div className="space-y-1">
                  <Label className="text-sm">Tekst na gumbu</Label>
                  <Input
                    value={botConfig.edgeTriggerText}
                    onChange={(e) => setBotConfig({ ...botConfig, edgeTriggerText: e.target.value })}
                    placeholder="Klikni me"
                  />
                </div>
              )}
            </div>

            {/* Hitra vprašanja */}
            <div className="glass rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">
                Hitra vprašanja
              </h3>
              <div className="space-y-2">
                {botConfig.quickQuestions.map((q, i) => (
                  <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
                    <span className="flex-1 text-sm text-foreground truncate">{q}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
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
            </div>
          </div>

          {/* Column 3: Funkcije + Preview */}
          <div className="space-y-6">
            {/* Funkcije */}
            <div className="glass rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">
                Funkcije
              </h3>
              <div className="flex items-center justify-between py-1">
                <Label className="text-sm">Prikaži welcome bubble</Label>
                <Switch
                  checked={botConfig.showBubble}
                  onCheckedChange={(checked) => setBotConfig({ ...botConfig, showBubble: checked })}
                />
              </div>
              <div className="flex items-center justify-between py-1">
                <Label className="text-sm">Prikaži email polje</Label>
                <Switch
                  checked={botConfig.showEmailField}
                  onCheckedChange={(checked) => setBotConfig({ ...botConfig, showEmailField: checked })}
                />
              </div>
              <div className="flex items-center justify-between py-1">
                <Label className="text-sm">Omogoči kontakt obrazec</Label>
                <Switch
                  checked={botConfig.supportEnabled}
                  onCheckedChange={(checked) => setBotConfig({ ...botConfig, supportEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between py-1">
                <Label className="text-sm">Omogoči rezervacije</Label>
                <Switch
                  checked={botConfig.bookingEnabled}
                  onCheckedChange={(checked) => setBotConfig({ ...botConfig, bookingEnabled: checked })}
                />
              </div>
              {botConfig.bookingEnabled && (
                <div className="space-y-1">
                  <Label className="text-sm">URL za rezervacije</Label>
                  <Input
                    value={botConfig.bookingUrl}
                    onChange={(e) => setBotConfig({ ...botConfig, bookingUrl: e.target.value })}
                    placeholder="https://calendly.com/..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 pt-6 border-t border-border mt-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Nazaj
          </Button>
          <Button onClick={handleContinue} disabled={isSaving} className="flex-1 gap-2">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Shranjujem...
              </>
            ) : (
              <>
                Nadaljuj na plačilo
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right side - Preview */}
      <div className="w-[450px] bg-muted/30 flex items-center justify-center p-8">
        <div className="w-[380px] h-[600px] rounded-2xl overflow-hidden shadow-2xl">
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
