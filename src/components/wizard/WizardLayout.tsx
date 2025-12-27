import { ReactNode, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      {/* Progress bar */}
      <div className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                      currentStep > step.number
                        ? 'bg-primary text-primary-foreground'
                        : currentStep === step.number
                        ? 'bg-primary text-primary-foreground scale-110'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep > step.number ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium hidden sm:block transition-colors duration-300',
                      currentStep >= step.number
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-12 sm:w-24 h-0.5 mx-2 transition-colors duration-500',
                      currentStep > step.number ? 'bg-primary' : 'bg-muted'
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
