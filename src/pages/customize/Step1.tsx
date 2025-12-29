import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, X, RotateCcw } from 'lucide-react';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { WidgetPreview } from '@/components/widget/WidgetPreview';
import { EmojiPicker } from '@/components/EmojiPicker';

export default function Step1() {
  const navigate = useNavigate();
  const { config, setConfig, defaultConfig } = useWizardConfig();
  const [newQuestion, setNewQuestion] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const addQuestion = () => {
    const trimmed = newQuestion.trim().slice(0, 35);
    if (trimmed && config.quickQuestions.length < 4) {
      setConfig({ quickQuestions: [...config.quickQuestions, trimmed] });
      setNewQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    if (config.quickQuestions.length > 1) {
      setConfig({ quickQuestions: config.quickQuestions.filter((_, i) => i !== index) });
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(config.quickQuestions[index]);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const updated = [...config.quickQuestions];
      updated[editingIndex] = editValue.trim().slice(0, 35);
      setConfig({ quickQuestions: updated });
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const handleColorChange = (color: string) => {
    setConfig({ primaryColor: color });
  };

  const resetColor = () => {
    setConfig({ primaryColor: defaultConfig.primaryColor });
  };

  return (
    <WizardLayout 
      currentStep={2} 
      totalSteps={4} 
      preview={<WidgetPreview config={config} showChat={false} showHome={true} />}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Chat nastavitve</h2>
          <p className="text-muted-foreground">Prilagodite sporočila in hitra vprašanja.</p>
        </div>

        {/* Home title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="home-title">Naslov na domači strani</Label>
            <span className="text-xs text-muted-foreground">{config.homeTitle.length}/21</span>
          </div>
          <div className="flex gap-1">
            <Input
              id="home-title"
              value={config.homeTitle}
              onChange={(e) => setConfig({ homeTitle: e.target.value.slice(0, 21) })}
              placeholder="Pozdravljeni!"
              maxLength={21}
              className="flex-1"
            />
            <EmojiPicker onEmojiSelect={(emoji) => setConfig({ homeTitle: (config.homeTitle + emoji).slice(0, 21) })} />
          </div>
        </div>

        {/* Home subtitle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="home-subtitle">Podnaslov</Label>
            <span className="text-xs text-muted-foreground">{config.homeSubtitle.length}/23</span>
          </div>
          <div className="flex gap-1">
            <Input
              id="home-subtitle"
              value={config.homeSubtitle}
              onChange={(e) => setConfig({ homeSubtitle: e.target.value.slice(0, 23) })}
              placeholder="Kako vam lahko pomagam?"
              maxLength={23}
              className="flex-1"
            />
            <EmojiPicker onEmojiSelect={(emoji) => setConfig({ homeSubtitle: (config.homeSubtitle + emoji).slice(0, 23) })} />
          </div>
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
                {editingIndex === index ? (
                  <div className="flex-1 relative">
                    <Input 
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value.slice(0, 35))}
                      onBlur={saveEdit}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      autoFocus
                      maxLength={35}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {editValue.length}/35
                    </span>
                  </div>
                ) : (
                  <Input 
                    value={q} 
                    readOnly 
                    className="flex-1 bg-muted cursor-pointer hover:bg-muted/80 transition-colors" 
                    onClick={() => startEditing(index)}
                  />
                )}
                <EmojiPicker onEmojiSelect={(emoji) => {
                  if (editingIndex === index) {
                    setEditValue((editValue + emoji).slice(0, 35));
                  } else {
                    const updated = [...config.quickQuestions];
                    updated[index] = (updated[index] + emoji).slice(0, 35);
                    setConfig({ quickQuestions: updated });
                  }
                }} />
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
              <div className="flex-1 relative">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value.slice(0, 35))}
                  placeholder="Novo vprašanje..."
                  maxLength={35}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {newQuestion.length}/35
                </span>
              </div>
              <EmojiPicker onEmojiSelect={(emoji) => setNewQuestion((newQuestion + emoji).slice(0, 35))} />
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
        <div className="pt-4 flex justify-between">
          <Button variant="outline" onClick={() => navigate('/customize/step-1')} size="lg">
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
