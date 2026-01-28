import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sun, Moon, RotateCcw } from 'lucide-react';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { WidgetPreview } from '@/components/widget/WidgetPreview';
import { ImageUpload } from '@/components/ImageUpload';
import { EmojiPicker } from '@/components/EmojiPicker';

export default function Step2() {
  const navigate = useNavigate();
  const { config, setConfig, defaultConfig } = useWizardConfig();

  const resetIconColors = () => {
    setConfig({ 
      iconBgColor: config.primaryColor, 
      iconColor: '#FFFFFF' 
    });
  };

  return (
    <WizardLayout 
      currentStep={3} 
      totalSteps={4} 
      preview={<WidgetPreview config={config} showChat={true} showHome={false} />}
      backPath="/customize/step-2"
      nextPath="/customize/step-4"
      nextLabel="Naprej"
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">Osnovni izgled</h2>
          <p className="text-muted-foreground text-sm">Prilagodite videz vašega chatbota.</p>
        </div>

        {/* Agent name */}
        <div className="space-y-2">
          <Label htmlFor="agent-name">Ime agenta</Label>
          <div className="flex gap-1">
            <Input
              id="agent-name"
              value={config.name}
              onChange={(e) => setConfig({ name: e.target.value })}
              placeholder="Moj AI Asistent"
              className="flex-1"
            />
            <EmojiPicker onEmojiSelect={(emoji) => setConfig({ name: config.name + emoji })} />
          </div>
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

        {/* Profile picture */}
        <div className="space-y-2">
          <Label>Profilna slika ali ikona</Label>
          <ImageUpload
            value={config.botAvatar}
            onChange={(url) => setConfig({ botAvatar: url })}
            placeholder="URL slike"
            selectedIcon={config.botIcon}
            onIconChange={(icon) => setConfig({ botIcon: icon })}
            primaryColor={config.iconBgColor}
            iconColor={config.iconColor}
          />
        </div>

        {/* Icon colors - always show, used for icon background even with avatar */}
        <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30 animate-fade-in">
          <div className="flex items-center justify-between">
            <Label>{config.botAvatar ? 'Barva ozadja slike' : 'Barve ikone'}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetIconColors}
              className="h-8 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Ponastavi
            </Button>
          </div>
          
          {/* Icon background color - always visible */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {config.botAvatar ? 'Ozadje slike' : 'Ozadje ikone'}
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={config.iconBgColor}
                  onChange={(e) => setConfig({ iconBgColor: e.target.value })}
                  className="h-10 w-10 rounded-lg cursor-pointer border-0"
                />
              </div>
              <Input
                value={config.iconBgColor}
                onChange={(e) => setConfig({ iconBgColor: e.target.value })}
                className="flex-1 font-mono text-sm"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Icon color - only when no avatar */}
          {!config.botAvatar && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Barva ikone</Label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={config.iconColor}
                    onChange={(e) => setConfig({ iconColor: e.target.value })}
                    className="h-10 w-10 rounded-lg cursor-pointer border-0"
                  />
                </div>
                <Input
                  value={config.iconColor}
                  onChange={(e) => setConfig({ iconColor: e.target.value })}
                  className="flex-1 font-mono text-sm"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </WizardLayout>
  );
}
