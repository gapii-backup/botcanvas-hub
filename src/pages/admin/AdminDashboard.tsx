import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminWidgets } from '@/hooks/useAdminWidgets';
import { Package, CheckCircle, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';

export default function AdminDashboard() {
  const { widgets, loading } = useAdminWidgets();

  const totalWidgets = widgets.length;
  const activeWidgets = widgets.filter(w => w.is_active).length;
  const pendingWidgets = widgets.filter(w => w.status === 'pending' || w.status === 'pending_payment').length;
  const recentWidgets = widgets.slice(0, 5);

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
        <h1 className="text-2xl font-bold">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vsi Widgeti
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalWidgets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktivni Widgeti
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{activeWidgets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Widgeti
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{pendingWidgets}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Zadnje registracije
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentWidgets.length === 0 ? (
              <p className="text-muted-foreground text-sm">Ni registracij.</p>
            ) : (
              <div className="space-y-3">
                {recentWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{widget.user_email}</p>
                      <p className="text-sm text-muted-foreground">
                        {widget.bot_name || 'Brez imena'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {format(new Date(widget.created_at), 'dd. MMM yyyy', { locale: sl })}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          widget.is_active
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-yellow-500/20 text-yellow-500'
                        }`}
                      >
                        {widget.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
