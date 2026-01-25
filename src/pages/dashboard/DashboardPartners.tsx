import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { usePartner, TIERS, TierInfo } from '@/hooks/usePartner';
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
  Trophy,
  Euro,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
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
    referrals,
    loading,
    activeReferralsCount,
    totalCommission,
    currentTier,
    nextTierInfo,
    pendingPayouts,
    requestedPayouts,
    paidPayouts,
    requestPayout,
  } = usePartner();

  const [copied, setCopied] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  // Redirect if not a partner
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

  const handleRequestPayout = (referralId: string) => {
    setSelectedReferralId(referralId);
    setPayoutDialogOpen(true);
  };

  const confirmPayout = async () => {
    if (!selectedReferralId) return;

    setIsRequestingPayout(true);
    await requestPayout(selectedReferralId);
    setIsRequestingPayout(false);
    setPayoutDialogOpen(false);
    setSelectedReferralId(null);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d. MMM yyyy", { locale: sl });
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString('sl-SI')}`;
  };

  // Calculate progress to next tier
  const calculateProgress = () => {
    if (!nextTierInfo) return 100;
    const currentTierIndex = TIERS.findIndex(t => t.name === currentTier.name);
    const currentMin = TIERS[currentTierIndex].min;
    const nextMin = nextTierInfo.tier.min;
    const progress = ((activeReferralsCount - currentMin + 1) / (nextMin - currentMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
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

  if (!partner) {
    return null;
  }

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
          {/* Active Customers */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktivne stranke</p>
                  <p className="text-3xl font-bold">{activeReferralsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Tier */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vaš tier</p>
                  <p className="text-2xl font-bold">
                    {currentTier.name} {currentTier.emoji}
                  </p>
                  {nextTierInfo && (
                    <p className="text-xs text-muted-foreground">
                      Še {nextTierInfo.remaining} strank do {nextTierInfo.tier.name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Earnings */}
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
        </div>

        {/* Tier Progress Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Vaš napredek</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentTier.name} {currentTier.emoji}</span>
                {nextTierInfo && (
                  <span>{nextTierInfo.tier.name} {nextTierInfo.tier.emoji}</span>
                )}
              </div>
              <Progress value={calculateProgress()} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                {activeReferralsCount} aktivnih strank
                {nextTierInfo && ` · Še ${nextTierInfo.remaining} do naslednjega tiera`}
              </p>
            </div>

            {/* Tier Visual */}
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {TIERS.map((tier, index) => {
                const isCurrentTier = tier.name === currentTier.name;
                const isPastTier = TIERS.findIndex(t => t.name === currentTier.name) > index;
                return (
                  <div
                    key={tier.name}
                    className={cn(
                      "flex flex-col items-center gap-1 px-2 min-w-[60px]",
                      isCurrentTier && "scale-110"
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-lg",
                        isCurrentTier
                          ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : isPastTier
                          ? "bg-muted-foreground/20 text-muted-foreground"
                          : "bg-muted text-muted-foreground/50"
                      )}
                    >
                      {tier.emoji}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isCurrentTier ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {tier.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bonus Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Stranke</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TIERS.map((tier) => {
                    const bonusClaimed = partner[tier.bonusField as keyof typeof partner];
                    const rangeText = tier.max === Infinity ? `${tier.min}+` : `${tier.min}-${tier.max}`;
                    return (
                      <TableRow key={tier.name}>
                        <TableCell className="font-medium">
                          {tier.name} {tier.emoji}
                        </TableCell>
                        <TableCell>{rangeText}</TableCell>
                        <TableCell>
                          {tier.bonus > 0 ? formatCurrency(tier.bonus) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {tier.bonus > 0 && bonusClaimed && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                              ✓ Izplačano
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
            {referrals.length === 0 ? (
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stranka</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Provizija</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Datum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell className="font-medium">
                          {referral.customer_name || '—'}
                        </TableCell>
                        <TableCell>{referral.customer_email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              referral.plan === 'enterprise' && 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                              referral.plan === 'pro' && 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                              referral.plan === 'basic' && 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            )}
                          >
                            {referral.plan.charAt(0).toUpperCase() + referral.plan.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(referral.commission_amount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              referral.status === 'active'
                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                            )}
                          >
                            {referral.status === 'active' ? 'Aktiven' : 'Neaktiven'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDate(referral.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payouts Section */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Zahtevki za izplačilo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pending Payouts (can request) */}
            {pendingPayouts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Na voljo za izplačilo
                </h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stranka</TableHead>
                        <TableHead>Provizija</TableHead>
                        <TableHead className="text-right">Akcija</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayouts.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell>{referral.customer_email}</TableCell>
                          <TableCell>{formatCurrency(referral.commission_amount)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestPayout(referral.id)}
                            >
                              Zahtevaj izplačilo
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Requested Payouts */}
            {requestedPayouts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Čaka na izplačilo
                </h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stranka</TableHead>
                        <TableHead>Provizija</TableHead>
                        <TableHead>Zahtevano</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requestedPayouts.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell>{referral.customer_email}</TableCell>
                          <TableCell>{formatCurrency(referral.commission_amount)}</TableCell>
                          <TableCell>
                            {referral.invoice_requested_at
                              ? formatDate(referral.invoice_requested_at)
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className="bg-amber-500/10 text-amber-500 border-amber-500/20"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Čaka na izplačilo
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Paid Payouts */}
            {paidPayouts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Izplačano</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stranka</TableHead>
                        <TableHead>Provizija</TableHead>
                        <TableHead>Izplačano</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidPayouts.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell>{referral.customer_email}</TableCell>
                          <TableCell>{formatCurrency(referral.commission_amount)}</TableCell>
                          <TableCell>
                            {referral.invoice_paid_at
                              ? formatDate(referral.invoice_paid_at)
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className="bg-green-500/10 text-green-500 border-green-500/20"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Izplačano
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {pendingPayouts.length === 0 &&
              requestedPayouts.length === 0 &&
              paidPayouts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Še nimate provizij za izplačilo.</p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Payout Confirmation Dialog */}
      <AlertDialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potrdi zahtevek za izplačilo</AlertDialogTitle>
            <AlertDialogDescription>
              Ali ste prepričani, da želite zahtevati izplačilo za to provizijo?
              Po oddaji zahtevka boste prejeli e-pošto z navodili za račun.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRequestingPayout}>Prekliči</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPayout} disabled={isRequestingPayout}>
              {isRequestingPayout ? 'Pošiljam...' : 'Potrdi zahtevek'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardSidebar>
  );
}
