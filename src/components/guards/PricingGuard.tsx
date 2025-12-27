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

  // If user already has a plan, redirect appropriately
  if (widget?.plan) {
    if (widget.status === 'active') {
      return <Navigate to="/dashboard" replace />;
    }
    // Has plan but not active - go to customize
    return <Navigate to="/customize/step-0" replace />;
  }

  // No plan yet - allow access to pricing
  return <>{children}</>;
}
