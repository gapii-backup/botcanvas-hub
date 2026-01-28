import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowLeft, CreditCard, MessageCircle, Globe, Users, Headphones, Home, MessagesSquare, MousePointer, AlertCircle, Sparkles, Info, Zap, Plus, X } from 'lucide-react';
import { useWizardConfig, BOT_ICONS } from '@/hooks/useWizardConfig';
import { useUserBot } from '@/hooks/useUserBot';
import { useWidget } from '@/hooks/useWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WidgetPreview, TriggerPreview } from '@/components/widget/WidgetPreview';
import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { loadStripe } from '@stripe/stripe-js';
import logoInline from '@/assets/logo-inline-light.png';

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
  return icon?.paths || ['M12 8V4H8', 'M4 8h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z', 'M2 14h2m16 0h2m-7-1v2m-6-2v2'];
};

// Helper function to get trigger icon SVG path from icon name
const getTriggerIconPath = (iconName: string): string => {
  const paths: Record<string, string> = {
    'MessageCircle': 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z',
    'MessageSquare': 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    'Bot': 'M12 8V4H8 M4 8h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z M2 14h2m16 0h2m-7-1v2m-6-2v2',
    'Sparkles': 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
    'Headphones': 'M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3',
    'Zap': 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  };
  return paths[iconName] || paths['MessageCircle'];
};

// Addon item type with demo data
type AddonItem = {
  id: string;
  label: string;
  monthlyPrice: number | null;
  yearlyPrice?: number | null;
  proOnly?: boolean;
  // Demo popup fields
  badge?: string;
  videoUrl?: string | null;
  description: string;
  bullets: string[];
  stat: string;
};

type AddonCategory = {
  title: string;
  icon: any;
  items: AddonItem[];
};

