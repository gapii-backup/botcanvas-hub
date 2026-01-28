import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';

interface SubscriptionPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: (period: 'monthly' | 'yearly') => void;
  subscribing: 'monthly' | 'yearly' | null;
}

export function SubscriptionPopup({ 
  open, 
  onOpenChange, 
  onSubscribe, 
  subscribing 
}: SubscriptionPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md mx-auto border-2 border-amber-400/50 bg-gradient-to-br from-background via-background to-amber-500/5">
        <DialogHeader className="text-center space-y-4 flex flex-col items-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Sparkles className="w-8 h-8 text-amber-950" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white text-center w-full">
            Vaš chatbot je pripravljen!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm sm:text-base text-center w-full">
            Za aktivacijo izberite naročniški paket
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 mt-6">
          <Button 
            className="w-full h-14 text-base font-bold bg-transparent border-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 transition-all duration-300 hover:scale-[1.02]"
            size="lg"
            onClick={() => onSubscribe('monthly')}
            disabled={subscribing !== null}
          >
            {subscribing === 'monthly' && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
            <span className="font-bold">Mesečna naročnina</span>
          </Button>
          <Button 
            className="w-full h-14 text-base font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 border-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30"
            size="lg"
            onClick={() => onSubscribe('yearly')}
            disabled={subscribing !== null}
          >
            {subscribing === 'yearly' && <Loader2 className="h-5 w-5 mr-2 animate-spin text-amber-950" />}
            <span className="font-bold text-amber-950">Letna naročnina</span>
            <span className="ml-3 bg-amber-600 text-amber-100 px-2.5 py-1 rounded-md text-sm font-bold">-17%</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
