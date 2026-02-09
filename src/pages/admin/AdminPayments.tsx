import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAdminPayments } from '@/hooks/useAdminPayments';
import {
  CreditCard,
  Loader2,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  PartyPopper,
  Gift,
} from 'lucide-react';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';

export default function AdminPayments() {
  const {
    partnersWithUnpaid,
    stats,
    isLoading,
    markAsPaid,
    markAllAsPaid,
  } = useAdminPayments();

  const [openPartners, setOpenPartners] = useState<Set<string>>(new Set());
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sl-SI', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const togglePartner = (partnerId: string) => {
    setOpenPartners((prev) => {
      const next = new Set(prev);
      if (next.has(partnerId)) {
        next.delete(partnerId);
      } else {
        next.add(partnerId);
      }
      return next;
    });
  };

  const handleMarkAsPaid = async (commissionId: string) => {
    setLoadingActions((prev) => new Set(prev).add(commissionId));
    await markAsPaid(commissionId);
    setLoadingActions((prev) => {
      const next = new Set(prev);
      next.delete(commissionId);
      return next;
    });
  };

  const handleMarkAllAsPaid = async (partnerId: string) => {
    setLoadingActions((prev) => new Set(prev).add(`all-${partnerId}`));
    await markAllAsPaid(partnerId);
    setLoadingActions((prev) => {
      const next = new Set(prev);
      next.delete(`all-${partnerId}`);
      return next;
    });
  };

  const getMilestoneLabel = (milestoneType: string | null) => {
    const labels: Record<string, string> = {
      '3_customers': 'Milestone: 3 stranke',
      '10_customers': 'Milestone: 10 strank',
      '25_customers': 'Milestone: 25 strank',
    };
    return labels[milestoneType || ''] || 'Milestone';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Plačila</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Za plačilo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-500">
                {formatCurrency(stats.forPayment)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Plačano skupaj
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(stats.totalPaid)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Čakajo na zahtevek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-muted-foreground">
                {formatCurrency(stats.waitingForRequest)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Partners with unpaid commissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Neplačani zahtevki
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : partnersWithUnpaid.length === 0 ? (
              <div className="text-center py-12">
                <PartyPopper className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium text-green-500">
                  Ni neplačanih zahtevkov 🎉
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Vsi zahtevki za plačilo so bili obdelani.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {partnersWithUnpaid.map((partner) => (
                  <Collapsible
                    key={partner.id}
                    open={openPartners.has(partner.id)}
                    onOpenChange={() => togglePartner(partner.id)}
                  >
                    <div className="border border-border rounded-lg overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8">
                              {openPartners.has(partner.id) ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{partner.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {partner.email}
                                {partner.company && ` • ${partner.company}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Skupaj za plačilo
                              </p>
                              <p className="font-bold text-orange-500">
                                {formatCurrency(partner.totalUnpaid)}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {partner.commissions.length}{' '}
                              {partner.commissions.length === 1 ? 'zahtevek' : 'zahtevkov'}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAllAsPaid(partner.id);
                              }}
                              disabled={loadingActions.has(`all-${partner.id}`)}
                            >
                              {loadingActions.has(`all-${partner.id}`) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Check className="h-4 w-4 mr-2" />
                              )}
                              Plačaj vse
                            </Button>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/20">
                              <TableHead>Tip</TableHead>
                              <TableHead>Stranka</TableHead>
                              <TableHead className="text-right">Provizija</TableHead>
                              <TableHead>Zahtevano dne</TableHead>
                              <TableHead className="text-center">Akcija</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {partner.commissions.map((commission) => (
                              <TableRow key={commission.id}>
                                <TableCell>
                                  {commission.type === 'milestone' ? (
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                      <Gift className="h-3 w-3 mr-1" />
                                      Milestone
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                      Recurring
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {commission.type === 'milestone'
                                    ? getMilestoneLabel(commission.milestone_type)
                                    : commission.customer_name || commission.customer_email || '—'}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(commission.amount)}
                                </TableCell>
                                <TableCell>
                                  {commission.invoice_requested_at
                                    ? format(
                                        new Date(commission.invoice_requested_at),
                                        'dd. MMM yyyy',
                                        { locale: sl }
                                      )
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkAsPaid(commission.id)}
                                    disabled={loadingActions.has(commission.id)}
                                  >
                                    {loadingActions.has(commission.id) ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Označi kot plačano
                                      </>
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
