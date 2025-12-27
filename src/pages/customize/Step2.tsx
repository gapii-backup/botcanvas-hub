import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Bot, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { WizardLayout } from '@/components/wizard/WizardLayout';

export default function Step2() {
  const navigate = useNavigate();
  const { config, setConfig } = useWizardConfig();
  const [newQuestion, setNewQuestion] = useState('');

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setConfig({ quickQuestions: [...config.quickQuestions, newQuestion.trim()] });
      setNewQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    setConfig({ quickQuestions: config.quickQuestions.filter((_, i) => i !== index) });
  };

  return (
    <WizardLayout currentStep={2} totalSteps={3} preview={
      <div className="w-full max-w-[320px]">
        {/* Widget preview */}
        <div 
          className="rounded-t-2xl p-4 flex items-center gap-3"
          style={{ 
            background: `linear-gradient(135deg, ${config.primaryColor}, ${config.primaryColor}cc)` 
          }}
        >
          <div 
            className="h-10 w-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{config.name}</h3>
            <p className="text-xs text-white/70">Online</p>
          </div>
        </div>
        <div className={cn(
          "rounded-b-2xl p-6",
          config.darkMode ? "bg-zinc-900" : "bg-white"
        )}>
          <div className="text-center mb-6">
            <h4 className={cn(
              "text-lg font-semibold",
              config.darkMode ? "text-white" : "text-zinc-900"
            )}>
              {config.homeTitle}
            </h4>
            <p className={cn(
              "text-sm mt-1",
              config.darkMode ? "text-zinc-400" : "text-zinc-500"
            )}>
              {config.homeSubtitle}
            </p>
          </div>

          {/* Quick questions preview */}
          <div className="space-y-2">
            {config.quickQuestions.slice(0, 2).map((q, i) => (
              <button
                key={i}
                className={cn(
                  "w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors",
                  config.darkMode 
                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" 
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                )}
              >
                {q}
              </button>
            ))}
          </div>

          {config.showEmailField && (
            <div className={cn(
              "mt-4 text-xs text-center",
              config.darkMode ? "text-zinc-500" : "text-zinc-400"
            )}>
              📧 Email polje prikazano
            </div>
          )}
        </div>
      </div>
    }>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Chat nastavitve</h2>
          <p className="text-muted-foreground">Prilagodite sporočila in hitra vprašanja.</p>
        </div>

        {/* Home title */}
        <div className="space-y-2">
          <Label htmlFor="home-title">Naslov na domači strani</Label>
          <Input
            id="home-title"
            value={config.homeTitle}
            onChange={(e) => setConfig({ homeTitle: e.target.value })}
            placeholder="Pozdravljeni!"
          />
        </div>

        {/* Home subtitle */}
        <div className="space-y-2">
          <Label htmlFor="home-subtitle">Podnaslov</Label>
          <Input
            id="home-subtitle"
            value={config.homeSubtitle}
            onChange={(e) => setConfig({ homeSubtitle: e.target.value })}
            placeholder="Kako vam lahko pomagam?"
          />
        </div>

        {/* Welcome message */}
        <div className="space-y-2">
          <Label htmlFor="welcome-message">Pozdravno sporočilo</Label>
          <Textarea
            id="welcome-message"
            value={config.welcomeMessage}
            onChange={(e) => setConfig({ welcomeMessage: e.target.value })}
            placeholder="Pozdravljeni! Kako vam lahko pomagam?"
            rows={3}
          />
        </div>

        {/* Quick questions */}
        <div className="space-y-3">
          <Label>Hitra vprašanja</Label>
          <div className="space-y-2">
            {config.quickQuestions.map((q, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={q} readOnly className="flex-1 bg-muted" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Novo vprašanje..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addQuestion}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Show email field */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Prikaži email polje</Label>
            <p className="text-xs text-muted-foreground">
              Zbirajte email naslove od obiskovalcev
            </p>
          </div>
          <Switch
            checked={config.showEmailField}
            onCheckedChange={(checked) => setConfig({ showEmailField: checked })}
          />
        </div>

        {/* Navigation */}
        <div className="pt-4 flex justify-between">
          <Button variant="outline" onClick={() => navigate('/customize/step-1')} size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazaj
          </Button>
          <Button onClick={() => navigate('/customize/step-3')} size="lg">
            Naprej
          </Button>
        </div>
      </div>
    </WizardLayout>
  );
}
