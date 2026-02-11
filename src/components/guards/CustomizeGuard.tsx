import { Navigate } from 'react-router-dom';
import { useWidget } from '@/hooks/useWidget';
import { Loader2 } from 'lucide-react';

interface CustomizeGuardProps {
  children: React.ReactNode;
}

export function CustomizeGuard({ children }: CustomizeGuardProps) {
  const { widget, loading } = useWidget();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Partner users - redirect to dashboard
  if (widget?.is_partner === true) {
    return <Navigate to="/dashboard" replace />;
  }

  // If widget is already active, setup is paid, or cancelling, redirect to dashboard
  if (widget?.status && ['active', 'setup_paid', 'sub_paid', 'cancelling'].includes(widget.status)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if plan was selected (from localStorage OR from existing widget)
  const selectedPlan = widget?.plan || localStorage.getItem('botmotion_selected_plan');
  if (!selectedPlan) {
    return <Navigate to="/pricing" replace />;
  }

  // Has plan, not active - allow access to customize
  return <>{children}</>;
}
