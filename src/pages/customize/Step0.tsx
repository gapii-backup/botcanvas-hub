import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Sparkles, Palette, Link2, FileText, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserBot } from '@/hooks/useUserBot';
import { useToast } from '@/hooks/use-toast';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { WidgetPreview } from '@/components/widget/WidgetPreview';
import { useWizardConfig } from '@/hooks/useWizardConfig';

type FetchStep = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'loading' | 'done';
};

export default function Step0() {
  const [websiteUrl, setWebsiteUrl] = useState('');
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
  const { config } = useWizardConfig();

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
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600));
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
      
      // Navigate to next step
      setTimeout(() => navigate('/customize/step-2'), 500);
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

  const allStepsDone = fetchSteps.every(step => step.status === 'done');

  const content = (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Začnimo s povezavo
        </h2>
        <p className="text-muted-foreground">
          Delite povezavo do vaše spletne strani in samodejno bomo ustvarili AI agenta.
        </p>
      </div>

      <div className="space-y-4">
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

        {/* Progress indicator */}
        {(isFetching || allStepsDone) && (
          <div className="glass-strong rounded-xl p-4 border border-primary/30 animate-fade-in">
            <div className="space-y-3">
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
                    <Icon className="h-4 w-4 flex-shrink-0" />
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
            {allStepsDone && (
              <p className="text-green-500 font-medium text-sm mt-3 text-center">
                Priprava uspešna! Preusmerjam...
              </p>
            )}
          </div>
        )}

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
      </div>
    </div>
  );

  return (
    <WizardLayout
      currentStep={1}
      totalSteps={4}
      preview={<WidgetPreview config={config} />}
    >
      {content}
    </WizardLayout>
  );
}
