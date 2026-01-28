import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Bot, Sparkles, Building2, Loader2, Minus, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWidget } from '@/hooks/useWidget';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import logoInline from '@/assets/logo-inline-light.png';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 49.99,
    yearlyPrice: 499.99,
    setupFee: 80,
    description: 'Za manjša podjetja',
    icon: Bot,
    features: [
      '1.000 sporočil na mesec',
      'Podpora za 1 jezik',
      'Dodajanje Q&A vprašanj',
      'Nalaganje PDF dokumentov',
      'Učenje iz vaše spletne strani',
      'Osnovni pregled statistike pogovorov',
      'Zgodovina pogovorov – 30 dni'
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 129.99,
    yearlyPrice: 1299.99,
    setupFee: 140,
    description: 'Za rastoča podjetja',
    icon: Sparkles,
    highlight: 'Vse iz BASIC paketa, plus:',
    features: [
      '3.000 sporočil na mesec',
      'Podpora za več jezikov',
      'Zbiranje kontaktov neposredno v pogovoru',
      'Kreiranje support ticketov preko chatbota',
      'Napredni pregled statistike in analitike',
      'Zgodovina pogovorov – 60 dni'
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 299.99,
    yearlyPrice: 2999.99,
    setupFee: 320,
    description: 'Za velika podjetja',
    icon: Building2,
    highlight: 'Vse iz PRO paketa, plus:',
    features: [
      '8.000 sporočil na mesec',
      'Rezervacija sestankov preko chatbota',
      'Pametna priporočila izdelkov (AI)',
      'Tedensko AI poročilo o uspešnosti',
      'Zgodovina pogovorov – 180 dni'
    ],
    popular: false,
  },
];

const comparisonFeatures = [
  { name: 'Sporočila na mesec', basic: '1.000', pro: '3.000', enterprise: '8.000' },
  { name: 'Podpora za jezike', basic: '1 jezik', pro: 'Več jezikov', enterprise: 'Več jezikov' },
  { name: 'Dodajanje Q&A vprašanj', basic: true, pro: true, enterprise: true },
  { name: 'Nalaganje PDF dokumentov', basic: true, pro: true, enterprise: true },
  { name: 'Učenje iz spletne strani', basic: true, pro: true, enterprise: true },
  { name: 'Pregled statistike pogovorov', basic: 'Osnovni', pro: 'Napredni', enterprise: 'Napredni' },
  { name: 'Zgodovina pogovorov', basic: '30 dni', pro: '60 dni', enterprise: '180 dni' },
  { name: 'Zbiranje kontaktov (leadov)', basic: false, pro: true, enterprise: true },
  { name: 'Kreiranje support ticketov', basic: false, pro: true, enterprise: true },
  { name: 'Rezervacija sestankov preko chatbota', basic: false, pro: false, enterprise: true },
  { name: 'Pametna priporočila izdelkov (AI)', basic: false, pro: false, enterprise: true },
  { name: 'Tedensko AI poročilo o uspešnosti', basic: false, pro: false, enterprise: true },
  { name: 'Setup fee (enkratno)', basic: '€80 +DDV', pro: '€140 +DDV', enterprise: '€320 +DDV' },
];

