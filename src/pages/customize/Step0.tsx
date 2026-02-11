import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, ArrowRight } from 'lucide-react';
import logo from '@/assets/logo.png';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Step0() {
  const { config, setConfig } = useWizardConfig();
  const [websiteUrl, setWebsiteUrl] = useState(config.websiteUrl || '');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setError('Prosim vnesite URL spletne strani.');
      return false;
    }
    
    // Simple domain validation
    const urlPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}(\/.*)?$/;
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    if (!urlPattern.test(cleanUrl)) {
      setError('Prosim vnesite veljaven URL (npr. vasa-stran.si).');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleNext = () => {
    if (!validateUrl(websiteUrl)) {
      return;
    }

    // Shrani SAMO v wizard config (localStorage)
    setConfig({ websiteUrl: websiteUrl });
    
    navigate('/customize/step-2');
  };

  const content = (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Začnimo s povezavo
        </h2>
        <p className="text-muted-foreground">
          Vnesite povezavo do vaše spletne strani.
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
              onChange={(e) => {
                setWebsiteUrl(e.target.value);
                if (error) setError('');
              }}
              className={`rounded-l-none ${error ? 'border-destructive' : ''}`}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive animate-fade-in">{error}</p>
          )}
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
      <div className="mb-6 animate-float">
        <img 
          src={logo} 
          alt="BotMotion.ai" 
          className="h-24 w-24 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]"
        />
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
      {...(!isMobile && {
        nextPath: "/customize/step-2",
        nextLabel: 'Naprej',
        onNext: handleNext,
      })}
    >
      {content}
    </WizardLayout>
  );
}
