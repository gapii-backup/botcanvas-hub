import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowLeft, CreditCard, MessageCircle, Globe, Users, Headphones, Link2, Home, MessagesSquare, MousePointer } from 'lucide-react';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { useUserBot } from '@/hooks/useUserBot';
import { useToast } from '@/hooks/use-toast';
import { WidgetPreview, TriggerPreview } from '@/components/widget/WidgetPreview';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

// Define all add-ons with monthly prices in euros
const ALL_ADDONS = {
  capacity: {
    title: '📊 DODATNE KAPACITETE',
    icon: MessageCircle,
    items: [
      { id: 'capacity_1000', label: '+1.000 pogovorov', monthlyPrice: 12 },
      { id: 'capacity_2000', label: '+2.000 pogovorov', monthlyPrice: 22 },
      { id: 'capacity_5000', label: '+5.000 pogovorov', monthlyPrice: 52 },
      { id: 'capacity_10000', label: '+10.000 pogovorov', monthlyPrice: 99 },
    ],
  },
  languages: {
    title: '🌍 JEZIKI',
    icon: Globe,
    items: [
      { id: 'multilanguage', label: 'Multilanguage upgrade', monthlyPrice: 30 },
    ],
  },
  sales: {
    title: '💼 SALES & LEAD GENERATION',
    icon: Users,
    items: [
      { id: 'booking', label: 'Rezervacija sestankov', monthlyPrice: 35 },
      { id: 'contacts', label: 'Avtomatsko zbiranje kontaktov', monthlyPrice: 15 },
      { id: 'product_ai', label: 'Product recommendations (AI)', monthlyPrice: 50 },
    ],
  },
  support: {
    title: '🎧 SUPPORT & CUSTOMER SERVICE',
    icon: Headphones,
    items: [
      { id: 'tickets', label: 'Support ticket kreiranje', monthlyPrice: 35 },
    ],
  },
  integrations: {
    title: '🔗 CRM & INTEGRACIJE',
    icon: Link2,
    items: [
      { id: 'crm', label: 'CRM integracija', monthlyPrice: null }, // po dogovoru
      { id: 'history', label: 'Extended history (+90 dni)', monthlyPrice: 10 },
    ],
  },
};

// Calculate price based on billing period
function formatPrice(monthlyPrice: number | null, isYearly: boolean): string {
  if (monthlyPrice === null) return 'po dogovoru';
  
  if (isYearly) {
    // 20% discount for yearly, show yearly total price
    const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8);
    return `€${yearlyPrice}/leto`;
  }
  return `€${monthlyPrice}/mesec`;
}

// Get available add-ons based on plan
function getAvailableAddons(plan: string | null) {
  const excluded: Record<string, string[]> = {
    basic: [], // Show all add-ons for basic
    pro: ['multilanguage', 'contacts', 'tickets'], // Exclude for PRO
    enterprise: ['multilanguage', 'booking', 'contacts', 'product_ai', 'tickets'], // Exclude for ENTERPRISE
  };

  const planKey = (plan || 'basic').toLowerCase();
  const excludedIds = excluded[planKey] || [];

  const filtered: typeof ALL_ADDONS = {} as any;

  Object.entries(ALL_ADDONS).forEach(([key, category]) => {
    const filteredItems = category.items.filter(item => !excludedIds.includes(item.id));
    if (filteredItems.length > 0) {
      filtered[key as keyof typeof ALL_ADDONS] = {
        ...category,
        items: filteredItems,
      };
    }
  });

  return filtered;
}

type PreviewType = 'home' | 'chat' | 'trigger';

export default function Complete() {
  const navigate = useNavigate();
  const { config, resetConfig } = useWizardConfig();
  const { updateUserBot, userBot } = useUserBot();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [activePreview, setActivePreview] = useState<PreviewType>('home');

  const userPlan = userBot?.plan || 'basic';
  const isYearly = userBot?.billing_period === 'yearly';
  const availableAddons = getAvailableAddons(userPlan);
  const hasAddons = Object.keys(availableAddons).length > 0;

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

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

  const previewTabs = [
    { id: 'home' as const, label: 'Domača stran', icon: Home },
    { id: 'chat' as const, label: 'Pogovor', icon: MessagesSquare },
    { id: 'trigger' as const, label: 'Gumb', icon: MousePointer },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>
            <span className="font-medium text-foreground">Konfiguracija zaključena</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left side - Add-ons */}
          <div className="space-y-6">
            {hasAddons && (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Dodatne možnosti</h2>
                  <p className="text-muted-foreground">
                    Izboljšajte svojega AI asistenta z dodatnimi funkcijami.
                  </p>
                </div>

                {/* Billing info */}
                <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-foreground">
                    {isYearly ? 'Letna naročnina' : 'Mesečna naročnina'}
                  </span>
                  {isYearly && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                      -20% popust
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {Object.entries(availableAddons).map(([key, category]) => (
                    <Card key={key} className="border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          {category.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {category.items.map((item) => (
                          <div 
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => toggleAddon(item.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                checked={selectedAddons.includes(item.id)}
                                onCheckedChange={() => toggleAddon(item.id)}
                              />
                              <span className="text-sm">{item.label}</span>
                            </div>
                            <span className="text-sm font-medium text-primary">
                              {formatPrice(item.monthlyPrice, isYearly)}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedAddons.length > 0 && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-center">
                      <span className="font-medium">Izbrani dodatki:</span>{' '}
                      {selectedAddons.length} dodatkov bo dodanih vašemu paketu
                      {isYearly && ' (letna naročnina z 20% popustom)'}
                    </p>
                  </div>
                )}
              </>
            )}

            {!hasAddons && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-12">
                  <Check className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">Vse je pripravljeno!</h2>
                  <p className="text-muted-foreground">
                    Vaš paket že vključuje vse funkcije.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Preview */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Predogled vašega AI asistenta</h2>
              <p className="text-muted-foreground">Tako bo izgledal vaš chatbot na spletni strani.</p>
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

        {/* Navigation - Full width sticky bottom */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Button variant="outline" onClick={() => navigate('/customize/step-3')} size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Nazaj
            </Button>
            <Button 
              onClick={handleContinueToCheckout} 
              size="lg" 
              variant="glow" 
              disabled={isSaving}
              className="text-lg px-8 py-6 h-auto"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              {isSaving ? 'Shranjujem...' : 'Nadaljuj na plačilo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
