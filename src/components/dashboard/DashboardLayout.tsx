import { useLocation } from 'react-router-dom';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useWidget } from '@/hooks/useWidget';

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  const location = useLocation();
  const { widget } = useWidget();
  const hasContactsAddon = Array.isArray(widget?.addons) && widget.addons.includes('contacts');

  return (
    <DashboardSidebar hasContactsAddon={hasContactsAddon}>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {children}
      </div>
    </DashboardSidebar>
  );
}
