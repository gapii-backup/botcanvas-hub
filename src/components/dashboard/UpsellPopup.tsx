import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Languages, 
  Users, 
  Ticket, 
  Lightbulb, 
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AddonModal } from './AddonModal';

type AddonConfig = {
  id: string;
  name: string;
  icon: React.ElementType;
  monthlyPrice: number;
  yearlyPrice: number;
  proOnly?: boolean;
};

const allAddons: AddonConfig[] = [
  { id: 'multilanguage', name: 'Večjezičnost', icon: Languages, monthlyPrice: 30, yearlyPrice: 300 },
  { id: 'contacts', name: 'Zbiranje kontaktov', icon: Users, monthlyPrice: 20, yearlyPrice: 200 },
  { id: 'tickets', name: 'Support Ticketi', icon: Ticket, monthlyPrice: 35, yearlyPrice: 355 },
  { id: 'booking', name: 'Rezervacija terminov', icon: Calendar, monthlyPrice: 35, yearlyPrice: 355 },
  { id: 'product_ai', name: 'AI priporočanje izdelkov', icon: Lightbulb, monthlyPrice: 100, yearlyPrice: 1000, proOnly: true },
];

interface UpsellPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueWithoutAddons: (addedAnyAddon: boolean) => void;
  plan: string;
  billingPeriod: string;
  existingAddons: string[];
  apiKey: string;
}

export function UpsellPopup({ 
  open, 
  onOpenChange,
  onContinueWithoutAddons,
  plan,
  billingPeriod,
  existingAddons,
  apiKey,
}: UpsellPopupProps) {
  const [selectedAddon, setSelectedAddon] = useState<string | null>(null);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [addedAddons, setAddedAddons] = useState<Set<string>>(new Set());

  // Filter addons based on plan
  const getAvailableAddons = (): AddonConfig[] => {
    // Enterprise has everything included - no upsell
    if (plan === 'enterprise') {
      return [];
    }

    let available: AddonConfig[] = [];

    if (plan === 'basic') {
      // Basic: multilanguage, contacts, tickets, booking (NO product_ai)
      available = allAddons.filter(a => 
        ['multilanguage', 'contacts', 'tickets', 'booking'].includes(a.id)
      );
    } else if (plan === 'pro') {
      // Pro: only product_ai
      available = allAddons.filter(a => a.id === 'product_ai');
    }

    // Filter out addons user already has
    available = available.filter(a => !existingAddons.includes(a.id));

    return available;
  };

  const availableAddons = getAvailableAddons();
  const isYearly = billingPeriod === 'yearly';

  const handleAddAddon = (addonId: string) => {
    setSelectedAddon(addonId);
    setShowAddonModal(true);
  };

  const handleAddonSuccess = (addonId: string) => {
    // Mark addon as added and update button state
    setAddedAddons(prev => new Set(prev).add(addonId));
    setShowAddonModal(false);
    setSelectedAddon(null);
  };

  const handleContinue = () => {
    const addedAny = addedAddons.size > 0;
    onOpenChange(false);
    onContinueWithoutAddons(addedAny);
  };

  // Don't render if no addons available
  if (availableAddons.length === 0) {
    return null;
  }

  return (
    <>
      <Dialog open={open && !showAddonModal} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg mx-auto border-2 border-amber-400/50 bg-gradient-to-br from-background via-background to-amber-500/5">
          <DialogHeader className="text-center space-y-4 flex flex-col items-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Sparkles className="w-8 h-8 text-amber-950" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground text-center w-full">
              Nadgradite svojo izkušnjo
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm sm:text-base text-center w-full">
              Dodajte močne funkcije vašemu chatbotu
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {availableAddons.map((addon) => {
              const Icon = addon.icon;
              const price = isYearly ? addon.yearlyPrice : addon.monthlyPrice;
              const period = isYearly ? 'leto' : 'mesec';
              const isAdded = addedAddons.has(addon.id);

              return (
                <div 
                  key={addon.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border hover:border-amber-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isAdded ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                      <Icon className={`w-5 h-5 ${isAdded ? 'text-green-500' : 'text-amber-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{addon.name}</p>
                      <p className="text-sm text-muted-foreground">
                        €{price}<span className="text-xs">+DDV</span>/{period}
                      </p>
                    </div>
                  </div>
                  {isAdded ? (
                    <Button
                      size="sm"
                      disabled
                      className="bg-green-600 hover:bg-green-600 text-white font-semibold cursor-default"
                    >
                      Dodano ✓
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAddAddon(addon.id)}
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-semibold"
                    >
                      Dodaj
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={handleContinue}
            >
              Nadaljuj brez dodatkov
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AddonModal for purchase confirmation with legal info */}
      <AddonModal
        open={showAddonModal}
        onOpenChange={(open) => {
          setShowAddonModal(open);
          if (!open) {
            setSelectedAddon(null);
          }
        }}
        addon={selectedAddon}
        onSuccess={handleAddonSuccess}
      />
    </>
  );
}

// Helper function to check if upsell should be shown
export function shouldShowUpsell(plan: string, existingAddons: string[]): boolean {
  if (plan === 'enterprise') {
    return false;
  }

  let availableCount = 0;

  if (plan === 'basic') {
    // Basic can have: multilanguage, contacts, tickets, booking
    const basicAddons = ['multilanguage', 'contacts', 'tickets', 'booking'];
    availableCount = basicAddons.filter(a => !existingAddons.includes(a)).length;
  } else if (plan === 'pro') {
    // Pro can only have: product_ai
    availableCount = existingAddons.includes('product_ai') ? 0 : 1;
  }

  return availableCount > 0;
}
