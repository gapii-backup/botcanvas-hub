import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bot, Sparkles } from 'lucide-react';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Ime mora imeti vsaj 2 znaka'),
  email: z.string().email('Neveljaven email naslov'),
  password: z.string().min(6, 'Geslo mora imeti vsaj 6 znakov'),
  confirmPassword: z.string().min(6, 'Geslo mora imeti vsaj 6 znakov'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Gesli se ne ujemata',
  path: ['confirmPassword'],
});

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = registerSchema.safeParse({ name, email, password, confirmPassword });
    if (!validation.success) {
      toast({
        title: 'Napaka pri validaciji',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, name);

    if (error) {
      let message = 'Prišlo je do napake pri registraciji.';
      if (error.message.includes('already registered')) {
        message = 'Ta email naslov je že registriran.';
      }
      toast({
        title: 'Napaka',
        description: message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: 'Uspešna registracija!',
      description: 'Dobrodošli v BotMotion.ai',
    });
    navigate('/pricing');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">BotMotion.ai</span>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Ustvarite račun</h1>
            <p className="mt-2 text-muted-foreground">
              Začnite graditi svoje AI chatbote
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Ime</Label>
              <Input
                id="name"
                type="text"
                placeholder="Janez Novak"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potrdi geslo</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                'Registriraj se'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Že imate račun?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Prijavite se
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float delay-500" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="h-24 w-24 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-8 animate-float glow-primary-lg">
            <Sparkles className="h-12 w-12 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Inteligentni chatboti za vaše podjetje
          </h2>
          <p className="text-muted-foreground">
            Ustvarite prilagojene AI chatbote v minutah. Brez programiranja.
          </p>
        </div>
      </div>
    </div>
  );
}
