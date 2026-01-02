import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWidget } from '@/hooks/useWidget';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import logo from '@/assets/logo.png';
import logoInline from '@/assets/logo-inline-dark.png';

const passwordRequirements = [
  { label: 'Vsaj 8 znakov', test: (pw: string) => pw.length >= 8 },
  { label: 'Vsaj 1 velika črka', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'Vsaj 1 številka', test: (pw: string) => /[0-9]/.test(pw) },
];

const loginSchema = z.object({
  email: z.string().email('Neveljaven email naslov'),
  password: z.string().min(1, 'Geslo je obvezno'),
});

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

type FieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 mt-1.5">
    <AlertCircle className="h-4 w-4 text-warning shrink-0" />
    <span className="text-xs text-warning">{message}</span>
  </div>
);

export default function Login() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [shake, setShake] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { widget, loading: widgetLoading } = useWidget();
  const navigate = useNavigate();

  const passwordStrength = (() => {
    const passed = passwordRequirements.filter(req => req.test(password)).length;
    return {
      passed,
      total: passwordRequirements.length,
      percentage: (passed / passwordRequirements.length) * 100,
      color: passed === 0 ? 'bg-muted' : passed === 1 ? 'bg-destructive' : passed === 2 ? 'bg-warning' : 'bg-success',
      label: passed === 0 ? '' : passed === 1 ? 'Šibko' : passed === 2 ? 'Srednje' : 'Močno',
    };
  })();

  const unfulfilledRequirements = passwordRequirements.filter(req => !req.test(password));

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      return;
    }

    setIsResetting(true);
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: 'https://app.botmotion.ai/reset-password',
    });
    setIsResetting(false);
    setResetSent(true);
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetSent(false);
  };

  // Redirect based on widget status when user is already logged in
  useEffect(() => {
    if (user && !widgetLoading) {
      if (widget?.is_partner === true) {
        navigate('/dashboard');
        return;
      }
      
      if (widget?.subscription_status === 'active') {
        navigate('/dashboard');
        return;
      }
      
      if (!widget?.plan) {
        navigate('/pricing');
      } else if (widget.status === 'pending_payment') {
        navigate('/customize/complete');
      } else if (['active', 'setup_paid', 'sub_paid', 'cancelling'].includes(widget.status)) {
        navigate('/dashboard');
      } else {
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

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const clearForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const switchMode = (toRegister: boolean) => {
    setIsRegisterMode(toRegister);
    clearForm();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const newErrors: FieldErrors = {};
      validation.error.errors.forEach(err => {
        const field = err.path[0] as keyof FieldErrors;
        if (field) {
          newErrors[field] = err.message;
        }
      });
      setErrors(newErrors);
      triggerShake();
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setErrors({ general: 'Napačen email ali geslo.' });
      triggerShake();
      setIsLoading(false);
      return;
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validation = registerSchema.safeParse({ name, email, phone, password, confirmPassword });
    if (!validation.success) {
      const newErrors: FieldErrors = {};
      validation.error.errors.forEach(err => {
        const field = err.path[0] as keyof FieldErrors;
        if (field) {
          newErrors[field] = err.message;
        }
      });
      setErrors(newErrors);
      triggerShake();
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, name);

    if (error) {
      let message = 'Prišlo je do napake pri registraciji.';
      if (error.message.includes('already registered')) {
        message = 'Ta email naslov je že registriran.';
      }
      setErrors({ general: message });
      triggerShake();
      setIsLoading(false);
      return;
    }

    navigate('/pricing');
    setIsLoading(false);
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
          <div className="h-24 w-24 rounded-2xl bg-card/50 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 animate-float glow-primary-lg p-2">
            <img 
              src={logo} 
              alt="BotMotion.ai" 
              className="h-full w-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" 
            />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {isRegisterMode ? 'Inteligentni chatboti za vaše podjetje' : 'Vaš chatbot vas čaka'}
          </h2>
          <p className="text-muted-foreground">
            {isRegisterMode 
              ? 'Ustvarite prilagojene AI chatbote v minutah. Brez programiranja.'
              : 'Prijavite se in upravljajte svoje AI asistente.'
            }
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <a href="https://botmotion.ai/" className="inline-flex items-center gap-2 mb-8">
              <img 
                src={logoInline} 
                alt="BotMotion.ai" 
                className="h-14 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
              />
            </a>
            <h1 className="text-3xl font-bold text-foreground">
              {isRegisterMode ? 'Ustvarite račun' : 'Dobrodošli nazaj'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isRegisterMode ? 'Začnite graditi svoje AI chatbota' : 'Prijavite se v svoj račun'}
            </p>
          </div>

          {errors.general && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive rounded-md">
              {errors.general}
            </div>
          )}

          {isRegisterMode ? (
            // Register Form
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Ime</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Janez Novak"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <ErrorMessage message={errors.name} />}
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
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <ErrorMessage message={errors.email} />}
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
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <ErrorMessage message={errors.phone} />}
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
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && <ErrorMessage message={errors.password} />}
                
                {password && unfulfilledRequirements.length > 0 && (
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
                      {unfulfilledRequirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                          {req.label}
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
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                {errors.confirmPassword && <ErrorMessage message={errors.confirmPassword} />}
              </div>

              <Button
                type="submit"
                className={`w-full ${shake ? 'animate-shake' : ''}`}
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
          ) : (
            // Login Form
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ime@podjetje.si"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <ErrorMessage message={errors.email} />}
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
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && <ErrorMessage message={errors.password} />}
              </div>

              <Button
                type="submit"
                className={`w-full ${shake ? 'animate-shake' : ''}`}
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
          )}

          <div className="text-center space-y-2">
            {!isRegisterMode && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline font-medium block w-full"
              >
                Pozabljeno geslo?
              </button>
            )}
            <p className="text-sm text-muted-foreground">
              {isRegisterMode ? (
                <>
                  Že imate račun?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode(false)}
                    className="text-primary hover:underline font-medium"
                  >
                    Prijavite se
                  </button>
                </>
              ) : (
                <>
                  Nimate računa?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Registrirajte se
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Forgot Password Modal */}
          <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ponastavitev gesla</DialogTitle>
                <DialogDescription>
                  Vnesite svoj email naslov in poslali vam bomo povezavo za ponastavitev gesla.
                </DialogDescription>
              </DialogHeader>
              {!resetSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">Email</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="ime@podjetje.si"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeForgotPasswordModal}
                      className="flex-1"
                    >
                      Zapri
                    </Button>
                    <Button
                      type="submit"
                      variant="glow"
                      disabled={isResetting}
                      className="flex-1"
                    >
                      {isResetting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Pošlji povezavo'
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Če email obstaja v našem sistemu, smo poslali povezavo za ponastavitev gesla.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForgotPasswordModal}
                    className="w-full"
                  >
                    Zapri
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
