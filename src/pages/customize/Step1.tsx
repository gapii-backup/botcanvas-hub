import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sun, Moon, RotateCcw } from 'lucide-react';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { WidgetPreview } from '@/components/widget/WidgetPreview';
import { ImageUpload } from '@/components/ImageUpload';

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
    <WizardLayout 
      currentStep={1} 
      totalSteps={3} 
      preview={<WidgetPreview config={config} showChat={true} showHome={false} />}
    >
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
          <ImageUpload
            value={config.botAvatar}
            onChange={(url) => setConfig({ botAvatar: url })}
            placeholder="URL slike"
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
