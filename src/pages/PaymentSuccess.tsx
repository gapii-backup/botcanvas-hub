import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Mail, CreditCard, Code } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();

  const steps = [
    { icon: Clock, label: 'Priprava chatbota', status: 'v teku' },
    { icon: Mail, label: 'E-poštno obvestilo ko je bot pripravljen', status: 'kmalu' },
    { icon: CreditCard, label: 'Izbira naročnine za aktivacijo', status: 'kmalu' },
    { icon: Code, label: 'Vgradnja na vašo spletno stran', status: 'kmalu' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-8 animate-fade-in">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-success/20 flex items-center justify-center animate-scale-in">
            <CheckCircle2 className="h-12 w-12 text-success" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Hvala za plačilo! 🎉
          </h1>
          <p className="text-xl text-muted-foreground">
            Vaš AI chatbot se pripravlja
          </p>
        </div>

        {/* Info Text */}
        <div className="glass rounded-2xl p-6 text-left space-y-4">
          <p className="text-foreground">
            Vaš chatbot bo pripravljen v roku <strong>24 ur</strong>. Ko bo aktiviran, boste prejeli obvestilo po e-pošti.
          </p>
          <p className="text-muted-foreground text-sm">
            Za dokončno aktivacijo boste morali izbrati mesečno ali letno naročnino za vaš paket.
          </p>
        </div>

        {/* Steps Info Box */}
        <div className="glass rounded-2xl p-6 text-left">
          <h3 className="font-semibold text-foreground mb-4">Naslednji koraki</h3>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === 0;
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                      {step.label}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isActive 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {step.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          size="lg" 
          className="w-full"
          onClick={() => navigate('/dashboard')}
        >
          Pojdi na nadzorno ploščo
        </Button>
      </div>
    </div>
  );
}
