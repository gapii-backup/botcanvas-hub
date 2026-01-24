import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { 
  Bot, Home, MessagesSquare, MousePointer,
  Plus, X, RotateCcw, Sun, Moon, AlignLeft, AlignRight,
  MessageCircle, MessageSquare, Sparkles, Headphones, Zap, LucideIcon, Save, Loader2, Undo2
} from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { useWizardConfig, TRIGGER_ICONS, BOT_ICONS, BotConfig } from '@/hooks/useWizardConfig';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardSidebar } from '@/components/DashboardSidebar';
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

// Helper function to get bot icon SVG paths from icon name
const getBotIconPaths = (iconName: string): string[] => {
  const icon = BOT_ICONS.find(i => i.name === iconName);
  return icon?.paths || ['M12 8V4H8', 'M4 8h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z', 'M9 16h0', 'M15 16h0'];
};

// Helper function to get trigger icon SVG path from icon name
const getTriggerIconPath = (iconName: string): string => {
  const paths: Record<string, string> = {
    'MessageCircle': 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z',
    'MessageSquare': 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    'Bot': 'M12 8V4H8',
    'Sparkles': 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
    'Headphones': 'M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3',
    'Zap': 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  };
  return paths[iconName] || paths['MessageCircle'];
};

export default function DashboardSettings() {
  const { toast } = useToast();
  const { widget, loading, upsertWidget } = useWidget();
  const hasContactsAddon = Array.isArray(widget?.addons) && widget.addons.includes('contacts');
  const hasTicketsAddon = Array.isArray(widget?.addons) && widget.addons.includes('tickets');
  const { config, setConfig, defaultConfig, resetConfig } = useWizardConfig();
  const { 
    setHasUnsavedChanges: setGlobalUnsavedChanges, 
    setOnSave, 
    setOnDiscard 
  } = useUnsavedChanges();
  
  const [activePreview, setActivePreview] = useState<PreviewType>('home');
  const [activeTab, setActiveTab] = useState('home');
  const [newQuestion, setNewQuestion] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Store initial config when component mounts
  const initialConfigRef = useRef<BotConfig | null>(null);
  const hasInitializedFromDb = useRef(false);
  
  // Load config from database when widget is loaded
  useEffect(() => {
    if (!loading && widget && !hasInitializedFromDb.current) {
      hasInitializedFromDb.current = true;
      
      // Map widget data to config
      const dbConfig: Partial<BotConfig> = {
        name: widget.bot_name || defaultConfig.name,
        welcomeMessage: widget.welcome_message || defaultConfig.welcomeMessage,
        homeTitle: widget.home_title || defaultConfig.homeTitle,
        homeSubtitle: widget.home_subtitle_line2 || defaultConfig.homeSubtitle,
        primaryColor: widget.primary_color || defaultConfig.primaryColor,
        darkMode: widget.mode === 'dark',
        headerStyle: (widget.header_style as 'gradient' | 'solid') || defaultConfig.headerStyle,
        iconBgColor: widget.bot_icon_background || defaultConfig.iconBgColor,
        iconColor: widget.bot_icon_color || defaultConfig.iconColor,
        botAvatar: widget.bot_avatar || defaultConfig.botAvatar,
        position: (widget.position as 'left' | 'right') || defaultConfig.position,
        verticalOffset: widget.vertical_offset || defaultConfig.verticalOffset,
        triggerStyle: (widget.trigger_style as 'floating' | 'edge') || defaultConfig.triggerStyle,
        edgeTriggerText: widget.edge_trigger_text || defaultConfig.edgeTriggerText,
        quickQuestions: (widget.quick_questions as string[]) || defaultConfig.quickQuestions,
        showEmailField: widget.show_email_field ?? defaultConfig.showEmailField,
        showBubble: widget.show_bubble ?? defaultConfig.showBubble,
        bubbleText: widget.bubble_text || defaultConfig.bubbleText,
        websiteUrl: widget.website_url || defaultConfig.websiteUrl,
      };
      
      setConfig(dbConfig);
      initialConfigRef.current = { ...config, ...dbConfig };
    }
  }, [loading, widget, setConfig, defaultConfig, config]);

  // Update initial config ref after first db load
  useEffect(() => {
    if (!loading && hasInitializedFromDb.current && initialConfigRef.current === null) {
      initialConfigRef.current = { ...config };
    }
  }, [loading, config]);

  // Sync local unsaved changes with global context
  useEffect(() => {
    setGlobalUnsavedChanges(hasUnsavedChanges);
  }, [hasUnsavedChanges, setGlobalUnsavedChanges]);

  // Save function for navigation (doesn't show toast - sidebar will navigate)
  const handleSaveForNavigation = useCallback(async () => {
    setIsSaving(true);
    try {
      await upsertWidget({
        bot_name: config.name || '',
        welcome_message: config.bubbleText || '',
        home_title: config.homeTitle || '',
        home_subtitle_line2: config.homeSubtitle || '',
        primary_color: config.primaryColor || '#6366f1',
        mode: config.darkMode ? 'dark' : 'light',
        header_style: config.headerStyle || 'solid',
        bot_icon_background: config.iconBgColor || '',
        bot_icon_color: config.iconColor || '',
        bot_avatar: config.botAvatar || '',
        bot_icon: getBotIconPaths(config.botIcon || 'Bot') as any,
        trigger_icon: getTriggerIconPath(config.triggerIcon || 'MessageCircle'),
        position: config.position || 'right',
        vertical_offset: config.verticalOffset || 20,
        trigger_style: config.triggerStyle || 'floating',
        edge_trigger_text: config.edgeTriggerText || '',
        quick_questions: config.quickQuestions || [],
        show_email_field: config.showEmailField ?? true,
        show_bubble: config.showBubble ?? true,
        bubble_text: config.bubbleText || '',
        website_url: config.websiteUrl || '',
      });
      initialConfigRef.current = { ...config };
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [config, upsertWidget]);

  // Cancel function for navigation
  const handleCancelForNavigation = useCallback(() => {
    if (initialConfigRef.current) {
      setConfig(initialConfigRef.current);
    }
    setHasUnsavedChanges(false);
  }, [setConfig]);

  // Register save and discard handlers for sidebar navigation
  useEffect(() => {
    setOnSave(handleSaveForNavigation);
    setOnDiscard(handleCancelForNavigation);
  }, [handleSaveForNavigation, handleCancelForNavigation, setOnSave, setOnDiscard]);

  // Cleanup handlers only on unmount
  useEffect(() => {
    return () => {
      setOnSave(null);
      setOnDiscard(null);
      setGlobalUnsavedChanges(false);
    };
  }, [setOnSave, setOnDiscard, setGlobalUnsavedChanges]);

  // Sync active tab with preview
  useEffect(() => {
    const tabToPreview: Record<string, PreviewType> = {
      'home': 'home',
      'chat': 'chat',
      'trigger': 'trigger'
    };
    setActivePreview(tabToPreview[activeTab] || 'home');
  }, [activeTab]);

  // Track changes
  const handleConfigChange = useCallback((updates: Parameters<typeof setConfig>[0]) => {
    setConfig(updates);
    setHasUnsavedChanges(true);
  }, [setConfig]);

  // Handle tab change - allow free switching between tabs
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  // Warn on page leave (browser close/refresh)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);


  // Save settings to database
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertWidget({
        bot_name: config.name || '',
        welcome_message: config.welcomeMessage || '',
        home_title: config.homeTitle || '',
        home_subtitle_line2: config.homeSubtitle || '',
        primary_color: config.primaryColor || '#6366f1',
        mode: config.darkMode ? 'dark' : 'light',
        header_style: config.headerStyle || 'solid',
        bot_icon_background: config.iconBgColor || '',
        bot_icon_color: config.iconColor || '',
        bot_avatar: config.botAvatar || '',
        bot_icon: getBotIconPaths(config.botIcon || 'Bot') as any,
        trigger_icon: getTriggerIconPath(config.triggerIcon || 'MessageCircle'),
        position: config.position || 'right',
        vertical_offset: config.verticalOffset || 20,
        trigger_style: config.triggerStyle || 'floating',
        edge_trigger_text: config.edgeTriggerText || '',
        quick_questions: config.quickQuestions || [],
        show_email_field: config.showEmailField ?? true,
        show_bubble: config.showBubble ?? true,
        bubble_text: config.bubbleText || '',
        website_url: config.websiteUrl || '',
      });

      // Update initial config reference after successful save
      initialConfigRef.current = { ...config };
      setHasUnsavedChanges(false);
      toast({
        title: 'Shranjeno!',
        description: 'Nastavitve so bile uspešno shranjene.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Napaka',
        description: 'Prišlo je do napake pri shranjevanju.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel/reset changes - restore to initial state
  const handleCancel = () => {
    if (initialConfigRef.current) {
      setConfig(initialConfigRef.current);
    }
    setHasUnsavedChanges(false);
    toast({
      title: 'Preklicano',
      description: 'Nastavitve so bile ponastavljene na začetno stanje.',
    });
  };

  // Quick questions handlers
  const addQuestion = () => {
    const trimmed = newQuestion.trim().slice(0, 35);
    if (trimmed && config.quickQuestions.length < 4) {
      handleConfigChange({ quickQuestions: [...config.quickQuestions, trimmed] });
      setNewQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    if (config.quickQuestions.length > 1) {
      handleConfigChange({ quickQuestions: config.quickQuestions.filter((_, i) => i !== index) });
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
      handleConfigChange({ quickQuestions: updated });
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const resetColor = () => {
    handleConfigChange({ primaryColor: defaultConfig.primaryColor });
  };

  const resetIconColors = () => {
    handleConfigChange({ 
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

  const SettingsPanel = (
    <div className="space-y-6">
      {/* Bot Settings Tabs */}
      <div className="glass rounded-2xl p-6 animate-slide-up">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Domača stran</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessagesSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Pogovor</span>
            </TabsTrigger>
            <TabsTrigger value="trigger" className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              <span className="hidden sm:inline">Gumb</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Domača stran */}
          <TabsContent value="home" className="space-y-6">
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
                  onChange={(e) => handleConfigChange({ homeTitle: e.target.value.slice(0, 21) })}
                  placeholder="Pozdravljeni!"
                  maxLength={21}
                  className="flex-1"
                />
                <EmojiPicker onEmojiSelect={(emoji) => handleConfigChange({ homeTitle: (config.homeTitle + emoji).slice(0, 21) })} />
              </div>
            </div>

            {/* Home subtitle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="home-subtitle">Podnaslov</Label>
                <span className="text-xs text-muted-foreground">{config.homeSubtitle.length}/23</span>
              </div>
              <div className="flex gap-1">
                <Input
                  id="home-subtitle"
                  value={config.homeSubtitle}
                  onChange={(e) => handleConfigChange({ homeSubtitle: e.target.value.slice(0, 23) })}
                  placeholder="Kako vam lahko pomagam?"
                  maxLength={23}
                  className="flex-1"
                />
                <EmojiPicker onEmojiSelect={(emoji) => handleConfigChange({ homeSubtitle: (config.homeSubtitle + emoji).slice(0, 23) })} />
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
                    onChange={(e) => handleConfigChange({ primaryColor: e.target.value })}
                    className="h-10 w-10 rounded-lg cursor-pointer border-0"
                  />
                </div>
                <Input
                  value={config.primaryColor}
                  onChange={(e) => handleConfigChange({ primaryColor: e.target.value })}
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
                onCheckedChange={(checked) => handleConfigChange({ headerStyle: checked ? 'gradient' : 'solid' })}
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
                        handleConfigChange({ quickQuestions: updated });
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
                onCheckedChange={(checked) => handleConfigChange({ showEmailField: checked })}
              />
            </div>
          </TabsContent>

          {/* Tab 2: Pogovor */}
          <TabsContent value="chat" className="space-y-6">
            {/* Agent name */}
            <div className="space-y-2">
              <Label htmlFor="agent-name">Ime agenta</Label>
              <div className="flex gap-1">
                <Input
                  id="agent-name"
                  value={config.name}
                  onChange={(e) => handleConfigChange({ name: e.target.value })}
                  placeholder="Moj AI Asistent"
                  className="flex-1"
                />
                <EmojiPicker onEmojiSelect={(emoji) => handleConfigChange({ name: config.name + emoji })} />
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
                  onClick={() => handleConfigChange({ darkMode: false })}
                  className="flex-1"
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Svetla
                </Button>
                <Button
                  type="button"
                  variant={config.darkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleConfigChange({ darkMode: true })}
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
                onChange={(url) => { handleConfigChange({ botAvatar: url }); }}
                placeholder="URL slike"
                selectedIcon={config.botIcon}
                onIconChange={(icon) => { handleConfigChange({ botIcon: icon }); }}
                primaryColor={config.iconBgColor}
                iconColor={config.iconColor}
              />
            </div>

            {/* Icon colors - always show, used for icon background even with avatar */}
            <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30 animate-fade-in">
              <div className="flex items-center justify-between">
                <Label>{config.botAvatar ? 'Barva ozadja slike' : 'Barve ikone'}</Label>
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
              
              {/* Icon background color - always visible */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {config.botAvatar ? 'Ozadje slike' : 'Ozadje ikone'}
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={config.iconBgColor}
                      onChange={(e) => handleConfigChange({ iconBgColor: e.target.value })}
                      className="h-10 w-10 rounded-lg cursor-pointer border-0"
                    />
                  </div>
                  <Input
                    value={config.iconBgColor}
                    onChange={(e) => handleConfigChange({ iconBgColor: e.target.value })}
                    className="flex-1 font-mono text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              {/* Icon color - only when no avatar */}
              {!config.botAvatar && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Barva ikone</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={config.iconColor}
                        onChange={(e) => handleConfigChange({ iconColor: e.target.value })}
                        className="h-10 w-10 rounded-lg cursor-pointer border-0"
                      />
                    </div>
                    <Input
                      value={config.iconColor}
                      onChange={(e) => handleConfigChange({ iconColor: e.target.value })}
                      className="flex-1 font-mono text-sm"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Gumb */}
          <TabsContent value="trigger" className="space-y-6">
            {/* Show bubble */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Prikaži mehurček</Label>
                <p className="text-xs text-muted-foreground">Pokaži mehurček z dobrodošlico</p>
              </div>
              <Switch
                checked={config.showBubble}
                onCheckedChange={(checked) => handleConfigChange({ showBubble: checked })}
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
                    onChange={(e) => handleConfigChange({ bubbleText: e.target.value })}
                    placeholder="👋 Pozdravljeni!"
                    className="flex-1"
                  />
                  <EmojiPicker onEmojiSelect={(emoji) => handleConfigChange({ bubbleText: config.bubbleText + emoji })} />
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
                  onClick={() => handleConfigChange({ position: 'left' })}
                  className="flex-1"
                >
                  <AlignLeft className="h-4 w-4 mr-2" />
                  Levo
                </Button>
                <Button
                  type="button"
                  variant={config.position === 'right' ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleConfigChange({ position: 'right' })}
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
                  onClick={() => handleConfigChange({ triggerStyle: 'floating' })}
                  className="flex-1"
                >
                  Plavajoči
                </Button>
                <Button
                  type="button"
                  variant={config.triggerStyle === 'edge' ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleConfigChange({ triggerStyle: 'edge' })}
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
                        onClick={() => handleConfigChange({ triggerIcon: name })}
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
                  onChange={(e) => handleConfigChange({ edgeTriggerText: e.target.value })}
                  placeholder="Klikni me"
                />
              </div>
            )}

          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-border space-y-3">
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={handleCancel}
              disabled={!hasUnsavedChanges}
              className="flex-1"
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Prekliči
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !hasUnsavedChanges}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Shranjujem...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Shrani
                </>
              )}
            </Button>
          </div>
          {hasUnsavedChanges && (
            <p className="text-xs text-center text-warning">
              Imate neshranjene spremembe
            </p>
          )}
        </div>
      </div>

    </div>
  );


  const PreviewPanel = (
    <div className="space-y-4">

      {/* Preview tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        {previewTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActivePreview(tab.id);
              setActiveTab(tab.id);
            }}
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
  );

  return (
    <DashboardSidebar>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Nastavitve</h1>
          <p className="text-muted-foreground mt-1">Upravljajte nastavitve vašega chatbota</p>
        </div>

        {/* Content row */}
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {SettingsPanel}
          {PreviewPanel}
        </div>
      </div>

    </DashboardSidebar>
  );
}
