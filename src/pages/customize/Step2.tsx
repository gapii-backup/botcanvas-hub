import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, X, ArrowLeft } from 'lucide-react';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { WidgetPreview } from '@/components/widget/WidgetPreview';

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
    <WizardLayout 
      currentStep={2} 
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
