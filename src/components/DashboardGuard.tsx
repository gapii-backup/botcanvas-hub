import { Navigate } from 'react-router-dom';
import { useUserBot } from '@/hooks/useUserBot';
import { Loader2 } from 'lucide-react';

interface DashboardGuardProps {
  children: React.ReactNode;
}

export function DashboardGuard({ children }: DashboardGuardProps) {
  const { userBot, loading } = useUserBot();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if wizard is complete - status should be 'active' or bot_name should be set
  const isWizardComplete = userBot?.status === 'active' || (userBot?.bot_name && userBot?.welcome_message);

  if (!isWizardComplete) {
    // Redirect to customize if wizard not complete
    return <Navigate to="/customize" replace />;
  }

  return <>{children}</>;
}
