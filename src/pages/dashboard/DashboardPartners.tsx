import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { usePartner, MILESTONES, PartnerCommission, PartnerCustomer } from '@/hooks/usePartner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Gift,
  Copy,
  Check,
  Users,
  Euro,
  FileText,
  Clock,
  CheckCircle2,
  Info,
  FileCheck,
} from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';

export default function DashboardPartners() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    partner,
    customers,
    commissions,
    loading,
    activeCustomersCount,
    totalCommission,
    pendingPayoutAmount,
    requestPayout,
  } = usePartner();

  const [copied, setCopied] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<PartnerCommission | null>(null);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  // Pagination states
  const [commissionsPage, setCommissionsPage] = useState(1);
  const [customersPage, setCustomersPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (!loading && !partner) {
      navigate('/dashboard');
    }
  }, [loading, partner, navigate]);

  const handleCopyCode = async () => {
    if (partner?.promo_code) {
      await navigator.clipboard.writeText(partner.promo_code);
      setCopied(true);
      toast({
        title: 'Koda kopirana!',
        description: 'Koda kopirana v odložišče!',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRequestPayout = (commission: PartnerCommission) => {
    setSelectedCommission(commission);
    setPayoutDialogOpen(true);
  };

  const confirmPayout = async () => {
    if (!selectedCommission) return;
    setIsRequestingPayout(true);
    await requestPayout(selectedCommission.id);
    setIsRequestingPayout(false);
    setPayoutDialogOpen(false);
    setSelectedCommission(null);
    toast({
      title: 'Zahtevek oddan!',
      description: 'Izplačilo boste prejeli v roku 14 dneh.',
    });
  };

  // Pagination
  const commissionsTotalPages = Math.ceil(commissions.length / ITEMS_PER_PAGE);
  const paginatedCommissions = commissions.slice(
    (commissionsPage - 1) * ITEMS_PER_PAGE,
    commissionsPage * ITEMS_PER_PAGE
  );

  const customersTotalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = customers.slice(
    (customersPage - 1) * ITEMS_PER_PAGE,
    customersPage * ITEMS_PER_PAGE
  );

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d. MMM yyyy", { locale: sl });
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString('sl-SI', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const getCustomerName = (commission: PartnerCommission): string => {
    if (commission.type === 'milestone') {
      const milestoneLabels: Record<string, string> = {
        '3_customers': 'Bonus: 3 stranke dosežene',
        '10_customers': 'Bonus: 10 strank doseženih',
        '25_customers': 'Bonus: 25 strank doseženih',
      };
      return milestoneLabels[commission.milestone_type || ''] || 'Milestone bonus';
    }
    if (commission.partner_customer_id) {
      const customer = customers.find(c => c.id === commission.partner_customer_id);
      return customer?.customer_name || customer?.customer_email || '—';
    }
    return '—';
  };

  const getMilestoneLabel = (type: string | null): string => {
    const labels: Record<string, string> = {
      '3_customers': '3 stranke',
      '10_customers': '10 strank',
      '25_customers': '25 strank',
    };
    return labels[type || ''] || 'Milestone';
  };

  if (loading) {
    return (
      <DashboardSidebar>
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardSidebar>
    );
  }

  if (!partner) return null;

  return (
    <DashboardSidebar>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">
            Dobrodošli, {partner.name}! 👋
          </h1>
          <p className="text-muted-foreground">
            Tukaj lahko spremljate uspešnost vašega partnerstva
          </p>
          {partner.company && (
            <p className="text-sm text-muted-foreground">
              Partner: <span className="font-medium">{partner.company}</span>
            </p>
          )}
        </div>

        {/* Promo Code Card */}
        <Card className="relative overflow-hidden border-2 border-transparent bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-20" />
          <CardContent className="relative p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0">
                <Gift className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-lg font-semibold">Vaša ekskluzivna promo koda</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="px-6 py-3 border-2 border-dashed border-primary/50 rounded-lg bg-card">
                    <span className="font-mono text-xl md:text-2xl font-bold tracking-wider">
                      {partner.promo_code || 'N/A'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="gap-2"
                    disabled={!partner.promo_code}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        Kopirano!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Kopiraj kodo
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <span>💡</span>
                  <span>Vaše stranke prejmejo 20% popusta na setup fee ko uporabijo vašo kodo</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktivne stranke</p>
                  <p className="text-3xl font-bold">{activeCustomersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Euro className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Zasluženo skupaj</p>
                  <p className="text-3xl font-bold">{formatCurrency(totalCommission)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Čaka na izplačilo</p>
                  <p className="text-3xl font-bold">{formatCurrency(pendingPayoutAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Milestone Progress Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Milestone bonusi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MILESTONES.map((milestone) => {
                const claimed = partner[milestone.key as keyof typeof partner] as boolean;
                const reached = activeCustomersCount >= milestone.count;
                const progress = Math.min((activeCustomersCount / milestone.count) * 100, 100);

                return (
                  <Card
                    key={milestone.key}
                    className={cn(
                      "border",
                      (claimed || reached) 
                        ? "border-green-500/30 bg-green-500/5" 
                        : "border-border/50"
                    )}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{milestone.emoji}</span>
                        <span className="text-lg font-bold">{formatCurrency(milestone.bonus)}</span>
                      </div>
                      <p className="font-medium">{milestone.label}</p>
                      {(claimed || reached) ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Dosežen
                        </Badge>
                      ) : (
                        <div className="space-y-2">
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {activeCustomersCount}/{milestone.count}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Milestone bonusi se avtomatsko dodelijo ko dosežete zadostno število aktivnih strank. Bonus se pojavi kot provizija v tabeli spodaj.</span>
            </div>
          </CardContent>
        </Card>

        {/* Commissions Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Provizije
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-600 dark:text-blue-400">Kako poteka izplačilo?</h4>
                  <div className="text-sm text-muted-foreground space-y-3">
                    <p>1. Izdajte račun za provizije na naslednje podatke:</p>
                    <div className="bg-background/50 rounded p-3 font-mono text-xs">
                      <p className="font-semibold">Gašper Perko s.p.</p>
                      <p>Zalog 2, 4204 Golnik</p>
                      <p>Slovenija</p>
                      <p>Davčna št.: 24429295</p>
                    </div>
                    <p>2. Račun pošljite na: <a href="mailto:info@botmotion.ai" className="font-medium text-primary hover:underline">info@botmotion.ai</a></p>
                    <p>3. Ko prejmemo račun, kliknite 'Zahtevaj izplačilo' pri ustreznih provizijah</p>
                    <p>4. Izplačilo prejmete v roku 14 dneh</p>
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ Če ste DDV zavezanec, k proviziji prištejte 22% DDV.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {commissions.length > 0 ? (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tip</TableHead>
                        <TableHead className="hidden md:table-cell">Stranka</TableHead>
                        <TableHead>Znesek</TableHead>
                        <TableHead className="hidden md:table-cell">Status</TableHead>
                        <TableHead className="text-right">Akcija</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCommissions.map((commission) => {
                        const isMilestone = commission.type === 'milestone';
                        return (
                          <TableRow
                            key={commission.id}
                            className={cn(
                              isMilestone && "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-l-[3px] border-l-amber-500"
                            )}
                          >
                            <TableCell>
                              {isMilestone ? (
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
                            <TableCell className="hidden md:table-cell font-medium">
                              {isMilestone ? (
                                <div className="flex items-center gap-2">
                                  <Gift className="h-4 w-4 text-amber-500" />
                                  <span>{getCustomerName(commission)}</span>
                                </div>
                              ) : (
                                getCustomerName(commission)
                              )}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(commission.amount)}
                              <div className="md:hidden text-xs text-muted-foreground font-normal mt-0.5">
                                {getCustomerName(commission)}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {commission.invoice_paid ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Izplačano
                                </Badge>
                              ) : commission.invoice_requested ? (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Čaka na izplačilo
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-muted text-muted-foreground">
                                  Na voljo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {!commission.invoice_requested && !commission.invoice_paid && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRequestPayout(commission)}
                                  className="text-xs md:text-sm"
                                >
                                  <span className="hidden md:inline">Zahtevaj izplačilo</span>
                                  <span className="md:hidden">Zahtevaj</span>
                                </Button>
                              )}
                              {commission.invoice_requested && !commission.invoice_paid && (
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Čaka
                                  </Badge>
                                  {commission.invoice_requested_at && (
                                    <span className="text-xs text-muted-foreground hidden md:block">
                                      {formatDate(commission.invoice_requested_at)}
                                    </span>
                                  )}
                                </div>
                              )}
                              {commission.invoice_paid && (
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Izplačano
                                  </Badge>
                                  {commission.invoice_paid_at && (
                                    <span className="text-xs text-muted-foreground hidden md:block">
                                      {formatDate(commission.invoice_paid_at)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {commissionsTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">
                      Stran {commissionsPage} od {commissionsTotalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCommissionsPage(p => Math.max(1, p - 1))}
                        disabled={commissionsPage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prejšnja
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCommissionsPage(p => Math.min(commissionsTotalPages, p + 1))}
                        disabled={commissionsPage === commissionsTotalPages}
                        className="gap-1"
                      >
                        Naslednja
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Še nimate provizij.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vaše stranke
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Še nimate strank</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Delite vašo promo kodo potencialnim strankam in začnite služiti!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ime</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead>Paket</TableHead>
                        <TableHead className="hidden md:table-cell">Billing</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Meseci</TableHead>
                        <TableHead className="text-right">Datum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">
                            {customer.customer_name || '—'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {customer.customer_email}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                customer.plan === 'enterprise' && 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                                customer.plan === 'pro' && 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                                customer.plan === 'basic' && 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                              )}
                            >
                              {customer.plan.charAt(0).toUpperCase() + customer.plan.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {customer.billing_period === 'yearly' ? 'Letno' : 'Mesečno'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                customer.status === 'active' && 'bg-green-500/10 text-green-500 border-green-500/20',
                                customer.status === 'pending' && 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                                customer.status === 'cancelled' && 'bg-red-500/10 text-red-500 border-red-500/20'
                              )}
                            >
                              {customer.status === 'active' ? 'Aktiven' : customer.status === 'pending' ? 'V čakanju' : 'Preklican'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {customer.months_covered}/{customer.max_months}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDate(customer.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {customersTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">
                      Stran {customersPage} od {customersTotalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomersPage(p => Math.max(1, p - 1))}
                        disabled={customersPage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prejšnja
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomersPage(p => Math.min(customersTotalPages, p + 1))}
                        disabled={customersPage === customersTotalPages}
                        className="gap-1"
                      >
                        Naslednja
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payout Confirmation Dialog */}
      <AlertDialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <AlertDialogTitle className="mb-0">Potrdite zahtevek za izplačilo</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-amber-600 dark:text-amber-400 font-medium">
                  Zahtevek oddajte SAMO če ste že poslali račun za to provizijo na info@botmotion.ai
                </p>

                {selectedCommission && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-foreground">
                      {getCustomerName(selectedCommission)} — {formatCurrency(selectedCommission.amount)}
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRequestingPayout}>Prekliči</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPayout}
              disabled={isRequestingPayout}
            >
              {isRequestingPayout ? 'Pošiljam...' : 'Potrdi zahtevek'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardSidebar>
  );
}
