import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { AlignLeft, AlignRight, MessageCircle, MessageSquare, Bot, Sparkles, Headphones, Zap, LucideIcon } from 'lucide-react';
import { useWizardConfig, TRIGGER_ICONS } from '@/hooks/useWizardConfig';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { TriggerPreview } from '@/components/widget/WidgetPreview';
import { EmojiPicker } from '@/components/EmojiPicker';
import { cn } from '@/lib/utils';

const TriggerIconComponents: Record<string, LucideIcon> = {
  MessageCircle,
  MessageSquare,
  Bot,
  Sparkles,
  Headphones,
  Zap,
};

export default function Step3() {
  const navigate = useNavigate();
  const { config, setConfig } = useWizardConfig();

  return (
    <WizardLayout 
      currentStep={4} 
      totalSteps={4} 
      preview={
        <div 
          className="relative w-full h-full"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: config.position === 'right' ? 'flex-end' : 'flex-start',
            padding: '20px',
            paddingBottom: `${config.verticalOffset + 20}px`,
          }}
        >
          <TriggerPreview config={config} />
        </div>
      }
      backPath="/customize/step-3"
      nextPath="/customize/complete"
      nextLabel="Zaključi"
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Gumb za odpiranje</h2>
          <p className="text-muted-foreground">Prilagodite gumb za odpiranje chata.</p>
        </div>

        {/* Show bubble */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Prikaži mehurček</Label>
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
            <div className="flex gap-1">
              <Input
                id="bubble-text"
                value={config.bubbleText}
                onChange={(e) => setConfig({ bubbleText: e.target.value })}
                placeholder="👋 Pozdravljeni!"
                className="flex-1"
              />
              <EmojiPicker onEmojiSelect={(emoji) => setConfig({ bubbleText: config.bubbleText + emoji })} />
            </div>
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
              className="flex-1 whitespace-nowrap"
            >
              Robni
            </Button>
          </div>
        </div>

        {/* Trigger icon - only for floating style */}
        {config.triggerStyle === 'floating' && (
          <div className="space-y-3 animate-fade-in">
            <Label>Ikona gumba</Label>
            <div className="grid grid-cols-3 gap-2">
              {TRIGGER_ICONS.map(({ name, label }) => {
                const IconComp = TriggerIconComponents[name];
                const isSelected = config.triggerIcon === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setConfig({ triggerIcon: name })}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all hover:scale-105",
                      isSelected 
                        ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-background" 
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <IconComp className="w-6 h-6" style={{ color: isSelected ? config.primaryColor : 'hsl(var(--foreground))' }} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
      </div>
    </WizardLayout>
  );
}