const faqItems = [
  {
    question: "Kaj je setup fee?",
    answer: "Setup fee je enkratno plačilo za vzpostavitev vašega AI chatbota. Vključuje konfiguracijo chatbota, učenje iz vaše spletne strani, nastavitev widgeta in testiranje. Setup je končan v 24 urah od naročila."
  },
  {
    question: "Ali lahko kadarkoli prekinem naročnino?",
    answer: "Da, brez dolgoročne vezave. Naročnino lahko prekličete kadarkoli, chatbot bo deloval do konca obračunskega obdobja."
  },
  {
    question: "Kaj se zgodi ko porabim vsa sporočila?",
    answer: "Ko dosežete mesečno omejitev sporočil, vas obvestimo. Če do konca obračunskega obdobja ne dokupite dodatnih sporočil, se chatbot začasno deaktivira. Ko se začne novo obdobje, se kvota ponastavi in chatbot se samodejno ponovno aktivira."
  },
  {
    question: "Ali lahko kasneje nadgradim paket?",
    answer: "Da, paket lahko kadarkoli nadgradite. Prav tako lahko dokupite posamezne funkcije iz višjih paketov brez menjave celotnega paketa."
  },
  {
    question: "Kaj pomeni \"učenje iz spletne strani\"?",
    answer: "AI chatbot prebere vsebino vaše spletne strani in se nauči o vaših izdelkih, storitvah in podjetju. Tako lahko odgovarja na vprašanja obiskovalcev brez ročnega vnašanja podatkov."
  },
  {
    question: "Ali cene vključujejo DDV?",
    answer: "Ne, vse cene so navedene brez DDV. DDV se obračuna po veljavni stopnji ob plačilu."
  }
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
          <p className="mt-4 text-2xl max-w-2xl mx-auto">
            <span className="text-foreground">Z letno naročnino prejmete </span>
            <span className="text-amber-400 font-semibold">2 meseca brezplačno!</span>
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
            <span className="text-sm font-semibold text-amber-400">-17%</span>
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
                  'relative p-8 transition-all duration-300 animate-slide-up flex flex-col',
                  plan.popular
                    ? 'pro-card-shiny scale-105 z-10'
                    : 'bg-[#0f0f0f] border border-white/10 rounded-[20px] md:hover:scale-[1.02]'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 border border-blue-400 text-white text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap">
                      ⭐ Najbolj priljubljen ⭐
                    </span>
                  </div>
                )}

                <div className="text-center mb-2">
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
                  <div className="h-5">
                    <span className={cn(
                      "text-sm line-through",
                      isYearly ? "text-muted-foreground" : "invisible"
                    )}>
                      €{formatPrice(plan.monthlyPrice * 12)}
                    </span>
                  </div>
                  <div>
                    <span className="text-4xl font-bold text-foreground">€{formatPrice(displayPrice)}</span>
                    <span className="text-xs text-muted-foreground/70 ml-1">+DDV</span>
                    <span className="text-muted-foreground">{period}</span>
                  </div>
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

        {/* Flexibility notice */}
        <div className="text-center mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl max-w-2xl mx-auto backdrop-blur-sm transition-all hover:border-white/20">
          <div className="flex items-center justify-center flex-col sm:flex-row gap-3">
            <Settings className="w-5 h-5 text-blue-400 shrink-0" />
            <p className="text-xs sm:text-sm text-slate-400">
              Fleksibilna nadgradnja: ob koncu naročila ali kadarkoli kasneje dodajte katerokoli funkcijo iz višjih paketov k vašemu paketu.
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="hidden lg:block mt-20 max-w-5xl mx-auto">
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
                    <th className="text-center p-4 text-sm font-semibold text-primary bg-blue-500/20 rounded-t-lg">PRO</th>
                    <th className="text-center p-4 text-sm font-semibold text-foreground">ENTERPRISE</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => {
                    const isLastRow = index === comparisonFeatures.length - 1;
                    return (
                      <tr key={index} className={cn("border-b border-border/50", index % 2 === 0 && "bg-secondary/20")}>
                        <td className="p-4 text-sm text-foreground">{feature.name}</td>
                        <td className="p-4 text-center">
                          {renderFeatureValue(feature.basic)}
                        </td>
                        <td className={cn(
                          "p-4 text-center bg-blue-500/10 border-x border-blue-500/20",
                          isLastRow && "rounded-b-lg"
                        )}>
                          {renderFeatureValue(feature.pro)}
                        </td>
                        <td className="p-4 text-center">
                          {renderFeatureValue(feature.enterprise)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Pogosta vprašanja
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors">
                  <span className="font-medium text-white pr-4">{item.question}</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <div className="px-6 pb-6 pt-0 text-slate-400 text-sm leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
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
