import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Bot, Sparkles, Building2, Loader2, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWidget } from '@/hooks/useWidget';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import logoInline from '@/assets/logo-inline-light.png';

const plans = [
  {
    id: 'basic',
    name: 'BASIC',
    monthlyPrice: 49.99,
    yearlyPrice: 479.99,
    setupFee: 80,
    description: 'Za manjša podjetja',
    icon: Bot,
    features: [
      '1.000 pogovorov na mesec',
      'Podpora za 1 jezik',
      'Dodajanje Q&A vprašanj',
      'Nalaganje PDF dokumentov',
      'Učenje iz vaše spletne strani',
      'Widget za vgradnjo na vašo spletno stran',
      'Osnovni pregled statistike pogovorov',
      'Zgodovina pogovorov – 30 dni',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'PRO',
    monthlyPrice: 119.99,
    yearlyPrice: 1149.99,
    setupFee: 140,
    description: 'Za rastoča podjetja',
    icon: Sparkles,
    highlight: 'Vse iz BASIC paketa, plus:',
    features: [
      '3.000 pogovorov na mesec',
      'Podpora za več jezikov',
      'Zbiranje kontaktov (leadov) neposredno v pogovoru',
      'Kreiranje support ticketov neposredno preko chatbota',
      'Napredni pregled statistike in analitike',
      'Zgodovina pogovorov – 60 dni',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    monthlyPrice: 299.99,
    yearlyPrice: 2879.99,
    setupFee: 320,
    description: 'Za velika podjetja',
    icon: Building2,
    highlight: 'Vse iz PRO paketa, plus:',
    features: [
      '8.000 pogovorov na mesec',
      'Rezervacija sestankov neposredno preko chatbota',
      'Pametna priporočila izdelkov (AI)',
      'Zgodovina pogovorov – 180 dni',
    ],
    popular: false,
  },
];

const comparisonFeatures = [
  { name: 'Pogovori na mesec', basic: '1.000', pro: '3.000', enterprise: '8.000' },
  { name: 'Podpora za jezike', basic: '1 jezik', pro: 'Več jezikov', enterprise: 'Več jezikov' },
  { name: 'Dodajanje Q&A vprašanj', basic: true, pro: true, enterprise: true },
  { name: 'Nalaganje PDF dokumentov', basic: true, pro: true, enterprise: true },
  { name: 'Učenje iz spletne strani', basic: true, pro: true, enterprise: true },
  { name: 'Widget za spletno stran', basic: true, pro: true, enterprise: true },
  { name: 'Pregled statistike pogovorov', basic: 'Osnovni', pro: 'Napredni', enterprise: 'Napredni' },
  { name: 'Zgodovina pogovorov', basic: '30 dni', pro: '60 dni', enterprise: '180 dni' },
  { name: 'Zbiranje kontaktov (leadov)', basic: false, pro: true, enterprise: true },
  { name: 'Kreiranje support ticketov', basic: false, pro: true, enterprise: true },
  { name: 'Rezervacija sestankov preko chatbota', basic: false, pro: false, enterprise: true },
  { name: 'Pametna priporočila izdelkov (AI)', basic: false, pro: false, enterprise: true },
  { name: 'Setup fee (enkratno)', basic: '€80 +DDV', pro: '€140 +DDV', enterprise: '€320 +DDV' },
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { upsertWidget, widget } = useWidget();
  const { toast } = useToast();
  
  const returnTo = searchParams.get('returnTo');

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      // Update widget with selected plan
      await upsertWidget({ 
        plan: planId,
        billing_period: isYearly ? 'yearly' : 'monthly',
        status: 'pending', // Set status to pending after plan selection
      });
      
      // If returning from Complete page, go back there
      if (returnTo === 'complete') {
        navigate('/customize/complete');
      } else {
        navigate('/customize/step-1');
      }
    } catch (error) {
      toast({
        title: 'Napaka',
        description: 'Ni bilo mogoče shraniti paketa. Poskusite znova.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <a href="https://botmotion.ai/" className="block">
            <img 
              src={logoInline} 
              alt="BotMotion.AI" 
              className="h-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
            />
          </a>
        </div>

        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
            Izberite svoj paket
          </h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Transparentne cene brez skritih stroškov. Nadgradite kadarkoli.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Label htmlFor="billing-toggle" className={cn("text-sm font-medium", !isYearly && "text-foreground")}>
            Mesečno
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="billing-toggle" className={cn("text-sm font-medium", isYearly && "text-foreground")}>
              Letno
            </Label>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
              -20%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const period = isYearly ? '/leto' : '/mesec';
            
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl p-8 transition-all duration-300 animate-slide-up flex flex-col',
                  plan.popular
                    ? 'glass-strong border-primary/50 scale-105 z-10 glow-primary'
                    : 'glass hover:border-primary/30'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="gradient-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                      Najpopularnejši
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div
                    className={cn(
                      'h-14 w-14 rounded-xl flex items-center justify-center mx-auto mb-4',
                      plan.popular ? 'gradient-primary' : 'bg-secondary'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-7 w-7',
                        plan.popular ? 'text-primary-foreground' : 'text-primary'
                      )}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-foreground">€{formatPrice(displayPrice)}</span>
                  <span className="text-xs text-muted-foreground/70 ml-1">+DDV</span>
                  <span className="text-muted-foreground">{period}</span>
                </div>

                {'highlight' in plan && plan.highlight && (
                  <p className="text-sm text-primary font-medium mb-3">{plan.highlight}</p>
                )}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-primary/20">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  <div className="text-center py-2 px-3 rounded-lg bg-secondary/50 border border-border">
                    <span className="text-xs text-muted-foreground">Setup fee (enkratno): </span>
                    <span className="text-sm font-semibold text-foreground">€{plan.setupFee}</span>
                    <span className="text-xs text-muted-foreground/70 ml-1">+DDV</span>
                  </div>
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    variant={plan.popular ? 'glow' : 'outline'}
                    className="w-full"
                    size="lg"
                    disabled={isLoading && selectedPlan === plan.id}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Izberi'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mt-20 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Primerjava paketov
          </h2>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Funkcija</th>
                    <th className="text-center p-4 text-sm font-semibold text-foreground">BASIC</th>
                    <th className="text-center p-4 text-sm font-semibold text-primary">PRO</th>
                    <th className="text-center p-4 text-sm font-semibold text-foreground">ENTERPRISE</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr key={index} className={cn("border-b border-border/50", index % 2 === 0 && "bg-secondary/20")}>
                      <td className="p-4 text-sm text-foreground">{feature.name}</td>
                      <td className="p-4 text-center">
                        {renderFeatureValue(feature.basic)}
                      </td>
                      <td className="p-4 text-center bg-primary/5">
                        {renderFeatureValue(feature.pro)}
                      </td>
                      <td className="p-4 text-center">
                        {renderFeatureValue(feature.enterprise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderFeatureValue(value: boolean | string) {
  if (value === true) {
    return (
      <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/20">
        <Check className="h-4 w-4 text-primary" />
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted">
        <Minus className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }
  return <span className="text-sm text-foreground">{value}</span>;
}
