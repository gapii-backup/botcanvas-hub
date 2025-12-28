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

  // If no widget or no plan selected, redirect to pricing
  if (!widget?.plan) {
    return <Navigate to="/pricing" replace />;
  }

  // If widget is already active or setup is paid, redirect to dashboard
  if (widget.status === 'active' || widget.status === 'setup_paid') {
    return <Navigate to="/dashboard" replace />;
  }

  // Has plan, not active - allow access to customize
  return <>{children}</>;
}
