import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminWidgets } from '@/hooks/useAdminWidgets';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminWidgets() {
  const { widgets, loading, updateWidgetById } = useAdminWidgets();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredWidgets = widgets.filter((widget) => {
    const matchesSearch =
      widget.user_email.toLowerCase().includes(search.toLowerCase()) ||
      (widget.bot_name?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && widget.is_active) ||
      (statusFilter === 'pending' && (widget.status === 'pending' || widget.status === 'pending_payment'));

    return matchesSearch && matchesStatus;
  });

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    try {
      await updateWidgetById(id, { is_active: !currentValue });
      toast.success('Status posodobljen');
    } catch (error) {
      toast.error('Napaka pri posodabljanju');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Widgets</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Išči po email ali imenu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter po statusu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vsi</SelectItem>
              <SelectItem value="active">Aktivni</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Bot Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktiven</TableHead>
                <TableHead>Ustvarjen</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWidgets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Ni widgetov.
                  </TableCell>
                </TableRow>
              ) : (
                filteredWidgets.map((widget) => (
                  <TableRow key={widget.id}>
                    <TableCell className="font-medium">{widget.user_email}</TableCell>
                    <TableCell>{widget.bot_name || '-'}</TableCell>
                    <TableCell>
                      <span className="capitalize">{widget.plan || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          widget.status === 'active'
                            ? 'bg-green-500/20 text-green-500'
                            : widget.status === 'pending_payment'
                            ? 'bg-orange-500/20 text-orange-500'
                            : 'bg-yellow-500/20 text-yellow-500'
                        }`}
                      >
                        {widget.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={widget.is_active}
                        onCheckedChange={() => handleToggleActive(widget.id, widget.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(widget.created_at), 'dd. MMM yyyy', { locale: sl })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/widgets/${widget.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-muted-foreground">
          Prikazujem {filteredWidgets.length} od {widgets.length} widgetov
        </p>
      </div>
    </AdminLayout>
  );
}
