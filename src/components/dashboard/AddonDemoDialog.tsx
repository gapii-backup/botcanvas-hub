import { Check, Sparkles, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Addon demo data - copied from Complete.tsx
export const ADDON_DEMO_DATA: Record<string, {
  badge?: string;
  videoUrl: string | null;
  description: string;
  bullets: string[];
  stat: string;
}> = {
  product_ai: {
    badge: '💎 Največji ROI',
    videoUrl: '/videos/ai-products.mp4',
    description: 'AI priporoča izdelke glede na pogovor s stranko',
    bullets: [
      'AI predlaga relevantne izdelke glede na pogovor',
      'Prikazuje slike, cene in opise',
      'Direktna povezava do nakupa'
    ],
    stat: 'Povprečno +34% večja košarica'
  },
  tickets: {
    badge: '🔥 Najbolj priljubljeno',
    videoUrl: '/videos/support-ticket.mp4',
    description: 'Stranke ustvarijo support ticket direktno v chatu',
    bullets: [
      'Stranke ustvarijo ticket direktno v chatu',
      'Vsi podatki shranjeni na enem mestu',
      'Obveščanje po emailu za vas in stranko'
    ],
    stat: '40% hitrejše reševanje zahtevkov'
  },
  contacts: {
    badge: '💰 Najboljša vrednost',
    videoUrl: '/videos/leadgeneration.mp4',
    description: 'Avtomatsko zbirajte kontakte potencialnih strank',
    bullets: [
      'Chatbot naravno vpraša za email',
      'Avtomatski export iz nadzorne plošče',
      'GDPR skladna soglasja'
    ],
    stat: 'Povprečno +45% več leadov'
  },
  multilanguage: {
    badge: undefined,
    videoUrl: null,
    description: 'Vaš chatbot bo komuniciral v jeziku vaše stranke',
    bullets: [
      'Chatbot avtomatsko zazna jezik obiskovalca ob prvem sporočilu',
      'Podpira slovenščino in +50 drugih jezikov',
      'Naravni odgovori v jeziku stranke'
    ],
    stat: 'Dosežite 3x več strank v regiji'
  },
  booking: {
    badge: undefined,
    videoUrl: '/videos/rezervacija-termina.mp4',
    description: 'Omogočite strankam rezervacijo terminov direktno v chatu',
    bullets: [
      'Stranke rezervirajo termin direktno v chatu',
      'Sinhronizacija z Google Calendar ali Outlook',
      'Avtomatski reminder pred sestankom'
    ],
    stat: 'Povprečno +60% več rezervacij'
  },
};

interface AddonDemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addonId: string | null;
  addonName: string;
  addonPrice: number;
  addonPeriod: string;
  isActive: boolean;
  onAddClick: () => void;
}

export function AddonDemoDialog({
  open,
  onOpenChange,
  addonId,
  addonName,
  addonPrice,
  addonPeriod,
  isActive,
  onAddClick,
}: AddonDemoDialogProps) {
  if (!addonId) return null;
  
  const demoData = ADDON_DEMO_DATA[addonId];
  if (!demoData) return null;

  const priceLabel = `€${addonPrice}/${addonPeriod}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 w-screen h-screen max-w-none max-h-none sm:w-auto sm:h-auto sm:max-w-md sm:max-h-[90vh] rounded-none sm:rounded-2xl flex flex-col border-0 sm:border">
        {/* CELOTEN CONTENT SCROLA SKUPAJ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Video */}
          <div className="w-full max-w-[280px] mx-auto mb-6">
            {demoData.videoUrl ? (
              <video
                src={demoData.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full aspect-square rounded-xl object-cover"
              />
            ) : (
              /* Multilanguage animacija */
              <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center border border-amber-500/30">
                <div className="text-center">
                  <div className="text-5xl mb-3">🌍</div>
                  <div className="flex justify-center gap-2 text-2xl">
                    <span>🇸🇮</span><span>🇬🇧</span><span>🇩🇪</span><span>🇫🇷</span><span>🇮🇹</span>
                  </div>
                  <p className="text-amber-500 mt-3 text-sm font-medium">+50 jezikov</p>
                </div>
              </div>
            )}
          </div>

          {/* Title + Badge */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-foreground">{addonName}</h3>
              {demoData.badge && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/20 text-amber-500">
                  {demoData.badge}
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1">{demoData.description}</p>
          </div>

          {/* Bullets */}
          <div className="space-y-2 mb-4">
            {demoData.bullets.map((bullet, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{bullet}</span>
              </div>
            ))}
          </div>

          {/* Stat - AMBER STIL */}
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 mb-6">
            <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <span className="text-sm font-medium text-amber-500">{demoData.stat}</span>
          </div>

          {/* CTA */}
          <div className="border-t border-border pt-4 flex flex-col gap-2">
            {isActive ? (
              <div className="w-full bg-green-500/10 border border-green-500/30 text-green-500 font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2">
                <Check className="h-5 w-5" />
                Že aktivno ✓
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenChange(false);
                  onAddClick();
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all hover:from-amber-600 hover:to-yellow-600 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Dodaj za {priceLabel}
              </button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              className="w-full"
            >
              Zapri
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
