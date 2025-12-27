import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Bot, Sparkles, Building2, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserBot } from '@/hooks/useUserBot';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
      { text: '2.000 pogovorov/mesec', included: true },
      { text: '1 jezik (SLO ali HR ali SRB)', included: true },
      { text: 'RAG sistem - celotna spletna stran + PDF/Word dokumenti', included: true },
      { text: 'Widget za spletno stran', included: true },
      { text: 'Spletna stran kanal', included: true },
      { text: 'Osnovni analytics dashboard', included: true },
      { text: 'Conversation history (30 dni)', included: true },
      { text: 'Zbiranje leadov', included: false },
      { text: 'Support ticket kreiranje', included: false },
      { text: 'Meeting booking', included: false },
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
    features: [
      { text: '5.000 pogovorov/mesec', included: true },
      { text: 'Multilanguage (SLO + HR + SRB)', included: true },
      { text: 'RAG sistem - celotna spletna stran + PDF/Word dokumenti', included: true },
      { text: 'Widget za spletno stran', included: true },
      { text: 'Spletna stran kanal', included: true },
      { text: 'Zbiranje leadov', included: true },
      { text: 'Support ticket kreiranje', included: true },
      { text: 'Napredni analytics dashboard', included: true },
      { text: 'Conversation history (60 dni)', included: true },
      { text: 'Meeting booking', included: false },
      { text: 'Product recommendations (AI)', included: false },
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
    features: [
      { text: '10.000 pogovorov/mesec', included: true },
      { text: 'Multilanguage (SLO + HR + SRB)', included: true },
      { text: 'RAG sistem - celotna spletna stran + PDF/Word dokumenti', included: true },
      { text: 'Widget za spletno stran', included: true },
      { text: 'Spletna stran kanal', included: true },
      { text: 'Zbiranje leadov', included: true },
      { text: 'Napredni analytics dashboard', included: true },
      { text: 'Conversation history (180 dni)', included: true },
      { text: 'Meeting booking (Cal.com)', included: true },
      { text: 'Support ticket kreiranje', included: true },
      { text: 'Product recommendations (AI) (nad 50 produktov)', included: true },
    ],
    popular: false,
  },
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();
  const { updateUserBot } = useUserBot();
  const { toast } = useToast();

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      await updateUserBot({ plan: planId });
      navigate('/setup');
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
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
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
                  <span className="text-muted-foreground">{period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        feature.included ? "bg-primary/20" : "bg-muted"
                      )}>
                        {feature.included ? (
                          <Check className="h-3 w-3 text-primary" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm",
                        feature.included ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  <div className="text-center text-xs text-muted-foreground">
                    Setup fee: <span className="font-semibold text-foreground">€{plan.setupFee}</span>
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

        {/* Setup fee table */}
        <div className="mt-16 max-w-md mx-auto">
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              SETUP FEE
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-muted-foreground border-b border-border pb-2">
                <span>Paket</span>
                <span>Setup fee</span>
              </div>
              {plans.map((plan) => (
                <div key={plan.id} className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">{plan.name}</span>
                  <span className="text-foreground">€{plan.setupFee}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
