import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Code, Copy, HelpCircle } from 'lucide-react';
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
  const navigate = useNavigate();

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
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg mx-auto">
        <DialogHeader className="text-center space-y-4 flex flex-col items-center">
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Code className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <DialogTitle className="text-lg sm:text-2xl font-bold text-foreground text-center w-full">
            Naročnina aktivirana! 🎉
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs sm:text-base text-center w-full">
            Kopirajte embed kodo in jo prilepite na vašo spletno stran
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border border-border/50">
            <code className="text-[10px] sm:text-sm font-mono text-foreground break-all leading-relaxed">
              {embedCode}
            </code>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
            <Button onClick={copyEmbedCode} className="w-full sm:w-auto h-10 sm:h-11 text-sm">
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Kopirano!' : 'Kopiraj kodo'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                navigate('/dashboard/docs');
              }}
              className="w-full sm:w-auto h-10 sm:h-11 text-sm"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Potrebujete pomoč?
            </Button>
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 sm:p-4 text-xs sm:text-sm">
            <p className="font-medium text-amber-500 mb-1 sm:mb-2">📍 Kam prilepiti kodo?</p>
            <p className="text-muted-foreground">
              Kodo prilepite pred zaključni <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag na vaši spletni strani.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
