import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, AlignLeft, AlignRight } from 'lucide-react';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { TriggerPreview } from '@/components/widget/WidgetPreview';

export default function Step3() {
  const navigate = useNavigate();
  const { config, setConfig } = useWizardConfig();

  return (
    <WizardLayout currentStep={3} totalSteps={3} preview={
      <div className="flex flex-col items-center justify-end h-full pb-8">
        <TriggerPreview config={config} />
      </div>
    }>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Bubble & pozicija</h2>
          <p className="text-muted-foreground">Prilagodite gumb za odpiranje chata.</p>
        </div>

        {/* Show bubble */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Prikaži welcome bubble</Label>
            <p className="text-xs text-muted-foreground">
              Pokaži mehurček z dobrodošlico
            </p>
          </div>
          <Switch
            checked={config.showBubble}
            onCheckedChange={(checked) => setConfig({ showBubble: checked })}
          />
        </div>

        {/* Bubble text */}
        {config.showBubble && (
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="bubble-text">Besedilo mehurčka</Label>
            <Input
              id="bubble-text"
              value={config.bubbleText}
              onChange={(e) => setConfig({ bubbleText: e.target.value })}
              placeholder="👋 Pozdravljeni!"
            />
          </div>
        )}

        {/* Position */}
        <div className="space-y-3">
          <Label>Pozicija</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={config.position === 'left' ? "default" : "outline"}
              size="sm"
              onClick={() => setConfig({ position: 'left' })}
              className="flex-1"
            >
              <AlignLeft className="h-4 w-4 mr-2" />
              Levo
            </Button>
            <Button
              type="button"
              variant={config.position === 'right' ? "default" : "outline"}
              size="sm"
              onClick={() => setConfig({ position: 'right' })}
              className="flex-1"
            >
              <AlignRight className="h-4 w-4 mr-2" />
              Desno
            </Button>
          </div>
        </div>

        {/* Trigger style */}
        <div className="space-y-3">
          <Label>Stil gumba</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={config.triggerStyle === 'floating' ? "default" : "outline"}
              size="sm"
              onClick={() => setConfig({ triggerStyle: 'floating' })}
              className="flex-1"
            >
              Plavajoči
            </Button>
            <Button
              type="button"
              variant={config.triggerStyle === 'edge' ? "default" : "outline"}
              size="sm"
              onClick={() => setConfig({ triggerStyle: 'edge' })}
              className="flex-1"
            >
              Robni
            </Button>
          </div>
        </div>

        {/* Edge trigger text */}
        {config.triggerStyle === 'edge' && (
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="edge-text">Tekst na gumbu</Label>
            <Input
              id="edge-text"
              value={config.edgeTriggerText}
              onChange={(e) => setConfig({ edgeTriggerText: e.target.value })}
              placeholder="Klikni me"
            />
          </div>
        )}

        {/* Vertical offset */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Odmik od spodaj</Label>
            <span className="text-sm text-muted-foreground">{config.verticalOffset}px</span>
          </div>
          <Slider
            value={[config.verticalOffset]}
            onValueChange={([value]) => setConfig({ verticalOffset: value })}
            min={0}
            max={100}
            step={4}
          />
        </div>

        {/* Navigation */}
        <div className="pt-4 flex justify-between">
          <Button variant="outline" onClick={() => navigate('/customize/step-2')} size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazaj
          </Button>
          <Button onClick={() => navigate('/customize/complete')} size="lg">
            Zaključi
          </Button>
        </div>
      </div>
    </WizardLayout>
  );
}
