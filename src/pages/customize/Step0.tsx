import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Sparkles, ArrowRight } from 'lucide-react';
import { useUserBot } from '@/hooks/useUserBot';
import { useToast } from '@/hooks/use-toast';
import { WizardLayout } from '@/components/wizard/WizardLayout';

export default function Step0() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const navigate = useNavigate();
  const { updateUserBot } = useUserBot();
  const { toast } = useToast();

  const handleNext = async () => {
    if (websiteUrl.trim()) {
      try {
        const fullUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
        await updateUserBot({ 
          booking_url: fullUrl,
          bot_name: `Asistent za ${new URL(fullUrl).hostname}`,
        });
      } catch (error) {
        console.log('Could not save URL, continuing anyway');
      }
    }
    navigate('/customize/step-2');
  };

  const content = (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Začnimo s povezavo
        </h2>
        <p className="text-muted-foreground">
          Delite povezavo do vaše spletne strani (neobvezno).
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
            />
          </div>
        </div>

        <Button
          onClick={handleNext}
          className="w-full"
          size="lg"
          variant="glow"
        >
          Naprej
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const rightPanel = (
    <div className="text-center flex flex-col items-center justify-center h-full">
      <div className="h-24 w-24 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
        <Sparkles className="h-12 w-12 text-primary-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">
        Ustvarite AI asistenta
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
        V naslednjih korakih boste prilagodili izgled in nastavitve vašega chatbota.
      </p>
      <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground">
        <Globe className="h-4 w-4" />
        <span>Podpira vse spletne strani</span>
      </div>
    </div>
  );

  return (
    <WizardLayout
      currentStep={1}
      totalSteps={4}
      preview={rightPanel}
    >
      {content}
    </WizardLayout>
  );
}
