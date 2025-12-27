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
    if (!widget?.plan) {
      navigate('/pricing');
    } else if (widget.status === 'pending_payment') {
      navigate('/customize/complete');
    } else if (widget.status === 'active') {
      navigate('/dashboard');
    } else {
      // Pending or other status - go to customize
      navigate('/customize/step-1');
    }
  }, [user, widget, authLoading, widgetLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
