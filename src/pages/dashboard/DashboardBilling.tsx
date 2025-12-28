import { CreditCard } from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function DashboardBilling() {
  const { loading } = useWidget();

  if (loading) {
    return (
      <DashboardLayout title="Računi" subtitle="Zgodovina plačil in upravljanje naročnine">
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Računi" subtitle="Zgodovina plačil in upravljanje naročnine">
      <div className="glass rounded-2xl p-6 animate-slide-up">
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-foreground mb-2">Vaši računi</p>
          <p>Zgodovina plačil in upravljanje naročnine bo kmalu na voljo.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
