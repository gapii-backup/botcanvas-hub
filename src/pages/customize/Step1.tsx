import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sun, Moon, RotateCcw, Upload, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { WizardLayout } from '@/components/wizard/WizardLayout';

export default function Step1() {
  const navigate = useNavigate();
  const { config, setConfig, defaultConfig } = useWizardConfig();

  const handleColorChange = (color: string) => {
    setConfig({ primaryColor: color });
  };

  const resetColor = () => {
    setConfig({ primaryColor: defaultConfig.primaryColor });
  };

  return (
    <WizardLayout currentStep={1} totalSteps={3} preview={
      <div className="w-full max-w-[320px]">
        {/* Widget header preview */}
        <div 
          className={cn(
            "rounded-t-2xl p-4 flex items-center gap-3",
            config.headerStyle === 'gradient' 
              ? "bg-gradient-to-r from-primary to-primary/80" 
              : ""
          )}
          style={{ 
            backgroundColor: config.headerStyle === 'solid' ? config.primaryColor : undefined,
            background: config.headerStyle === 'gradient' 
              ? `linear-gradient(135deg, ${config.primaryColor}, ${config.primaryColor}cc)` 
              : undefined 
          }}
        >
          <div 
            className="h-10 w-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            {config.botAvatar ? (
              <img src={config.botAvatar} alt="Bot" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <Bot className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">{config.name || 'AI Asistent'}</h3>
            <p className="text-xs text-white/70">Online</p>
          </div>
        </div>
        <div className={cn(
          "rounded-b-2xl p-6 h-64",
          config.darkMode ? "bg-zinc-900" : "bg-white"
        )}>
          <p className={cn(
            "text-sm text-center mt-8",
            config.darkMode ? "text-zinc-400" : "text-zinc-500"
          )}>
            Predogled sporočil...
          </p>
        </div>
      </div>
    }>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Osnovni izgled</h2>
          <p className="text-muted-foreground">Prilagodite videz vašega chatbota.</p>
        </div>

        {/* Agent name */}
        <div className="space-y-2">
          <Label htmlFor="agent-name">Ime agenta</Label>
          <Input
            id="agent-name"
            value={config.name}
            onChange={(e) => setConfig({ name: e.target.value })}
            placeholder="Moj AI Asistent"
          />
        </div>

        {/* Appearance - Light/Dark */}
        <div className="space-y-3">
          <Label>Videz</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!config.darkMode ? "default" : "outline"}
              size="sm"
              onClick={() => setConfig({ darkMode: false })}
              className="flex-1"
            >
              <Sun className="h-4 w-4 mr-2" />
              Svetla
            </Button>
            <Button
              type="button"
              variant={config.darkMode ? "default" : "outline"}
              size="sm"
              onClick={() => setConfig({ darkMode: true })}
              className="flex-1"
            >
              <Moon className="h-4 w-4 mr-2" />
              Temna
            </Button>
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

        {/* Profile picture */}
        <div className="space-y-2">
          <Label>Profilna slika</Label>
          <div className="flex gap-3">
            <Input
              placeholder="URL slike ali pustite prazno"
              value={config.botAvatar}
              onChange={(e) => setConfig({ botAvatar: e.target.value })}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Vnesite URL slike ali pustite prazno za privzeto ikono
          </p>
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
