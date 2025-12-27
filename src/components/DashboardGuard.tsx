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

  // No plan selected - redirect to pricing
  if (!widget.plan) {
    return <Navigate to="/pricing" replace />;
  }

  // Has plan but pending payment - redirect to complete
  if (widget.status === 'pending_payment') {
    return <Navigate to="/customize/complete" replace />;
  }

  // Widget is active or pending - allow access
  if (widget.status === 'active' || widget.status === 'pending') {
    return <>{children}</>;
  }

  // Default - redirect to pricing
  return <Navigate to="/pricing" replace />;
}
