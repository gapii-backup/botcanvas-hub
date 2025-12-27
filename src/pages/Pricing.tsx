import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Bot, Sparkles, Building2, Loader2 } from 'lucide-react';
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
    description: 'Za manjša podjetja',
    icon: Bot,
    features: [
      'Do 2.000 pogovorov mesečno',
      '1 jezik',
      'Chatbot se nauči iz vaše celotne spletne strani + dokumentov (PDF, Word)',
      'Widget za vgradnjo na spletno stran',
      'Pregled statistike pogovorov',
      'Zgodovina pogovorov: 30 dni',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'PRO',
    monthlyPrice: 119.99,
    yearlyPrice: 1149.99,
    description: 'Za rastoča podjetja',
    icon: Sparkles,
    highlight: 'Vse iz Basic paketa, plus:',
    features: [
      'Do 5.000 pogovorov mesečno',
      'Podpora za več jezikov',
      'Avtomatsko zbiranje kontaktov (lead generation)',
      'Kreiranje support ticketov',
      'Napredna statistika in poročila',
      'Zgodovina pogovorov: 60 dni',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    monthlyPrice: 299.99,
    yearlyPrice: 2879.99,
    description: 'Za velika podjetja',
    icon: Building2,
    highlight: 'Vse iz Pro paketa, plus:',
    features: [
      'Do 10.000 pogovorov mesečno',
      'Rezervacija sestankov (meeting booking)',
      'AI priporočila izdelkov (za spletne trgovine z 50+ produkti)',
      'Zgodovina pogovorov: 180 dni',
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
      </div>
    </div>
  );
}
