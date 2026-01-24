import { useState, useMemo } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { z } from 'zod';
import logo from '@/assets/logo.png';
import logoInline from '@/assets/logo-inline-dark.png';

const passwordRequirements = [
  { label: 'Vsaj 8 znakov', test: (pw: string) => pw.length >= 8 },
  { label: 'Vsaj 1 velika črka', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'Vsaj 1 številka', test: (pw: string) => /[0-9]/.test(pw) },
];

const registerSchema = z.object({
  name: z.string().min(2, 'Ime mora imeti vsaj 2 znaka'),
  email: z.string().email('Neveljaven email naslov'),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Geslo mora imeti vsaj 8 znakov')
    .regex(/[A-Z]/, 'Geslo mora vsebovati vsaj 1 veliko črko')
    .regex(/[0-9]/, 'Geslo mora vsebovati vsaj 1 številko'),
  confirmPassword: z.string().min(8, 'Geslo mora imeti vsaj 8 znakov'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Gesli se ne ujemata',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email('Neveljaven email naslov'),
  password: z.string().min(1, 'Geslo je obvezno'),
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
    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
    <span className="text-xs text-red-400">{message}</span>
  </div>
);

export default function Register() {
  const [isLoginMode, setIsLoginMode] = useState(false);
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
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => {
    const passed = passwordRequirements.filter(req => req.test(password)).length;
    return {
      passed,
      total: passwordRequirements.length,
      percentage: (passed / passwordRequirements.length) * 100,
      color: passed === 0 ? 'bg-white/5' : passed === 1 ? 'bg-red-500' : passed === 2 ? 'bg-yellow-500' : 'bg-emerald-500',
      label: passed === 0 ? '' : passed === 1 ? 'Šibko' : passed === 2 ? 'Srednje' : 'Močno',
    };
  }, [password]);

  const unfulfilledRequirements = useMemo(() => {
    return passwordRequirements.filter(req => !req.test(password));
  }, [password]);

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

  if (user) {
    return <Navigate to="/" replace />;
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

  const switchMode = (toLogin: boolean) => {
    setIsLoginMode(toLogin);
    clearForm();
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

    const { error } = await signUp(email, password, name, phone);

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

    navigate('/');
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
    <div className="min-h-screen flex bg-[#050505]">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div 
          className="w-full max-w-md space-y-8 bg-[#171717] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden animate-fade-in"
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none rounded-2xl" />
          
          <div className="relative z-10 space-y-8">
            <div className="text-center">
              <a href="https://botmotion.ai/" className="inline-flex items-center gap-2 mb-8">
                <img 
                  src={logoInline} 
                  alt="BotMotion.ai" 
                  className="h-14" 
                  style={{ filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.9))' }}
                />
              </a>
              <h1 className="text-3xl font-bold text-white">
                {isLoginMode ? 'Dobrodošli nazaj' : 'Ustvarite račun'}
              </h1>
              <p className="mt-2 text-slate-400">
                {isLoginMode ? 'Prijavite se v svoj račun' : 'Začnite graditi svoje AI chatbota'}
              </p>
            </div>

            {errors.general && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                {errors.general}
              </div>
            )}

            {isLoginMode ? (
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
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputClassName(!!errors.password)}
                  />
                  {errors.password && <ErrorMessage message={errors.password} />}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`shiny-button w-full py-3.5 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${shake ? 'animate-shake' : ''}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    'Prijava'
                  )}
                </button>
              </form>
            ) : (
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
                  <Label htmlFor="phone" className="text-white font-medium">Telefonska številka</Label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+386 40 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className={inputClassName(!!errors.phone)}
                  />
                  {errors.phone && <ErrorMessage message={errors.phone} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">Geslo</Label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputClassName(!!errors.password)}
                  />
                  {errors.password && <ErrorMessage message={errors.password} />}
                  
                  {password && unfulfilledRequirements.length > 0 && (
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white font-medium">Potrdi geslo</Label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={inputClassName(!!errors.confirmPassword)}
                  />
                  {errors.confirmPassword && <ErrorMessage message={errors.confirmPassword} />}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`shiny-button w-full py-3.5 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${shake ? 'animate-shake' : ''}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    'Registriraj se'
                  )}
                </button>
              </form>
            )}

            <div className="text-center space-y-3 pt-4">
              <p className="text-sm text-slate-500">
                {isLoginMode ? (
                  <>
                    Nimate računa?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode(false)}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Registrirajte se
                    </button>
                  </>
                ) : (
                  <>
                    Že imate račun?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode(true)}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Prijavite se
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern" />
        
        {/* Blue blur glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 text-center max-w-md">
          <div className="h-24 w-24 rounded-2xl bg-[#171717] border border-white/10 flex items-center justify-center mx-auto mb-8 animate-float p-2">
            <img 
              src={logo} 
              alt="BotMotion.ai" 
              className="h-full w-full object-contain" 
              style={{ filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.9))' }}
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {isLoginMode ? 'Vaš chatbot vas čaka' : 'Inteligentni chatboti za vaše podjetje'}
          </h2>
          <p className="text-slate-400">
            {isLoginMode 
              ? 'Prijavite se in upravljajte svoje AI asistente.'
              : 'Ustvarite AI chatbota v minuti. Brez programiranja.'
            }
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeForgotPasswordModal}
          />
          
          {/* Blue blur glow behind modal */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
          
          {/* Modal */}
          <div className="relative z-10 w-full max-w-md bg-[#171717] border border-white/10 rounded-2xl p-6 overflow-hidden animate-fade-in">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none rounded-2xl" />
            
            <div className="relative z-10">
              {/* Close button */}
              <button
                onClick={closeForgotPasswordModal}
                className="absolute top-0 right-0 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Ponastavitev gesla</h2>
                <p className="text-sm text-slate-400">
                  Vnesite svoj email naslov in poslali vam bomo povezavo za ponastavitev gesla.
                </p>
              </div>
              
              {!resetSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-white font-medium">Email</Label>
                    <input
                      id="resetEmail"
                      type="email"
                      placeholder="ime@podjetje.si"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className={inputClassName(false)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeForgotPasswordModal}
                      className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-colors"
                    >
                      Zapri
                    </button>
                    <button
                      type="submit"
                      disabled={isResetting}
                      className="shiny-button flex-1 py-3 text-white font-semibold transition-all disabled:opacity-50"
                    >
                      {isResetting ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      ) : (
                        'Pošlji povezavo'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Če email obstaja v našem sistemu, smo poslali povezavo za ponastavitev gesla.
                  </p>
                  <button
                    type="button"
                    onClick={closeForgotPasswordModal}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-colors"
                  >
                    Zapri
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
