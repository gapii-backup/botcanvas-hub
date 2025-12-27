import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowLeft, CreditCard, Plus, MessageCircle, Globe, Calendar, Users, Bot, Headphones, Link2, History } from 'lucide-react';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { useUserBot } from '@/hooks/useUserBot';
import { useToast } from '@/hooks/use-toast';
import { WidgetPreview, TriggerPreview } from '@/components/widget/WidgetPreview';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

// Define all add-ons
const ALL_ADDONS = {
  capacity: {
    title: '📊 DODATNE KAPACITETE',
    icon: MessageCircle,
    items: [
      { id: 'capacity_1000', label: '+1.000 pogovorov', price: '€12/mesec' },
      { id: 'capacity_2000', label: '+2.000 pogovorov', price: '€22/mesec' },
      { id: 'capacity_5000', label: '+5.000 pogovorov', price: '€52/mesec' },
      { id: 'capacity_10000', label: '+10.000 pogovorov', price: '€99/mesec' },
    ],
  },
  languages: {
    title: '🌍 JEZIKI',
    icon: Globe,
    items: [
      { id: 'multilanguage', label: 'Multilanguage upgrade', price: '€30/mesec' },
    ],
  },
  sales: {
    title: '💼 SALES & LEAD GENERATION',
    icon: Users,
    items: [
      { id: 'booking', label: 'Rezervacija sestankov', price: '€35/mesec' },
      { id: 'contacts', label: 'Avtomatsko zbiranje kontaktov', price: '€15/mesec' },
      { id: 'product_ai', label: 'Product recommendations (AI)', price: '€50/mesec' },
    ],
  },
  support: {
    title: '🎧 SUPPORT & CUSTOMER SERVICE',
    icon: Headphones,
    items: [
      { id: 'tickets', label: 'Support ticket kreiranje', price: '€35/mesec' },
    ],
  },
  integrations: {
    title: '🔗 CRM & INTEGRACIJE',
    icon: Link2,
    items: [
      { id: 'crm', label: 'CRM integracija', price: 'po dogovoru' },
      { id: 'history', label: 'Extended history (+90 dni)', price: '€20/mesec' },
    ],
  },
};

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

export default function Complete() {
  const navigate = useNavigate();
  const { config, resetConfig } = useWizardConfig();
  const { updateUserBot, userBot } = useUserBot();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const userPlan = userBot?.plan || 'basic';
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Predogled vašega AI asistenta</h1>
          <p className="text-muted-foreground">Tako bo izgledal vaš chatbot na spletni strani.</p>
        </div>

        {/* Three previews */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Home screen preview */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-center text-muted-foreground">Domača stran</h3>
            <div 
              className="rounded-2xl border border-border overflow-hidden"
              style={{
                backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground) / 0.2) 1px, transparent 1px)`,
                backgroundSize: '12px 12px',
                backgroundColor: 'hsl(var(--muted) / 0.4)',
              }}
            >
              <div className="p-4 flex items-center justify-center min-h-[450px]">
                <WidgetPreview config={config} showChat={false} showHome={true} />
              </div>
            </div>
          </div>

          {/* Chat preview */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-center text-muted-foreground">Pogovor</h3>
            <div 
              className="rounded-2xl border border-border overflow-hidden"
              style={{
                backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground) / 0.2) 1px, transparent 1px)`,
                backgroundSize: '12px 12px',
                backgroundColor: 'hsl(var(--muted) / 0.4)',
              }}
            >
              <div className="p-4 flex items-center justify-center min-h-[450px]">
                <WidgetPreview config={config} showChat={true} showHome={false} />
              </div>
            </div>
          </div>

          {/* Trigger preview */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-center text-muted-foreground">Gumb za odprtje</h3>
            <div 
              className="rounded-2xl border border-border overflow-hidden"
              style={{
                backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground) / 0.2) 1px, transparent 1px)`,
                backgroundSize: '12px 12px',
                backgroundColor: 'hsl(var(--muted) / 0.4)',
              }}
            >
              <div className="p-4 flex items-center justify-center min-h-[450px]">
                <TriggerPreview config={config} />
              </div>
            </div>
          </div>
        </div>

        {/* Add-ons section - only show for Basic plan or if there are available addons */}
        {hasAddons && (
          <div className="mb-12">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Dodatne možnosti</h2>
              <p className="text-muted-foreground">
                Izboljšajte svojega AI asistenta z dodatnimi funkcijami.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(availableAddons).map(([key, category]) => (
                <Card key={key} className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
                        <span className="text-sm font-medium text-primary">{item.price}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedAddons.length > 0 && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-center">
                  <span className="font-medium">Izbrani dodatki:</span>{' '}
                  {selectedAddons.length} dodatkov bo dodanih vašemu paketu
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
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
