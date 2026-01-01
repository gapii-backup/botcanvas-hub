import { Navigate } from 'react-router-dom';
import { useWidget } from '@/hooks/useWidget';
import { Loader2 } from 'lucide-react';

interface DashboardGuardProps {
  children: React.ReactNode;
}

export function DashboardGuard({ children }: DashboardGuardProps) {
  const { widget, loading } = useWidget();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No widget exists - redirect to pricing
  if (!widget) {
    return <Navigate to="/pricing" replace />;
  }

  // Partner users - skip all checks, go directly to dashboard
  if (widget.is_partner === true) {
    return <>{children}</>;
  }

  // Regular users with active subscription - allow access
  if (widget.subscription_status === 'active') {
    return <>{children}</>;
  }

  // No plan selected - redirect to pricing
  if (!widget.plan) {
    return <Navigate to="/pricing" replace />;
  }

  // Has plan but pending payment - redirect to complete
  if (widget.status === 'pending_payment') {
    return <Navigate to="/customize/complete" replace />;
  }

  // Widget is active, setup_paid, sub_paid, or cancelling - allow access
  // Note: 'pending' status is NOT allowed - user must complete setup and pay first
  if (['active', 'setup_paid', 'sub_paid', 'cancelling'].includes(widget.status)) {
    return <>{children}</>;
  }

  // Default - redirect to pricing
  return <Navigate to="/pricing" replace />;
}
