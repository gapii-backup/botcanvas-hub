import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import logoInline from '@/assets/logo-inline-light.png';

type WizardLayoutProps = {
  currentStep: number;
  totalSteps: number;
  children: ReactNode;
  preview: ReactNode;
  backPath?: string;
  nextPath?: string;
  nextLabel?: string;
  onNext?: () => void;
  nextDisabled?: boolean;
};

const steps = [
  { number: 1, label: 'Povezava' },
  { number: 2, label: 'Chat' },
  { number: 3, label: 'Izgled' },
  { number: 4, label: 'Bubble' },
];

export function WizardLayout({ 
  currentStep, 
  totalSteps, 
  children, 
  preview,
  backPath,
  nextPath,
  nextLabel = 'Naprej',
  onNext,
  nextDisabled = false,
}: WizardLayoutProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (nextPath) {
      navigate(nextPath);
    }
  };

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      {/* Header with logo and progress bar */}
      <div className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <a href="https://botmotion.ai/" className="block">
              <img 
                src={logoInline} 
                alt="BotMotion.AI" 
                className="h-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
              />
            </a>
          </div>
          
          {/* Steps - minimal */}
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full flex items-center justify-center transition-all duration-300',
                      currentStep > step.number
                        ? 'bg-primary text-primary-foreground'
                        : currentStep === step.number
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep > step.number ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <span className="text-xs font-medium">{step.number}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium hidden sm:block transition-colors duration-300',
                      currentStep >= step.number
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground/60'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-8 sm:w-12 h-px mx-2 transition-colors duration-500',
                      currentStep > step.number ? 'bg-primary/50' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-6 min-h-[calc(100vh-120px)] flex items-center lg:items-start pb-24">
        <div className="grid lg:grid-cols-2 gap-6 items-start w-full">
          {/* Settings panel with animation */}
          <div 
            className={cn(
              "bg-background rounded-xl border border-border shadow-sm p-4 md:p-6 transition-all duration-500 ease-out w-full max-w-sm mx-auto lg:max-w-md",
              isVisible 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-4"
            )}
          >
            {children}
          </div>

          {/* Preview panel with dotted pattern */}
          <div className="hidden lg:block lg:sticky lg:top-6">
            <div 
              className={cn(
                "rounded-xl border border-border overflow-hidden relative transition-all duration-500 ease-out delay-100",
                isVisible 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-4"
              )}
              style={{
                backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground) / 0.2) 1px, transparent 1px)`,
                backgroundSize: '12px 12px',
                backgroundColor: 'hsl(var(--muted) / 0.4)',
              }}
            >
              <div className="p-6 min-h-[450px] flex items-center justify-center">
                {preview}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer Navigation */}
      {(backPath || nextPath || onNext) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur-md border-t border-zinc-700/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              {/* Nazaj gumb - manjši na mobile, leva stran na desktop */}
              {backPath ? (
                <>
                  {/* Mobile: ghost, small */}
                  <Button 
                    variant="ghost" 
                    onClick={handleBack} 
                    size="sm"
                    className="order-2 sm:hidden text-muted-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Nazaj
                  </Button>
                  {/* Desktop: outline, large */}
                  <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    size="lg"
                    className="hidden sm:flex"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Nazaj
                  </Button>
                </>
              ) : (
                <div className="hidden sm:block" /> 
              )}
              
              {/* Naprej gumb - velik, full width na mobile */}
              {(nextPath || onNext) && (
                <Button 
                  onClick={handleNext} 
                  size="lg" 
                  disabled={nextDisabled}
                  className="order-1 sm:order-2 w-full sm:w-auto"
                >
                  {nextLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
