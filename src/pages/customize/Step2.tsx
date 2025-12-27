import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { useWizardConfig } from '@/hooks/useWizardConfig';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { WidgetPreview } from '@/components/widget/WidgetPreview';
import { ImageUpload } from '@/components/ImageUpload';

export default function Step2() {
  const navigate = useNavigate();
  const { config, setConfig } = useWizardConfig();

  return (
    <WizardLayout 
      currentStep={2} 
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

        {/* Profile picture */}
        <div className="space-y-2">
          <Label>Profilna slika ali ikona</Label>
          <ImageUpload
            value={config.botAvatar}
            onChange={(url) => setConfig({ botAvatar: url })}
            placeholder="URL slike"
            selectedIcon={config.botIcon}
            onIconChange={(icon) => setConfig({ botIcon: icon })}
            primaryColor={config.primaryColor}
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
