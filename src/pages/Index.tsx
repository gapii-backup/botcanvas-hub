import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWidget } from '@/hooks/useWidget';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { widget, loading: widgetLoading } = useWidget();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || widgetLoading) return;

    if (!user) {
      navigate('/register');
      return;
    }

    // User is logged in - check widget status
    // 1. Partners skip onboarding and go directly to dashboard
    if (widget?.is_partner === true) {
      navigate('/dashboard');
      return;
    }
    
    // 2. Regular users with active subscription go to dashboard
    if (widget?.subscription_status === 'active') {
      navigate('/dashboard');
      return;
    }
    
    // 3. Otherwise normal flow (onboarding/pricing)
    if (!widget?.plan) {
      navigate('/pricing');
    } else if (widget.status === 'pending_payment') {
      navigate('/customize/complete');
    } else if (['active', 'setup_paid', 'sub_paid', 'cancelling'].includes(widget.status)) {
      navigate('/dashboard');
    } else {
      navigate('/pricing');
    }
  }, [user, widget, authLoading, widgetLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
