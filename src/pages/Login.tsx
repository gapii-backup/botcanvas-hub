import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWidget } from '@/hooks/useWidget';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, X, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
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
  password: z.string()
    .min(8, 'Geslo mora imeti vsaj 8 znakov')
    .regex(/[A-Z]/, 'Geslo mora vsebovati vsaj 1 veliko črko')
    .regex(/[0-9]/, 'Geslo mora vsebovati vsaj 1 številko'),
});

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
};

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 mt-1.5">
    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
    <span className="text-xs text-red-400">{message}</span>
  </div>
);

export default function Login() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [shake, setShake] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const { widget, loading: widgetLoading } = useWidget();
  const navigate = useNavigate();

  const passwordStrength = (() => {
    const passed = passwordRequirements.filter(req => req.test(password)).length;
    return {
      passed,
      total: passwordRequirements.length,
      percentage: (passed / passwordRequirements.length) * 100,
      color: passed === 0 ? 'bg-white/5' : passed === 1 ? 'bg-red-500' : passed === 2 ? 'bg-yellow-500' : 'bg-emerald-500',
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
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
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
    setPassword('');
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
    
    const validation = registerSchema.safeParse({ name, email, password });
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

  const inputClassName = (hasError: boolean) => `
    w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 
    text-white placeholder:text-slate-600 
    focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 
    transition-all
    ${hasError ? 'border-red-500' : ''}
  `;

  return (
    <div className="min-h-screen flex bg-[#050505] relative">
      {/* Form panel - full width on mobile, half on desktop */}
      <div className="w-full lg:flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#050505] relative z-10">
        <div 
          className="w-full max-w-md space-y-8 bg-[#171717] border border-white/10 rounded-2xl px-6 pt-2 pb-6 sm:px-8 sm:pt-3 sm:pb-8 relative overflow-hidden animate-fade-in"
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none rounded-2xl" />
          
          <div className="relative z-10 space-y-8">
            <div className="text-center">
              <a href="https://botmotion.ai/" className="inline-flex items-center gap-2 mb-8">
                <img 
                  src={logoInline}
                  alt="BotMotion.ai" 
                  className="h-11" 
                  style={{ filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.9))' }}
                />
              </a>
              <h1 className="text-3xl font-bold text-white">
                {isRegisterMode ? 'Ustvarite račun' : 'Dobrodošli nazaj'}
              </h1>
              <p className="mt-2 text-slate-400">
                {isRegisterMode ? 'Začnite graditi svoje AI chatbota' : 'Prijavite se v svoj račun'}
              </p>
            </div>

            {errors.general && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                {errors.general}
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white hover:bg-white/10 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Nadaljuj z Google
            </button>

            {/* Separator */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-sm text-slate-500">ali</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {isRegisterMode ? (
              // Register Form
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-medium">Ime</Label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Janez Novak"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputClassName(!!errors.name)}
                  />
                  {errors.name && <ErrorMessage message={errors.name} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">Email</Label>
                  <input
                    id="email"
                    type="email"
                    placeholder="ime@podjetje.si"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClassName(!!errors.email)}
                  />
                  {errors.email && <ErrorMessage message={errors.email} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">Geslo</Label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      required
                      className={`${inputClassName(!!errors.password)} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <ErrorMessage message={errors.password} />}
                  
                  {password && (passwordFocused || unfulfilledRequirements.length > 0) && (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${passwordStrength.percentage}%` }}
                          />
                        </div>
                        {passwordStrength.label && (
                          <span className={`text-xs font-medium ${
                            passwordStrength.passed === 1 ? 'text-red-400' : 
                            passwordStrength.passed === 2 ? 'text-yellow-400' : 'text-emerald-400'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {unfulfilledRequirements.map((req, index) => (
                          <li key={index} className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="h-1 w-1 rounded-full bg-slate-500" />
                            {req.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`shiny-button w-full py-3.5 bg-[#282828] text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${shake ? 'animate-shake' : ''}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    'Registriraj se'
                  )}
                </button>
              </form>
            ) : (
              // Login Form
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">Email</Label>
                  <input
                    id="email"
                    type="email"
                    placeholder="ime@podjetje.si"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClassName(!!errors.email)}
                  />
                  {errors.email && <ErrorMessage message={errors.email} />}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-white font-medium">Geslo</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Pozabljeno geslo?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`${inputClassName(!!errors.password)} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <ErrorMessage message={errors.password} />}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`shiny-button w-full py-3.5 bg-[#282828] text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${shake ? 'animate-shake' : ''}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    'Prijava'
                  )}
                </button>
              </form>
            )}

            <div className="text-center space-y-3 pt-4">
              <p className="text-sm text-slate-500">
                {isRegisterMode ? (
                  <>
                    Že imate račun?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode(false)}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
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
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Registrirajte se
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual panel - hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center p-8 relative overflow-hidden">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern" />
        
        {/* Blue glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/15 rounded-full blur-[96px]" />
        
        <div className="relative z-10 text-center max-w-lg">
          <h2 className="text-4xl font-bold text-white mb-4">
            {isRegisterMode 
              ? 'Ustvarite AI chatbota v minuti. Brez programiranja.'
              : 'Prijavite se in upravljajte svojega AI chatbota.'
            }
          </h2>
          <p className="text-slate-400 text-lg">
            {isRegisterMode 
              ? 'Povečajte prodajo, zmanjšajte stroške podpore in izboljšajte izkušnjo strank.'
              : 'Dostopajte do svoje nadzorne plošče, analizirajte pogovore in optimizirajte vašega chatbota.'
            }
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#171717] border border-white/10 rounded-2xl p-6 w-full max-w-md relative animate-fade-in">
            <button
              onClick={closeForgotPasswordModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-2">Ponastavitev gesla</h2>
            
            {!resetSent ? (
              <>
                <p className="text-slate-400 text-sm mb-6">
                  Vnesite svoj email naslov in poslali vam bomo povezavo za ponastavitev gesla.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <input
                    type="email"
                    placeholder="ime@podjetje.si"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className={inputClassName(false)}
                  />
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="shiny-button w-full py-3.5 bg-[#282828] text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResetting ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      'Pošlji povezavo'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-slate-300">
                  Povezava za ponastavitev gesla je bila poslana na <strong className="text-white">{resetEmail}</strong>
                </p>
                <button
                  onClick={closeForgotPasswordModal}
                  className="mt-4 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Zapri
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
