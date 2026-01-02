import { DashboardSidebar } from '@/components/DashboardSidebar';

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  return (
    <DashboardSidebar>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {children}
      </div>
    </DashboardSidebar>
  );
}
