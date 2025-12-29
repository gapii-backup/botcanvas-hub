import { Navigate } from 'react-router-dom';
import { useWidget } from '@/hooks/useWidget';
import { Loader2 } from 'lucide-react';

interface PricingGuardProps {
  children: React.ReactNode;
}

export function PricingGuard({ children }: PricingGuardProps) {
  const { widget, loading } = useWidget();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If widget is already active, setup_paid, sub_paid, or cancelling, redirect to dashboard
  if (widget?.status && ['active', 'setup_paid', 'sub_paid', 'cancelling'].includes(widget.status)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If payment is pending, continue the flow on the Complete step
  if (widget?.status === 'pending_payment') {
    return <Navigate to="/customize/complete" replace />;
  }

  // Otherwise, always allow access to pricing
  return <>{children}</>;
}
