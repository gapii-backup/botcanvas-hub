import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function AccountDeactivatedLock() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <XCircle className="w-10 h-10 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">
        Vaš račun je deaktiviran
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Prosim kupite svoj paket.
      </p>
      <Button 
        onClick={() => navigate('/dashboard/upgrade')}
        variant="default"
      >
        Izberi paket
      </Button>
    </div>
  );
}