// Define all add-ons with monthly prices in euros (removed CRM & INTEGRACIJE)
// Order: product_ai first (for Pro), then badges, then others
// product_ai has proOnly so Basic won't see it - gradient position is based on visible items
const ALL_ADDONS: Record<string, AddonCategory> = {
  features: {
    title: '✨ DODATNE FUNKCIJE',
    icon: Sparkles,
    items: [
      { 
        id: 'product_ai', 
        label: 'Product recommendations (AI)', 
        monthlyPrice: 80, 
        yearlyPrice: 768, 
        proOnly: true,
        badge: '💎 Največji ROI',
        videoUrl: '/videos/ai-products.mp4',
        description: 'AI priporoča izdelke glede na pogovor s stranko',
        bullets: [
          'AI predlaga relevantne izdelke glede na pogovor',
          'Prikazuje slike, cene in opise',
          'Direktna povezava do nakupa'
        ],
        stat: 'Povprečno +34% večja košarica'
      },
      { 
        id: 'tickets', 
        label: 'Support ticket kreiranje', 
        monthlyPrice: 35, 
        yearlyPrice: 336,
        badge: '🔥 Najbolj priljubljeno',
        videoUrl: '/videos/support-ticket.mp4',
        description: 'Stranke ustvarijo support ticket direktno v chatu',
        bullets: [
          'Stranke ustvarijo ticket direktno v chatu',
          'Vsi podatki shranjeni na enem mestu',
          'Obveščanje po emailu za vas in stranko'
        ],
        stat: '40% hitrejše reševanje zahtevkov'
      },
      { 
        id: 'contacts', 
        label: 'Avtomatsko zbiranje kontaktov', 
        monthlyPrice: 20, 
        yearlyPrice: 192,
        badge: '💰 Najboljša vrednost',
        videoUrl: '/videos/leadgeneration.mp4',
        description: 'Avtomatsko zbirajte kontakte potencialnih strank',
        bullets: [
          'Chatbot naravno vpraša za email',
          'Avtomatski export iz nadzorne plošče',
          'GDPR skladna soglasja'
        ],
        stat: 'Povprečno +45% več leadov'
      },
      { 
        id: 'multilanguage', 
        label: 'Multilanguage upgrade', 
        monthlyPrice: 30, 
        yearlyPrice: 288,
        badge: undefined,
        videoUrl: null,
        description: 'Vaš chatbot bo komuniciral v jeziku vaše stranke',
        bullets: [
          'Chatbot avtomatsko zazna jezik obiskovalca ob prvem sporočilu',
          'Podpira slovenščino in +50 drugih jezikov',
          'Naravni odgovori v jeziku stranke'
        ],
        stat: 'Dosežite 3x več strank v regiji'
      },
      { 
        id: 'booking', 
        label: 'Rezervacija sestankov', 
        monthlyPrice: 35, 
        yearlyPrice: 336,
        badge: undefined,
        videoUrl: '/videos/rezervacija-termina.mp4',
        description: 'Omogočite strankam rezervacijo terminov direktno v chatu',
        bullets: [
          'Stranke rezervirajo termin direktno v chatu',
          'Sinhronizacija z Google Calendar ali Outlook',
          'Avtomatski reminder pred sestankom'
        ],
        stat: 'Povprečno +60% več rezervacij'
      },
    ],
  },
  capacity: {
    title: '📊 DODATNE KAPACITETE',
    icon: MessageCircle,
    items: [
      { id: 'capacity_500', label: '+500 sporočil', monthlyPrice: 18, description: '', bullets: [], stat: '' },
      { id: 'capacity_1000', label: '+1.000 sporočil', monthlyPrice: 32, description: '', bullets: [], stat: '' },
      { id: 'capacity_2500', label: '+2.500 sporočil', monthlyPrice: 70, description: '', bullets: [], stat: '' },
      { id: 'capacity_5000', label: '+5.000 sporočil', monthlyPrice: 120, description: '', bullets: [], stat: '' },
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
  pro: { monthlyPrice: 129.99, yearlyPrice: 1249.99, setupFee: 140 },
  enterprise: { monthlyPrice: 299.99, yearlyPrice: 2879.99, setupFee: 320 },
};

// Calculate price based on billing period
// Capacity addons are ALWAYS monthly, regardless of billing period
function formatPrice(monthlyPrice: number | null, yearlyPrice: number | null, isYearly: boolean, isCapacityAddon: boolean = false): string {
  // Capacity addons are always monthly
  if (isCapacityAddon) {
    if (monthlyPrice === null) return 'po dogovoru';
    return `€${monthlyPrice} +DDV/mesec`;
  }
  if (isYearly) {
    if (yearlyPrice === null) return 'po dogovoru';
    return `€${yearlyPrice} +DDV/leto`;
  }
  if (monthlyPrice === null) return 'po dogovoru';
  return `€${monthlyPrice} +DDV/mesec`;
}

// Get available add-ons based on plan and billing period
// Capacity addons are always available regardless of billing period (they're always monthly)
function getAvailableAddons(plan: string | null, isYearly: boolean): Record<string, AddonCategory> {
  const excluded: Record<string, string[]> = {
    basic: [], // Show all add-ons for basic
    pro: ['multilanguage', 'contacts', 'tickets'], // Exclude for PRO
    enterprise: ['multilanguage', 'booking', 'contacts', 'product_ai', 'tickets'], // Exclude for ENTERPRISE
  };

  const planKey = (plan || 'basic').toLowerCase();
  const excludedIds = excluded[planKey] || [];

  const filtered: Record<string, AddonCategory> = {};

  Object.entries(ALL_ADDONS).forEach(([key, category]) => {
    let filteredItems = category.items.filter(item => {
      // Check excluded by plan
      if (excludedIds.includes(item.id)) return false;
      
      // For yearly billing, exclude ALL capacity items (they are added separately after checkout)
      if (isYearly && item.id.startsWith('capacity_')) return false;
      
      // proOnly addons are hidden for basic plan
      if (item.proOnly && planKey === 'basic') return false;
      
      return true;
    });
    
    if (filteredItems.length > 0) {
      filtered[key] = {
        ...category,
        items: filteredItems as AddonItem[],
      };
    }
  });

  return filtered;
}

// Local storage key for persisting addons
const ADDONS_STORAGE_KEY = 'botmotion_selected_addons';

type PreviewType = 'home' | 'chat' | 'trigger';

export default function Complete() {
  const navigate = useNavigate();
  const { config } = useWizardConfig();
  const { userBot } = useUserBot();
  const { widget, upsertWidget } = useWidget();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem(ADDONS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [activePreview, setActivePreview] = useState<PreviewType>('home');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [demoAddon, setDemoAddon] = useState<string | null>(null);

  const userPlan = userBot?.plan || 'basic';
  const isYearly = userBot?.billing_period === 'yearly';
  const availableAddons = getAvailableAddons(userPlan, isYearly);
  const hasAddons = Object.keys(availableAddons).length > 0;
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Persist selected addons to localStorage
  useEffect(() => {
    localStorage.setItem(ADDONS_STORAGE_KEY, JSON.stringify(selectedAddons));
  }, [selectedAddons]);
  
  // Clean up invalid addons when plan/billing changes
  useEffect(() => {
    const validAddonIds = Object.values(availableAddons).flatMap(cat => cat.items.map(item => item.id));
    const validSelected = selectedAddons.filter(id => validAddonIds.includes(id));
    if (validSelected.length !== selectedAddons.length) {
      setSelectedAddons(validSelected);
    }
  }, [availableAddons]);
  
  // Get pricing for current plan
  const planPricing = PLAN_PRICING[userPlan] || PLAN_PRICING.basic;
  const setupFee = planPricing.setupFee;
  const subscriptionPrice = isYearly ? planPricing.yearlyPrice : planPricing.monthlyPrice;
  
  // Calculate add-ons total
  // Capacity addons are ALWAYS monthly, other addons follow billing period
  const getAddonPrice = (addonId: string): number => {
    const isCapacityAddon = addonId.startsWith('capacity_');
    for (const category of Object.values(ALL_ADDONS)) {
      const addon = category.items.find(item => item.id === addonId);
      if (addon) {
        // Capacity addons are always monthly
        if (isCapacityAddon) {
          return addon.monthlyPrice || 0;
        }
        // Other addons follow billing period
        if (isYearly && addon.yearlyPrice) {
          return addon.yearlyPrice;
        }
        return addon.monthlyPrice || 0;
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
      const apiKey = existingApiKey || crypto.randomUUID().replace(/-/g, '').slice(0, 16).replace(/(.{4})/g, '$1-').slice(0, -1);
      
      // Save all widget data to widgets table (billing_period NOT saved - only sent to webhook)
      await upsertWidget({
        user_id: user.id,
        user_email: user.email || '',
        api_key: apiKey,
        plan: userPlan,
        // billing_period se NE shranjuje tukaj - shrani se šele po plačilu preko Stripe webhook
        status: 'pending_payment',
        is_active: false,
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

      // Call n8n to create checkout session - billing_period se pošlje samo v webhook
      const selectedBillingPeriod = userBot?.billing_period || 'monthly';
      const response = await fetch('https://hub.botmotion.ai/webhook/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_id: priceId,
          api_key: apiKey,
          plan: userPlan,
          billing_period: selectedBillingPeriod, // samo pošlje, ne shranjuje v DB
          user_email: user.email,
          addons: selectedAddons,
          success_url: 'https://app.botmotion.ai/payment-success',
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

  const steps = [
    { id: 1, label: 'Povezava', completed: true },
    { id: 2, label: 'Chat', completed: true },
    { id: 3, label: 'Izgled', completed: true },
    { id: 4, label: 'Bubble', completed: true },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header with logo and steps */}
      <div className="border-b border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <a href="https://botmotion.ai/" className="block">
              <img 
                src={logoInline} 
                alt="BotMotion.AI" 
                className="h-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
              />
            </a>
          </div>

          {/* Steps indicator - minimal */}
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground hidden sm:block">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 sm:w-12 h-px bg-primary/50 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left side - Add-ons */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Dodatne možnosti</h2>
              <p className="text-muted-foreground">
                Izboljšajte svojega AI asistenta z dodatnimi funkcijami.
              </p>
            </div>

            {/* Plan info - always visible */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-sm text-muted-foreground">Paket:</span>
                <span className="text-sm font-bold text-foreground">
                  {PLAN_NAMES[userPlan] || 'BASIC'}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({isYearly ? 'letno' : 'mesečno'})
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
                className="w-full sm:w-auto"
              >
                Zamenjaj paket
              </Button>
            </div>

            {hasAddons ? (
              <>
                <div className="space-y-4">
                  {Object.entries(availableAddons).map(([key, category]) => (
                    <Card key={key} className="border-border bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          {category.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        {category.items.map((item, index) => {
                          const isCapacityAddon = item.id.startsWith('capacity_');
                          const isSelected = selectedAddons.includes(item.id);
                          const hasDemo = !isCapacityAddon && item.description;
                          
                          // Gradient colors based on VISIBLE position (first = best)
                          // index here is already the visible item index since category.items is filtered
                          const rowGradients = [
                            'from-amber-500/10 to-amber-500/5',   // 1st - best (strongest)
                            'from-orange-500/8 to-orange-500/3',  // 2nd
                            'from-yellow-500/6 to-yellow-500/2',  // 3rd
                            'from-amber-500/5 to-transparent',    // 4th
                            'from-orange-500/4 to-transparent',   // 5th
                          ];
                          const gradientClass = isCapacityAddon ? '' : (rowGradients[index] || rowGradients[rowGradients.length - 1]);
                          
                          // Badge styling based on content
                          const getBadgeClass = (badge: string) => {
                            if (badge.includes('priljubljeno')) {
                              return 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/30';
                            } else if (badge.includes('vrednost')) {
                              return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30';
                            }
                            return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30';
                          };
                          
                          return (
                            <div 
                              key={item.id}
                              onClick={() => toggleAddon(item.id)}
                              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 group bg-gradient-to-r ${gradientClass} ${
                                isSelected 
                                  ? 'bg-amber-500/15 border-2 border-amber-500 shadow-sm' 
                                  : 'border-2 border-transparent hover:bg-muted/60 hover:border-muted-foreground/20'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                                  isSelected 
                                    ? 'bg-amber-500 text-white' 
                                    : 'bg-muted border border-border group-hover:border-muted-foreground/40'
                                }`}>
                                  {isSelected && <Check className="h-3.5 w-3.5" />}
                                </div>
                                <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${getBadgeClass(item.badge)}`}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center flex-shrink-0">
                                {isCapacityAddon ? (
                                  <span className={`text-sm font-semibold ${isSelected ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                    {formatPrice(item.monthlyPrice, item.yearlyPrice || null, isYearly, isCapacityAddon)}
                                  </span>
                                ) : hasDemo ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDemoAddon(item.id);
                                    }}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 transition-all shadow-sm"
                                  >
                                    Poglej več
                                  </button>
                                ) : (
                                  <span className={`text-sm font-semibold ${isSelected ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                    {formatPrice(item.monthlyPrice, item.yearlyPrice || null, isYearly, isCapacityAddon)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))}

                  {/* Info za yearly - capacity addoni */}
                  {isYearly && (
                    <div className="mt-4">
                      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground mb-1">Dodatna sporočila</p>
                          <p className="text-muted-foreground">
                            Pri letni naročnini lahko dodatna sporočila dodate <strong>po aktivaciji</strong> v sekciji 
                            <strong> Nadgradi </strong> v vašem dashboardu. Zaračunavajo se mesečno.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedAddons.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        {selectedAddons.length} {selectedAddons.length === 1 ? 'dodatek izbran' : 'dodatkov izbranih'}
                        {isYearly && <span className="text-primary ml-1">(20% popust)</span>}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">Vse je pripravljeno!</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Vaš paket že vključuje vse funkcije.
                    </p>
                  </div>
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
            <Button variant="outline" onClick={() => navigate('/customize/step-4')} size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Nazaj
            </Button>
            <button
              onClick={handleOpenPaymentDialog}
              disabled={isSaving}
              className="shiny-button text-lg px-8 py-4 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CreditCard className="h-5 w-5" />
              Nadaljuj na plačilo
            </button>
          </div>
        </div>
      </div>

      {/* Payment Summary Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="p-0 gap-0 w-screen h-screen max-w-none max-h-none sm:w-auto sm:h-auto sm:max-w-lg sm:max-h-[90vh] rounded-none sm:rounded-lg flex flex-col border-0 sm:border">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-xl">Potrditev nakupa</DialogTitle>
              <DialogDescription>
                Preglejte stroške pred nadaljevanjem na plačilo.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Info box */}
              <div className="flex gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <Zap className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
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
                  <span className="text-lg font-bold text-amber-500">€{setupFee} <span className="text-xs text-muted-foreground/70">+DDV</span></span>
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
                    <span className="font-semibold">€{subscriptionPrice.toFixed(2).replace('.', ',')} <span className="text-xs text-muted-foreground/70">+DDV</span></span>
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
                            <span className="text-sm font-medium">€{price} <span className="text-xs text-muted-foreground/70">+DDV</span></span>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Total subscription */}
                  <div className="flex justify-between items-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 mt-3">
                    <span className="font-semibold">Skupaj {isYearly ? 'letno' : 'mesečno'}</span>
                    <span className="text-lg font-bold text-amber-500">
                      €{totalSubscription.toFixed(2).replace('.', ',')}
                      <span className="text-xs text-muted-foreground/70 ml-1">+DDV</span>
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

              {/* Activation info */}
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <Zap className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-500">
                  Vaš AI asistent bo aktiviran v roku <strong>24 ur</strong>, po potrditvi nakupa.
                </p>
              </div>
            </div>

            {/* Gumbi na dnu vsebine */}
            <div className="border-t border-border pt-4 mt-4 pb-4 sm:pb-0 flex flex-col gap-2">
              <button
                onClick={handleContinueToCheckout}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 font-semibold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed sm:hover:from-amber-600 sm:hover:to-yellow-600 flex items-center justify-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {isSaving ? 'Shranjujem...' : `Plačaj setup fee (€${setupFee} +DDV)`}
              </button>
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)} 
                className="w-full"
              >
                Prekliči
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Demo Addon Dialog */}
      <Dialog open={!!demoAddon} onOpenChange={() => setDemoAddon(null)}>
        <DialogContent className="p-0 gap-0 w-screen h-screen max-w-none max-h-none sm:w-auto sm:h-auto sm:max-w-md sm:max-h-[90vh] rounded-none sm:rounded-2xl flex flex-col border-0 sm:border">
          {/* CELOTEN CONTENT SCROLA SKUPAJ */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {demoAddon && (() => {
              const addon = Object.values(ALL_ADDONS)
                .flatMap(cat => cat.items)
                .find(item => item.id === demoAddon);
              if (!addon || !addon.description) return null;
              
              const isCapacity = demoAddon.startsWith('capacity_');
              const price = formatPrice(addon.monthlyPrice, addon.yearlyPrice || null, isYearly, isCapacity);
              
              return (
                <>
                  {/* Video - ZNOTRAJ SCROLL CONTAINERJA */}
                  <div className="w-full max-w-[280px] mx-auto mb-6">
                    {addon.videoUrl ? (
                      <video
                        src={addon.videoUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full aspect-square rounded-xl object-cover"
                      />
                    ) : (
                      /* Multilanguage animacija */
                      <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center border border-amber-500/30">
                        <div className="text-center">
                          <div className="text-5xl mb-3">🌍</div>
                          <div className="flex justify-center gap-2 text-2xl">
                            <span>🇸🇮</span><span>🇬🇧</span><span>🇩🇪</span><span>🇫🇷</span><span>🇮🇹</span>
                          </div>
                          <p className="text-amber-500 mt-3 text-sm font-medium">+50 jezikov</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Title + Badge */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold">{addon.label}</h3>
                      {addon.badge && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/20 text-amber-500">
                          {addon.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1">{addon.description}</p>
                  </div>

                  {/* Bullets */}
                  <div className="space-y-2 mb-4">
                    {addon.bullets.map((bullet, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{bullet}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stat - AMBER STIL */}
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 mb-6">
                    <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-amber-500">{addon.stat}</span>
                  </div>

                  {/* CTA - AMBER GRADIENT */}
                  <div className="border-t border-border pt-4 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        toggleAddon(demoAddon);
                        setDemoAddon(null);
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all hover:from-amber-600 hover:to-yellow-600 flex items-center justify-center gap-2"
                    >
                      {selectedAddons.includes(demoAddon) ? (
                        <>
                          <X className="h-4 w-4" />
                          Odstrani iz paketa
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Dodaj za {price}
                        </>
                      )}
                    </button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setDemoAddon(null)} 
                      className="w-full"
                    >
                      Zapri
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
