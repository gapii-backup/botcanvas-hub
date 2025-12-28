import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowLeft, CreditCard, MessageCircle, Globe, Users, Headphones, Link2, Home, MessagesSquare, MousePointer, AlertCircle } from 'lucide-react';
import { useWizardConfig, BOT_ICONS } from '@/hooks/useWizardConfig';
import { useUserBot } from '@/hooks/useUserBot';
import { useWidget } from '@/hooks/useWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WidgetPreview, TriggerPreview } from '@/components/widget/WidgetPreview';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51SjJ1X6cfwnnZsVXBsH4Hf42xuJwOkjnrtPzpuQtZbDVOP5zmIhmbCKZQTrxXnrfo0VkDAJHv8LTwWSoYqXOpq7V001LyWRo13');
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

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
  const { config } = useWizardConfig();
  const { userBot } = useUserBot();
  const { widget, upsertWidget } = useWidget();
  const { user } = useAuth();
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
    if (!user) {
      toast({
        title: 'Napaka',
        description: 'Morate biti prijavljeni.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Generate API key if not existing
      const existingApiKey = widget?.api_key;
      const apiKey = existingApiKey || `bm_live_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
      
      // Save all widget data to widgets table
      await upsertWidget({
        user_id: user.id,
        user_email: user.email || '',
        api_key: apiKey,
        plan: userPlan,
        billing_period: widget?.billing_period || 'monthly',
        status: 'pending_payment',
        is_active: false,
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
        booking_enabled: false,
        booking_url: '',
        support_enabled: false,
        website_url: config.websiteUrl || '',
        addons: selectedAddons,
      });

      // Setup fee price IDs
      const setupFeePrices: Record<string, string> = {
        basic: 'price_1SjJIs6cfwnnZsVXwrLbUCqf',
        pro: 'price_1SjJJO6cfwnnZsVX7FgojdDM',
        enterprise: 'price_1SjJJi6cfwnnZsVXld7HUqDF'
      };

      const priceId = setupFeePrices[userPlan] || setupFeePrices.basic;

      // Call n8n to create checkout session
      const response = await fetch('https://hub.botmotion.ai/webhook/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_id: priceId,
          api_key: apiKey,
          plan: userPlan,
          user_email: user.email,
          success_url: 'https://app.botmotion.ai/dashboard?payment=success',
          cancel_url: 'https://app.botmotion.ai/customize/complete?payment=cancelled'
        })
      });

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        window.location.href = `https://checkout.stripe.com/c/pay/${data.sessionId}`;
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Napaka',
        description: 'Prišlo je do napake.',
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
