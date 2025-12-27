import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowLeft, CreditCard, MessageCircle, Globe, Users, Headphones, Link2, Home, MessagesSquare, MousePointer, AlertCircle } from 'lucide-react';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { useUserBot } from '@/hooks/useUserBot';
import { useToast } from '@/hooks/use-toast';
import { WidgetPreview, TriggerPreview } from '@/components/widget/WidgetPreview';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

// Define all add-ons with monthly prices in euros
const ALL_ADDONS = {
  capacity: {
    title: '📊 DODATNE KAPACITETE',
    icon: MessageCircle,
    items: [
      { id: 'capacity_1000', label: '+1.000 pogovorov', yearlyLabel: '+12.000 pogovorov', monthlyPrice: 12 },
      { id: 'capacity_2000', label: '+2.000 pogovorov', yearlyLabel: '+24.000 pogovorov', monthlyPrice: 22 },
      { id: 'capacity_5000', label: '+5.000 pogovorov', yearlyLabel: '+60.000 pogovorov', monthlyPrice: 52 },
      { id: 'capacity_10000', label: '+10.000 pogovorov', yearlyLabel: '+120.000 pogovorov', monthlyPrice: 99 },
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

const PLAN_NAMES: Record<string, string> = {
  basic: 'BASIC',
  pro: 'PRO',
  enterprise: 'ENTERPRISE',
};

// Plan pricing data
const PLAN_PRICING: Record<string, { monthlyPrice: number; yearlyPrice: number; setupFee: number }> = {
  basic: { monthlyPrice: 49.99, yearlyPrice: 479.99, setupFee: 80 },
  pro: { monthlyPrice: 119.99, yearlyPrice: 1149.99, setupFee: 140 },
  enterprise: { monthlyPrice: 299.99, yearlyPrice: 2879.99, setupFee: 320 },
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

// Addon item type
type AddonItem = {
  id: string;
  label: string;
  yearlyLabel?: string;
  monthlyPrice: number | null;
};

type AddonCategory = {
  title: string;
  icon: any;
  items: AddonItem[];
};

// Get available add-ons based on plan
function getAvailableAddons(plan: string | null): Record<string, AddonCategory> {
  const excluded: Record<string, string[]> = {
    basic: [], // Show all add-ons for basic
    pro: ['multilanguage', 'contacts', 'tickets'], // Exclude for PRO
    enterprise: ['multilanguage', 'booking', 'contacts', 'product_ai', 'tickets'], // Exclude for ENTERPRISE
  };

  const planKey = (plan || 'basic').toLowerCase();
  const excludedIds = excluded[planKey] || [];

  const filtered: Record<string, AddonCategory> = {};

  Object.entries(ALL_ADDONS).forEach(([key, category]) => {
    const filteredItems = category.items.filter(item => !excludedIds.includes(item.id));
    if (filteredItems.length > 0) {
      filtered[key] = {
        ...category,
        items: filteredItems as AddonItem[],
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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const userPlan = userBot?.plan || 'basic';
  const isYearly = userBot?.billing_period === 'yearly';
  const availableAddons = getAvailableAddons(userPlan);
  const hasAddons = Object.keys(availableAddons).length > 0;
  
  // Get pricing for current plan
  const planPricing = PLAN_PRICING[userPlan] || PLAN_PRICING.basic;
  const setupFee = planPricing.setupFee;
  const subscriptionPrice = isYearly ? planPricing.yearlyPrice : planPricing.monthlyPrice;
  
  // Calculate add-ons total
  const getAddonPrice = (addonId: string): number => {
    for (const category of Object.values(ALL_ADDONS)) {
      const addon = category.items.find(item => item.id === addonId);
      if (addon && addon.monthlyPrice) {
        if (isYearly) {
          return Math.round(addon.monthlyPrice * 12 * 0.8);
        }
        return addon.monthlyPrice;
      }
    }
    return 0;
  };
  
  const addonsTotal = selectedAddons.reduce((sum, addonId) => sum + getAddonPrice(addonId), 0);
  const totalSubscription = subscriptionPrice + addonsTotal;

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleOpenPaymentDialog = () => {
    setShowPaymentDialog(true);
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
      setShowPaymentDialog(false);
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

                {/* Plan info */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Paket:</span>
                    <span className="text-sm font-bold text-foreground">
                      {PLAN_NAMES[userPlan] || 'BASIC'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({isYearly ? 'letna naročnina' : 'mesečna naročnina'})
                    </span>
                    {isYearly && (
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                        -20%
                      </span>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/pricing?returnTo=complete')}
                  >
                    Zamenjaj paket
                  </Button>
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
                        {category.items.map((item) => {
                          const displayLabel = isYearly && 'yearlyLabel' in item && item.yearlyLabel 
                            ? item.yearlyLabel 
                            : item.label;
                          return (
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
                                <span className="text-sm">{displayLabel}</span>
                              </div>
                              <span className="text-sm font-medium text-primary">
                                {formatPrice(item.monthlyPrice, isYearly)}
                              </span>
                            </div>
                          );
                        })}
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
              onClick={handleOpenPaymentDialog} 
              size="lg" 
              variant="glow" 
              className="text-lg px-8 py-6 h-auto"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Nadaljuj na plačilo
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Summary Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Povzetek plačila</DialogTitle>
            <DialogDescription>
              Preglejte stroške pred nadaljevanjem na plačilo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Info box */}
            <div className="flex gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Kako poteka plačilo?</p>
                <p className="text-muted-foreground">
                  Najprej boste plačali enkratni <strong>setup fee</strong> za pripravo vašega AI asistenta. 
                  Ko bo bot pripravljen, se bo za aktivacijo potrebna še {isYearly ? 'letna' : 'mesečna'} naročnina.
                </p>
              </div>
            </div>

            {/* Step 1: Setup Fee */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">1. ENKRATNO PLAČILO (ZDAJ)</h4>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <span className="font-medium">Setup fee</span>
                  <span className="text-sm text-muted-foreground ml-2">({PLAN_NAMES[userPlan]})</span>
                </div>
                <span className="text-lg font-bold text-primary">€{setupFee}</span>
              </div>
            </div>

            <Separator />

            {/* Step 2: Subscription */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                2. {isYearly ? 'LETNA' : 'MESEČNA'} NAROČNINA (PO AKTIVACIJI)
              </h4>
              <div className="space-y-2">
                {/* Plan price */}
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <span className="font-medium">Paket {PLAN_NAMES[userPlan]}</span>
                  </div>
                  <span className="font-semibold">€{subscriptionPrice.toFixed(2).replace('.', ',')}</span>
                </div>

                {/* Selected add-ons */}
                {selectedAddons.length > 0 && (
                  <>
                    {selectedAddons.map(addonId => {
                      const price = getAddonPrice(addonId);
                      let addonLabel = '';
                      for (const category of Object.values(ALL_ADDONS)) {
                        const addon = category.items.find(item => item.id === addonId);
                        if (addon) {
                          addonLabel = addon.label;
                          break;
                        }
                      }
                      if (price === 0) return null;
                      return (
                        <div key={addonId} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm">{addonLabel}</span>
                          <span className="text-sm font-medium">€{price}</span>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Total subscription */}
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20 mt-3">
                  <span className="font-semibold">Skupaj {isYearly ? 'letno' : 'mesečno'}</span>
                  <span className="text-lg font-bold text-primary">
                    €{totalSubscription.toFixed(2).replace('.', ',')}
                    <span className="text-sm font-normal text-muted-foreground">/{isYearly ? 'leto' : 'mesec'}</span>
                  </span>
                </div>

                {isYearly && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Prihranite 20% z letno naročnino!
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="w-full sm:w-auto">
              Prekliči
            </Button>
            <Button 
              onClick={handleContinueToCheckout} 
              variant="glow" 
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isSaving ? 'Shranjujem...' : `Plačaj setup fee (€${setupFee})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
