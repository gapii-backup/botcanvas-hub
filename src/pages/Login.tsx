import { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWidget } from '@/hooks/useWidget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bot, MessageSquare } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Neveljaven email naslov'),
  password: z.string().min(1, 'Geslo je obvezno'),
});

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const { widget, loading: widgetLoading } = useWidget();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect based on widget status when user is already logged in
  useEffect(() => {
    if (user && !widgetLoading) {
        if (!widget?.plan) {
          navigate('/pricing');
        } else if (widget.status === 'pending_payment') {
          navigate('/customize/complete');
        } else if (widget.status === 'active') {
          navigate('/dashboard');
        } else {
          // Plan is set but widget isn't fully activated/customization flow isn't finished yet
          navigate('/pricing');
        }
    }
  }, [user, widget, widgetLoading, navigate]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: 'Napaka pri validaciji',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Napaka pri prijavi',
        description: 'Napačen email ali geslo.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: 'Prijava uspešna!',
      description: 'Preusmerjanje...',
    });
    // Navigation will be handled by useEffect based on widget status
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float delay-300" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="h-24 w-24 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-8 animate-float glow-primary-lg">
            <MessageSquare className="h-12 w-12 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Vaš chatbot vas čaka
          </h2>
          <p className="text-muted-foreground">
            Prijavite se in upravljajte svoje AI asistente.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">BotMotion.ai</span>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Dobrodošli nazaj</h1>
            <p className="mt-2 text-muted-foreground">
              Prijavite se v svoj račun
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ime@podjetje.si"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Geslo</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              variant="glow"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Prijava'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Nimate računa?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Registrirajte se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
