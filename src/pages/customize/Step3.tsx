import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { MessageCircle, ArrowLeft, AlignLeft, AlignRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { WizardLayout } from '@/components/wizard/WizardLayout';

export default function Step3() {
  const navigate = useNavigate();
  const { config, setConfig } = useWizardConfig();

  return (
    <WizardLayout currentStep={3} totalSteps={3} preview={
      <div className="relative w-full h-[400px]">
        {/* Bubble preview */}
        {config.showBubble && (
          <div 
            className={cn(
              "absolute top-4",
              config.position === 'right' ? 'right-16' : 'left-16'
            )}
          >
            <div className={cn(
              "px-4 py-2 rounded-2xl shadow-lg text-sm max-w-[200px]",
              config.darkMode ? "bg-zinc-800 text-white" : "bg-white text-zinc-900"
            )}>
              {config.bubbleText}
            </div>
          </div>
        )}

        {/* Trigger button preview */}
        <div 
          className={cn(
            "absolute",
            config.position === 'right' ? 'right-0' : 'left-0'
          )}
          style={{ bottom: `${config.verticalOffset}px` }}
        >
          {config.triggerStyle === 'floating' ? (
            <button
              className="h-14 w-14 rounded-full flex items-center justify-center shadow-lg text-white transition-transform hover:scale-110"
              style={{ backgroundColor: config.primaryColor }}
            >
              <MessageCircle className="h-6 w-6" />
            </button>
          ) : (
            <button
              className="px-4 py-3 rounded-l-lg shadow-lg text-white text-sm font-medium"
              style={{ 
                backgroundColor: config.primaryColor,
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
              }}
            >
              {config.edgeTriggerText}
            </button>
          )}
        </div>
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
