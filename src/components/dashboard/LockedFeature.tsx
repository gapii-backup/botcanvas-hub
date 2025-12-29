import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UpgradeModal } from './UpgradeModal';
import { AddonModal } from './AddonModal';

interface LockedFeatureProps {
  feature: string;
  description: string;
  addon?: string;
}

export function LockedFeature({ feature, description, addon }: LockedFeatureProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          {feature} ni na voljo
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
        <div className="flex gap-4">
          <Button 
            onClick={() => setShowUpgradeModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            Nadgradi paket
          </Button>
          {addon && (
            <Button 
              variant="outline"
              onClick={() => setShowAddonModal(true)}
            >
              Kupi addon
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Na voljo v Pro in Enterprise paketu
        </p>
      </div>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      {addon && (
        <AddonModal open={showAddonModal} onOpenChange={setShowAddonModal} addon={addon} />
      )}
    </>
  );
}
