import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Lock, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const planDetails: Record<string, { name: string; price: string }> = {
  basic: { name: 'Basic', price: '€49/mesec' },
  pro: { name: 'Pro', price: '€119/mesec' },
  enterprise: { name: 'Enterprise', price: '€299/mesec' },
};

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const plan = localStorage.getItem('selectedPlan');
    setSelectedPlan(plan);
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast({
      title: 'Plačilo uspešno!',
      description: 'Vaš chatbot je pripravljen za uporabo.',
    });
    
    navigate('/dashboard');
  };

  const plan = selectedPlan ? planDetails[selectedPlan] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Button variant="ghost" onClick={() => navigate('/customize')} className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Nazaj na prilagoditev
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order summary */}
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-foreground mb-6">Povzetek naročila</h2>
            <div className="glass rounded-2xl p-6 space-y-4">
              {plan ? (
                <>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground">{plan.name} paket</p>
                      <p className="text-sm text-muted-foreground">Mesečna naročnina</p>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{plan.price}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-foreground">Skupaj</p>
                    <p className="text-2xl font-bold text-primary">{plan.price}</p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Paket ni izbran</p>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">14-dnevna garancija vračila denarja</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">Odpoved kadarkoli</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4 text-success" />
                <span className="text-sm">Varno plačilo s Stripe</span>
              </div>
            </div>
          </div>

          {/* Payment form */}
          <div className="animate-fade-in delay-100">
            <h2 className="text-xl font-semibold text-foreground mb-6">Plačilni podatki</h2>
            <div className="glass rounded-2xl p-6 space-y-5">
              <div className="space-y-2">
                <Label>Številka kartice</Label>
                <div className="relative">
                  <Input placeholder="4242 4242 4242 4242" />
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Datum poteka</Label>
                  <Input placeholder="MM/LL" />
                </div>
                <div className="space-y-2">
                  <Label>CVC</Label>
                  <Input placeholder="123" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ime na kartici</Label>
                <Input placeholder="Janez Novak" />
              </div>

              <Button
                variant="glow"
                size="xl"
                className="w-full mt-4"
                onClick={handlePayment}
                disabled={isProcessing || !plan}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Obdelovanje...
                  </span>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Plačaj {plan?.price}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                S plačilom se strinjate s pogoji uporabe in politiko zasebnosti.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
