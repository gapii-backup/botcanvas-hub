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
      // Plan is set but widget isn't fully activated/customization flow isn't finished yet
      navigate('/pricing');
    }
  }, [user, widget, authLoading, widgetLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
