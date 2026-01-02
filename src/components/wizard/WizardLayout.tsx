import { ReactNode, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoInline from '@/assets/logo-inline-light.png';

type WizardLayoutProps = {
  currentStep: number;
  totalSteps: number;
  children: ReactNode;
  preview: ReactNode;
};

const steps = [
  { number: 1, label: 'Povezava' },
  { number: 2, label: 'Chat' },
  { number: 3, label: 'Izgled' },
  { number: 4, label: 'Bubble' },
];

export function WizardLayout({ currentStep, totalSteps, children, preview }: WizardLayoutProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-muted/30">
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Settings panel with animation */}
          <div 
            className={cn(
              "bg-background rounded-2xl border border-border shadow-sm p-6 md:p-8 transition-all duration-500 ease-out",
              isVisible 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-4"
            )}
          >
            {children}
          </div>

          {/* Preview panel with dotted pattern */}
          <div className="lg:sticky lg:top-8">
            <div 
              className={cn(
                "rounded-2xl border border-border overflow-hidden relative transition-all duration-500 ease-out delay-100",
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
              <div className="p-8 min-h-[500px] flex items-center justify-center">
                {preview}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
