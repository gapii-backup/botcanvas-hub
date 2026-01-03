import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Code, Copy, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmbedCodePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedCode: string;
}

export function EmbedCodePopup({ 
  open, 
  onOpenChange, 
  embedCode 
}: EmbedCodePopupProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast({
      title: 'Kopirano!',
      description: 'Embed koda je bila kopirana v odložišče.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Code className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
            Naročnina aktivirana! 🎉
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm sm:text-base">
            Kopirajte embed kodo in jo prilepite na vašo spletno stran
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
            <code className="text-xs sm:text-sm font-mono text-foreground break-all">
              {embedCode}
            </code>
          </div>
          
          <div className="flex justify-center">
            <Button onClick={copyEmbedCode} className="w-full sm:w-auto">
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Kopirano!' : 'Kopiraj kodo'}
            </Button>
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm">
            <p className="font-medium text-amber-500 mb-2">📍 Kam prilepiti kodo?</p>
            <p className="text-muted-foreground">
              Kodo prilepite pred zaključni <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag na vaši spletni strani.
            </p>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4 text-sm">
            <p className="text-muted-foreground mb-3">
              Embed koda bo vedno prikazana na dashboardu. Če potrebujete pomoč pri nastavitvi:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href="mailto:info@botmotion.ai" 
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                info@botmotion.ai
              </a>
              <a 
                href="tel:+38641353600" 
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                +386 41 353 600
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
