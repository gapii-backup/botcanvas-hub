import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function PartnerBlockedLock() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">
        Stran ni na voljo
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Ta funkcionalnost ni na voljo za partnerske račune. Za več informacij kontaktirajte administratorja.
      </p>
      <Button 
        onClick={() => navigate('/dashboard')}
        variant="default"
      >
        Nazaj na dashboard
      </Button>
    </div>
  );
}
