import { useState, useMemo } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X } from 'lucide-react';
import { z } from 'zod';
import logo from '@/assets/logo.png';

const passwordRequirements = [
  { label: 'Vsaj 8 znakov', test: (pw: string) => pw.length >= 8 },
  { label: 'Vsaj 1 velika črka', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'Vsaj 1 številka', test: (pw: string) => /[0-9]/.test(pw) },
];

const registerSchema = z.object({
  name: z.string().min(2, 'Ime mora imeti vsaj 2 znaka'),
  email: z.string().email('Neveljaven email naslov'),
  phone: z.string().min(9, 'Telefonska številka mora imeti vsaj 9 znakov'),
  password: z.string()
    .min(8, 'Geslo mora imeti vsaj 8 znakov')
    .regex(/[A-Z]/, 'Geslo mora vsebovati vsaj 1 veliko črko')
    .regex(/[0-9]/, 'Geslo mora vsebovati vsaj 1 številko'),
  confirmPassword: z.string().min(8, 'Geslo mora imeti vsaj 8 znakov'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Gesli se ne ujemata',
  path: ['confirmPassword'],
});

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordStrength = useMemo(() => {
    const passed = passwordRequirements.filter(req => req.test(password)).length;
    return {
      passed,
      total: passwordRequirements.length,
      percentage: (passed / passwordRequirements.length) * 100,
      color: passed === 0 ? 'bg-muted' : passed === 1 ? 'bg-destructive' : passed === 2 ? 'bg-warning' : 'bg-success',
      label: passed === 0 ? '' : passed === 1 ? 'Šibko' : passed === 2 ? 'Srednje' : 'Močno',
    };
  }, [password]);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = registerSchema.safeParse({ name, email, phone, password, confirmPassword });
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
              <img 
                src={logo} 
                alt="BotMotion.ai" 
                className="h-12 w-12 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
              />
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
              <Label htmlFor="phone">Telefonska številka</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+386 40 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
              
              {/* Password strength indicator */}
              {password && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.percentage}%` }}
                      />
                    </div>
                    {passwordStrength.label && (
                      <span className={`text-xs font-medium ${
                        passwordStrength.passed === 1 ? 'text-destructive' : 
                        passwordStrength.passed === 2 ? 'text-warning' : 'text-success'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs">
                        {req.test(password) ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className={req.test(password) ? 'text-success' : 'text-muted-foreground'}>
                          {req.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
          <div className="h-24 w-24 rounded-2xl bg-card/50 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 animate-float glow-primary-lg p-2">
            <img 
              src={logo} 
              alt="BotMotion.ai" 
              className="h-full w-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" 
            />
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
