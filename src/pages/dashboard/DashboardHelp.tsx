import { HelpCircle, Mail } from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function DashboardHelp() {
  const { loading } = useWidget();

  if (loading) {
    return (
      <DashboardLayout title="Pomoč" subtitle="Kontaktne informacije in podpora">
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pomoč" subtitle="Kontaktne informacije in podpora">
      <div className="glass rounded-2xl p-6 animate-slide-up">
        <div className="space-y-6">
          <div className="text-center py-8">
            <Mail className="h-12 w-12 mx-auto mb-4 text-primary opacity-75" />
            <p className="text-lg font-medium text-foreground mb-2">Potrebujete pomoč?</p>
            <p className="text-muted-foreground mb-4">Kontaktirajte nas na</p>
            <a 
              href="mailto:info@botmotion.ai" 
              className="text-primary hover:underline text-lg font-medium"
            >
              info@botmotion.ai
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
