import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, X, RotateCcw } from 'lucide-react';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { WidgetPreview } from '@/components/widget/WidgetPreview';

export default function Step1() {
  const navigate = useNavigate();
  const { config, setConfig, defaultConfig } = useWizardConfig();
  const [newQuestion, setNewQuestion] = useState('');

  const addQuestion = () => {
    if (newQuestion.trim() && config.quickQuestions.length < 4) {
      setConfig({ quickQuestions: [...config.quickQuestions, newQuestion.trim()] });
      setNewQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    if (config.quickQuestions.length > 1) {
      setConfig({ quickQuestions: config.quickQuestions.filter((_, i) => i !== index) });
    }
  };

  const handleColorChange = (color: string) => {
    setConfig({ primaryColor: color });
  };

  const resetColor = () => {
    setConfig({ primaryColor: defaultConfig.primaryColor });
  };

  return (
    <WizardLayout 
      currentStep={1} 
      totalSteps={3} 
      preview={<WidgetPreview config={config} showChat={false} showHome={true} />}
    >
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

        {/* Primary color */}
        <div className="space-y-3">
          <Label>Glavna barva</Label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-10 w-10 rounded-lg cursor-pointer border-0"
              />
            </div>
            <Input
              value={config.primaryColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex-1 font-mono text-sm"
              placeholder="#3B82F6"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={resetColor}
              title="Ponastavi barvo"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Header style */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Uporabi gradient za glavo</Label>
            <p className="text-xs text-muted-foreground">
              Namesto enobarvne glave
            </p>
          </div>
          <Switch
            checked={config.headerStyle === 'gradient'}
            onCheckedChange={(checked) => setConfig({ headerStyle: checked ? 'gradient' : 'solid' })}
          />
        </div>

        {/* Quick questions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Hitra vprašanja</Label>
            <span className="text-xs text-muted-foreground">
              {config.quickQuestions.length}/4
            </span>
          </div>
          <div className="space-y-2">
            {config.quickQuestions.map((q, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={q} readOnly className="flex-1 bg-muted" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(index)}
                  disabled={config.quickQuestions.length <= 1}
                  className="text-destructive hover:text-destructive disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {config.quickQuestions.length < 4 && (
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
          )}
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
        <div className="pt-4 flex justify-end">
          <Button onClick={() => navigate('/customize/step-2')} size="lg">
            Naprej
          </Button>
        </div>
      </div>
    </WizardLayout>
  );
}
