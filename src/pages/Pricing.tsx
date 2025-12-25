import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Bot, Sparkles, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserBot } from '@/hooks/useUserBot';
import { useToast } from '@/hooks/use-toast';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '€49',
    period: '/mesec',
    description: 'Za manjša podjetja',
    icon: Bot,
    features: [
      '1 chatbot',
      '1.000 sporočil/mesec',
      'Email podpora',
      'Osnovna prilagoditev',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€119',
    period: '/mesec',
    description: 'Za rastoča podjetja',
    icon: Sparkles,
    features: [
      '3 chatboti',
      '10.000 sporočil/mesec',
      'Prioritetna podpora',
      'Napredna prilagoditev',
      'Analitika',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '€299',
    period: '/mesec',
    description: 'Za velika podjetja',
    icon: Building2,
    features: [
      'Neomejeni chatboti',
      'Neomejena sporočila',
      '24/7 podpora',
      'White-label opcija',
      'Dedicated account manager',
    ],
    popular: false,
  },
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { updateUserBot } = useUserBot();
  const { toast } = useToast();

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      await updateUserBot({ plan: planId });
      navigate('/customize');
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
            Izberite svoj paket
          </h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Transparentne cene brez skritih stroškov. Nadgradite kadarkoli.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl p-8 transition-all duration-300 animate-slide-up',
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
                  <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

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
            );
          })}
        </div>
      </div>
    </div>
  );
}
