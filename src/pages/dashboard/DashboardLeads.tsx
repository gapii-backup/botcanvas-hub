import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, ExternalLink } from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { useLeads } from '@/hooks/useLeads';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function DashboardLeads() {
  const navigate = useNavigate();
  const { widget, loading } = useWidget();
  const tableName = widget?.table_name;
  const { leads, loading: leadsLoading } = useLeads(tableName);
  const hasContactsAddon = Array.isArray(widget?.addons) && widget.addons.includes('contacts');

  if (loading || leadsLoading) {
    return (
      <DashboardLayout title="Leads" subtitle="Zbrani kontakti iz pogovorov">
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Leads" subtitle="Zbrani kontakti iz pogovorov">
      <div className="glass rounded-2xl p-6 animate-slide-up">
        {hasContactsAddon ? (
          leads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.slice(0, 10).map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.email || '-'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {lead.session_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(lead.created_at).toLocaleDateString('sl-SI')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Še ni zbranih kontaktov
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Lock className="h-5 w-5" />
              <span>🔒 Odklenite zbiranje kontaktov z nadgradnjo paketa</span>
            </div>
            <Button onClick={() => navigate('/pricing')}>
              Nadgradi
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
