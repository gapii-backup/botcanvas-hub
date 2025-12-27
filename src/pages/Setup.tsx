import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Sparkles, Palette, Link2, FileText, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserBot } from '@/hooks/useUserBot';
import { useToast } from '@/hooks/use-toast';

const useCases = [
  { value: 'general', label: 'Splošni AI asistent' },
  { value: 'support', label: 'Podpora strankam' },
  { value: 'sales', label: 'Prodajni asistent' },
  { value: 'booking', label: 'Rezervacije in naročanje' },
  { value: 'faq', label: 'FAQ bot' },
];

type FetchStep = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'loading' | 'done';
};

export default function Setup() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [useCase, setUseCase] = useState('general');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchSteps, setFetchSteps] = useState<FetchStep[]>([
    { id: 'logo', label: 'Pridobivanje logotipa', icon: Globe, status: 'pending' },
    { id: 'colors', label: 'Pridobivanje barvne sheme', icon: Palette, status: 'pending' },
    { id: 'links', label: 'Pridobivanje povezav', icon: Link2, status: 'pending' },
    { id: 'prompt', label: 'Prilagajanje prompta', icon: FileText, status: 'pending' },
  ]);

  const navigate = useNavigate();
  const { updateUserBot } = useUserBot();
  const { toast } = useToast();

  const updateStepStatus = (stepId: string, status: 'pending' | 'loading' | 'done') => {
    setFetchSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const simulateFetching = async () => {
    if (!websiteUrl.trim()) {
      toast({
        title: 'Napaka',
        description: 'Prosim vnesite URL spletne strani.',
        variant: 'destructive',
      });
      return;
    }

    setIsFetching(true);

    // Simulate fetching steps
    const steps = ['logo', 'colors', 'links', 'prompt'];
    
    for (const stepId of steps) {
      updateStepStatus(stepId, 'loading');
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      updateStepStatus(stepId, 'done');
    }

    // Save to database
    try {
      const fullUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      await updateUserBot({ 
        booking_url: fullUrl,
        bot_name: `Asistent za ${new URL(fullUrl).hostname}`,
      });
      
      toast({
        title: 'Uspešno!',
        description: 'Osnovne nastavitve so bile pridobljene.',
      });
      
      // Navigate to customize page
      setTimeout(() => navigate('/customize'), 500);
    } catch (error) {
      toast({
        title: 'Napaka',
        description: 'Nekaj je šlo narobe. Poskusite znova.',
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleManualSetup = () => {
    navigate('/customize');
  };

  const allStepsDone = fetchSteps.every(step => step.status === 'done');
  const anyStepLoading = fetchSteps.some(step => step.status === 'loading');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left side - Form */}
          <div className="glass rounded-2xl p-8 md:p-12">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Začnimo s povezavo
              </h1>
              <p className="text-muted-foreground">
                Delite povezavo do vaše spletne strani in samodejno bomo ustvarili AI agenta, prilagojenega vaši vsebini.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="website-url">URL vaše spletne strani</Label>
                <div className="flex">
                  <div className="flex items-center px-4 bg-secondary rounded-l-lg border border-r-0 border-border">
                    <span className="text-muted-foreground text-sm">https://</span>
                  </div>
                  <Input
                    id="website-url"
                    placeholder="vasa-stran.si"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="rounded-l-none"
                    disabled={isFetching}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="use-case">Tip uporabe</Label>
                <Select value={useCase} onValueChange={setUseCase} disabled={isFetching}>
                  <SelectTrigger>
                    <SelectValue placeholder="Izberite tip uporabe" />
                  </SelectTrigger>
                  <SelectContent>
                    {useCases.map(uc => (
                      <SelectItem key={uc.value} value={uc.value}>
                        {uc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={simulateFetching}
                disabled={isFetching || !websiteUrl.trim()}
                className="w-full"
                size="lg"
                variant="glow"
              >
                {isFetching ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                    Pridobivam podatke...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Ustvari mojega AI asistenta
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ali</span>
                </div>
              </div>

              <Button
                onClick={handleManualSetup}
                variant="outline"
                className="w-full"
                size="lg"
                disabled={isFetching}
              >
                Nastavi ročno brez spletne strani
              </Button>
            </div>
          </div>

          {/* Right side - Progress indicator */}
          <div className="glass rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 pointer-events-none" />
            
            {!isFetching && !allStepsDone ? (
              <div className="text-center">
                <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-10 w-10 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Vnesi URL za začetek
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Samodejno bomo analizirali vašo spletno stran in ustvarili prilagojenega chatbota.
                </p>
              </div>
            ) : (
              <div className="w-full max-w-sm">
                <div className="glass-strong rounded-xl p-6 border border-primary/30">
                  <div className="space-y-4">
                    {fetchSteps.map((step) => {
                      const Icon = step.icon;
                      return (
                        <div 
                          key={step.id} 
                          className={cn(
                            "flex items-center gap-3 transition-all duration-300",
                            step.status === 'loading' && "text-primary",
                            step.status === 'done' && "text-foreground",
                            step.status === 'pending' && "text-muted-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className={cn(
                            "text-sm flex-1",
                            step.status === 'loading' && "font-medium"
                          )}>
                            {step.label}
                          </span>
                          <div className="flex-shrink-0">
                            {step.status === 'loading' && (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            )}
                            {step.status === 'done' && (
                              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {allStepsDone && (
                  <div className="text-center mt-6 animate-fade-in">
                    <p className="text-green-500 font-medium">
                      Priprava uspešna! Preusmerjam...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
