import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, Copy, Check, Lock, Home, MessagesSquare, MousePointer,
  Plus, X, RotateCcw, Sun, Moon, AlignLeft, AlignRight,
  MessageCircle, MessageSquare, Sparkles, Headphones, Zap, LucideIcon
} from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { useWizardConfig, TRIGGER_ICONS } from '@/hooks/useWizardConfig';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WidgetPreview, TriggerPreview } from '@/components/widget/WidgetPreview';
import { ImageUpload } from '@/components/ImageUpload';
import { EmojiPicker } from '@/components/EmojiPicker';
import { cn } from '@/lib/utils';

type PreviewType = 'home' | 'chat' | 'trigger';

const TriggerIconComponents: Record<string, LucideIcon> = {
  MessageCircle,
  MessageSquare,
  Bot,
  Sparkles,
  Headphones,
  Zap,
};

export default function DashboardSettings() {
  const { toast } = useToast();
  const { widget, loading } = useWidget();
  const { config, setConfig, defaultConfig } = useWizardConfig();
  const [copied, setCopied] = useState(false);
  const [activePreview, setActivePreview] = useState<PreviewType>('home');
  const [newQuestion, setNewQuestion] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

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

  // Quick questions handlers
  const addQuestion = () => {
    const trimmed = newQuestion.trim().slice(0, 35);
    if (trimmed && config.quickQuestions.length < 4) {
      setConfig({ quickQuestions: [...config.quickQuestions, trimmed] });
      setNewQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    if (config.quickQuestions.length > 1) {
      setConfig({ quickQuestions: config.quickQuestions.filter((_, i) => i !== index) });
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(config.quickQuestions[index]);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const updated = [...config.quickQuestions];
      updated[editingIndex] = editValue.trim().slice(0, 35);
      setConfig({ quickQuestions: updated });
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const resetColor = () => {
    setConfig({ primaryColor: defaultConfig.primaryColor });
  };

  const resetIconColors = () => {
    setConfig({ 
      iconBgColor: config.primaryColor, 
      iconColor: '#FFFFFF' 
    });
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
        {/* Left side - Settings */}
        <div className="space-y-6">
          {/* Bot Settings Tabs */}
          <div className="glass rounded-2xl p-6 animate-slide-up">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="izgled">Izgled</TabsTrigger>
                <TabsTrigger value="gumb">Gumb</TabsTrigger>
              </TabsList>

              {/* Tab 1: Chat nastavitve */}
              <TabsContent value="chat" className="space-y-6">
                {/* Home title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="home-title">Naslov na domači strani</Label>
                    <span className="text-xs text-muted-foreground">{config.homeTitle.length}/21</span>
                  </div>
                  <div className="flex gap-1">
                    <Input
                      id="home-title"
                      value={config.homeTitle}
                      onChange={(e) => setConfig({ homeTitle: e.target.value.slice(0, 21) })}
                      placeholder="Pozdravljeni!"
                      maxLength={21}
                      className="flex-1"
                    />
                    <EmojiPicker onEmojiSelect={(emoji) => setConfig({ homeTitle: (config.homeTitle + emoji).slice(0, 21) })} />
                  </div>
                </div>

                {/* Home subtitle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="home-subtitle">Podnaslov</Label>
                    <span className="text-xs text-muted-foreground">{config.homeSubtitle.length}/21</span>
                  </div>
                  <div className="flex gap-1">
                    <Input
                      id="home-subtitle"
                      value={config.homeSubtitle}
                      onChange={(e) => setConfig({ homeSubtitle: e.target.value.slice(0, 21) })}
                      placeholder="Kako vam lahko pomagam?"
                      maxLength={21}
                      className="flex-1"
                    />
                    <EmojiPicker onEmojiSelect={(emoji) => setConfig({ homeSubtitle: (config.homeSubtitle + emoji).slice(0, 21) })} />
                  </div>
                </div>

                {/* Primary color */}
                <div className="space-y-3">
                  <Label>Glavna barva</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => setConfig({ primaryColor: e.target.value })}
                        className="h-10 w-10 rounded-lg cursor-pointer border-0"
                      />
                    </div>
                    <Input
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ primaryColor: e.target.value })}
                      className="flex-1 font-mono text-sm"
                      placeholder="#3B82F6"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={resetColor}
                      title="Ponastavi barvo"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Header style */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Uporabi gradient za glavo</Label>
                    <p className="text-xs text-muted-foreground">Namesto enobarvne glave</p>
                  </div>
                  <Switch
                    checked={config.headerStyle === 'gradient'}
                    onCheckedChange={(checked) => setConfig({ headerStyle: checked ? 'gradient' : 'solid' })}
                  />
                </div>

                {/* Quick questions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Hitra vprašanja</Label>
                    <span className="text-xs text-muted-foreground">{config.quickQuestions.length}/4</span>
                  </div>
                  <div className="space-y-2">
                    {config.quickQuestions.map((q, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {editingIndex === index ? (
                          <div className="flex-1 relative">
                            <Input 
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value.slice(0, 35))}
                              onBlur={saveEdit}
                              onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                              autoFocus
                              maxLength={35}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              {editValue.length}/35
                            </span>
                          </div>
                        ) : (
                          <Input 
                            value={q} 
                            readOnly 
                            className="flex-1 bg-muted cursor-pointer hover:bg-muted/80 transition-colors" 
                            onClick={() => startEditing(index)}
                          />
                        )}
                        <EmojiPicker onEmojiSelect={(emoji) => {
                          if (editingIndex === index) {
                            setEditValue((editValue + emoji).slice(0, 35));
                          } else {
                            const updated = [...config.quickQuestions];
                            updated[index] = (updated[index] + emoji).slice(0, 35);
                            setConfig({ quickQuestions: updated });
                          }
                        }} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(index)}
                          disabled={config.quickQuestions.length <= 1}
                          className="text-destructive hover:text-destructive disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {config.quickQuestions.length < 4 && (
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value.slice(0, 35))}
                          placeholder="Novo vprašanje..."
                          maxLength={35}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {newQuestion.length}/35
                        </span>
                      </div>
                      <EmojiPicker onEmojiSelect={(emoji) => setNewQuestion((newQuestion + emoji).slice(0, 35))} />
                      <Button type="button" variant="outline" size="icon" onClick={addQuestion}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Show email field */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Prikaži email polje</Label>
                    <p className="text-xs text-muted-foreground">Zbirajte email naslove</p>
                  </div>
                  <Switch
                    checked={config.showEmailField}
                    onCheckedChange={(checked) => setConfig({ showEmailField: checked })}
                  />
                </div>
              </TabsContent>

              {/* Tab 2: Izgled */}
              <TabsContent value="izgled" className="space-y-6">
                {/* Agent name */}
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Ime agenta</Label>
                  <div className="flex gap-1">
                    <Input
                      id="agent-name"
                      value={config.name}
                      onChange={(e) => setConfig({ name: e.target.value })}
                      placeholder="Moj AI Asistent"
                      className="flex-1"
                    />
                    <EmojiPicker onEmojiSelect={(emoji) => setConfig({ name: config.name + emoji })} />
                  </div>
                </div>

                {/* Appearance - Light/Dark */}
                <div className="space-y-3">
                  <Label>Videz</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={!config.darkMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ darkMode: false })}
                      className="flex-1"
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Svetla
                    </Button>
                    <Button
                      type="button"
                      variant={config.darkMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ darkMode: true })}
                      className="flex-1"
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Temna
                    </Button>
                  </div>
                </div>

                {/* Profile picture */}
                <div className="space-y-2">
                  <Label>Profilna slika ali ikona</Label>
                  <ImageUpload
                    value={config.botAvatar}
                    onChange={(url) => setConfig({ botAvatar: url })}
                    placeholder="URL slike"
                    selectedIcon={config.botIcon}
                    onIconChange={(icon) => setConfig({ botIcon: icon })}
                    primaryColor={config.iconBgColor}
                    iconColor={config.iconColor}
                  />
                </div>

                {/* Icon colors - only show when no avatar uploaded */}
                {!config.botAvatar && (
                  <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <Label>Barve ikone</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={resetIconColors}
                        className="h-8 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Ponastavi
                      </Button>
                    </div>
                    
                    {/* Icon background color */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Ozadje ikone</Label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={config.iconBgColor}
                            onChange={(e) => setConfig({ iconBgColor: e.target.value })}
                            className="h-10 w-10 rounded-lg cursor-pointer border-0"
                          />
                        </div>
                        <Input
                          value={config.iconBgColor}
                          onChange={(e) => setConfig({ iconBgColor: e.target.value })}
                          className="flex-1 font-mono text-sm"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    {/* Icon color */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Barva ikone</Label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={config.iconColor}
                            onChange={(e) => setConfig({ iconColor: e.target.value })}
                            className="h-10 w-10 rounded-lg cursor-pointer border-0"
                          />
                        </div>
                        <Input
                          value={config.iconColor}
                          onChange={(e) => setConfig({ iconColor: e.target.value })}
                          className="flex-1 font-mono text-sm"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: Gumb */}
              <TabsContent value="gumb" className="space-y-6">
                {/* Show bubble */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Prikaži welcome bubble</Label>
                    <p className="text-xs text-muted-foreground">Pokaži mehurček z dobrodošlico</p>
                  </div>
                  <Switch
                    checked={config.showBubble}
                    onCheckedChange={(checked) => setConfig({ showBubble: checked })}
                  />
                </div>

                {/* Bubble text */}
                {config.showBubble && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="bubble-text">Besedilo mehurčka</Label>
                    <div className="flex gap-1">
                      <Input
                        id="bubble-text"
                        value={config.bubbleText}
                        onChange={(e) => setConfig({ bubbleText: e.target.value })}
                        placeholder="👋 Pozdravljeni!"
                        className="flex-1"
                      />
                      <EmojiPicker onEmojiSelect={(emoji) => setConfig({ bubbleText: config.bubbleText + emoji })} />
                    </div>
                  </div>
                )}

                {/* Position */}
                <div className="space-y-3">
                  <Label>Pozicija</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={config.position === 'left' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ position: 'left' })}
                      className="flex-1"
                    >
                      <AlignLeft className="h-4 w-4 mr-2" />
                      Levo
                    </Button>
                    <Button
                      type="button"
                      variant={config.position === 'right' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ position: 'right' })}
                      className="flex-1"
                    >
                      <AlignRight className="h-4 w-4 mr-2" />
                      Desno
                    </Button>
                  </div>
                </div>

                {/* Trigger style */}
                <div className="space-y-3">
                  <Label>Stil gumba</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={config.triggerStyle === 'floating' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ triggerStyle: 'floating' })}
                      className="flex-1"
                    >
                      Plavajoči
                    </Button>
                    <Button
                      type="button"
                      variant={config.triggerStyle === 'edge' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ triggerStyle: 'edge' })}
                      className="flex-1 whitespace-nowrap"
                    >
                      Robni
                    </Button>
                  </div>
                </div>

                {/* Trigger icon - only for floating style */}
                {config.triggerStyle === 'floating' && (
                  <div className="space-y-3 animate-fade-in">
                    <Label>Ikona gumba</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {TRIGGER_ICONS.map(({ name, label }) => {
                        const IconComp = TriggerIconComponents[name];
                        const isSelected = config.triggerIcon === name;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setConfig({ triggerIcon: name })}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all hover:scale-105",
                              isSelected 
                                ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-background" 
                                : "border-border hover:border-primary/50 hover:bg-muted"
                            )}
                          >
                            <IconComp className="w-6 h-6" style={{ color: isSelected ? config.primaryColor : 'hsl(var(--foreground))' }} />
                            <span className="text-xs text-muted-foreground">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Edge trigger text */}
                {config.triggerStyle === 'edge' && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="edge-text">Tekst na gumbu</Label>
                    <Input
                      id="edge-text"
                      value={config.edgeTriggerText}
                      onChange={(e) => setConfig({ edgeTriggerText: e.target.value })}
                      placeholder="Klikni me"
                    />
                  </div>
                )}

                {/* Vertical offset */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Odmik od spodaj</Label>
                      <p className="text-xs text-muted-foreground">Priporočeno 24px</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{config.verticalOffset}px</span>
                  </div>
                  <Slider
                    value={[config.verticalOffset]}
                    onValueChange={([value]) => setConfig({ verticalOffset: value })}
                    min={0}
                    max={100}
                    step={4}
                  />
                </div>
              </TabsContent>
            </Tabs>
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
