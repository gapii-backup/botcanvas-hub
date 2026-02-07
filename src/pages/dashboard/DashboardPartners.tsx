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
  const [selectedReferral, setSelectedReferral] = useState<typeof referrals[0] | null>(null);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  
  // Pagination states
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [customersPage, setCustomersPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  const handleRequestPayout = (referral: typeof referrals[0]) => {
    setSelectedReferral(referral);
    setPayoutDialogOpen(true);
  };

  const confirmPayout = async () => {
    if (!selectedReferral) return;

    setIsRequestingPayout(true);
    await requestPayout(selectedReferral.id);
    setIsRequestingPayout(false);
    setPayoutDialogOpen(false);
    setSelectedReferral(null);
    toast({
      title: 'Zahtevek oddan!',
      description: 'Izplačilo boste prejeli v roku 14 dneh.',
    });
  };

  // Sort and paginate data
  // Sort all referrals by created_at DESC for payouts table
  const sortedPayoutReferrals = [...referrals].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const sortedReferrals = [...referrals].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  // Payouts table pagination
  const payoutsTotalPages = Math.ceil(sortedPayoutReferrals.length / ITEMS_PER_PAGE);
  const paginatedPayoutReferrals = sortedPayoutReferrals.slice(
    (payoutsPage - 1) * ITEMS_PER_PAGE,
    payoutsPage * ITEMS_PER_PAGE
  );
  
  // Customers table pagination
  const customersTotalPages = Math.ceil(sortedReferrals.length / ITEMS_PER_PAGE);
  const paginatedReferrals = sortedReferrals.slice(
    (customersPage - 1) * ITEMS_PER_PAGE,
    customersPage * ITEMS_PER_PAGE
  );

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d. MMM yyyy", { locale: sl });
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString('sl-SI')}`;
  };

  // Check if referral is a bonus row
  const isBonusRow = (referral: typeof referrals[0]) => {
    return referral.plan === 'bonus' || referral.customer_email === 'BONUS';
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
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-lg font-semibold">
                    {currentTier.emoji} {currentTier.name}
                  </span>
                </div>
                <div className="text-right">
                  {nextTierInfo ? (
                    <div>
                      <span className="text-lg font-semibold">
                        {nextTierInfo.tier.emoji} {nextTierInfo.tier.name}
                      </span>
                      {nextTierInfo.tier.bonus > 0 && (
                        <span className="text-sm text-muted-foreground ml-2">
                          · Bonus €{nextTierInfo.tier.bonus.toLocaleString('sl-SI')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-lg font-semibold text-green-500">
                      ✨ Maksimalni tier dosežen!
                    </span>
                  )}
                </div>
              </div>
              <Progress value={calculateProgress()} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                {activeReferralsCount} aktivnih strank
                {nextTierInfo && ` · Še ${nextTierInfo.remaining} do naslednjega tiera`}
              </p>
            </div>

            {/* Bonus Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tier</TableHead>
                    <TableHead>Aktivni chatboti</TableHead>
                    <TableHead className="text-right font-mono">Basic</TableHead>
                    <TableHead className="text-right font-mono">Pro</TableHead>
                    <TableHead className="text-right font-mono">Enterprise</TableHead>
                    <TableHead className="text-right font-mono">Enkratni bonus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: 'Bronze', emoji: '🟤', range: '1-10', basic: 60, pro: 120, enterprise: 280, bonus: 0, bonusField: 'bonus_bronze_claimed' },
                    { name: 'Silver', emoji: '⚪', range: '11-25', basic: 75, pro: 150, enterprise: 360, bonus: 200, bonusField: 'bonus_silver_claimed' },
                    { name: 'Gold', emoji: '🟡', range: '26-50', basic: 90, pro: 180, enterprise: 440, bonus: 500, bonusField: 'bonus_gold_claimed' },
                    { name: 'Platinum', emoji: '💠', range: '51-100', basic: 105, pro: 210, enterprise: 520, bonus: 1000, bonusField: 'bonus_platinum_claimed' },
                    { name: 'Diamond', emoji: '💎', range: '100+', basic: 120, pro: 240, enterprise: 600, bonus: 2000, bonusField: 'bonus_diamond_claimed' },
                  ].map((tier) => {
                    const isCurrentTier = tier.name === currentTier.name;
                    const bonusClaimed = partner[tier.bonusField as keyof typeof partner];
                    return (
                      <TableRow 
                        key={tier.name}
                        className={cn(
                          isCurrentTier && "bg-primary/5 border-l-2 border-l-primary"
                        )}
                      >
                        <TableCell className="font-medium">
                          {tier.name} {tier.emoji}
                        </TableCell>
                        <TableCell>{tier.range}</TableCell>
                        <TableCell className="text-right font-mono">€{tier.basic}</TableCell>
                        <TableCell className="text-right font-mono">€{tier.pro}</TableCell>
                        <TableCell className="text-right font-mono">€{tier.enterprise}</TableCell>
                        <TableCell className="text-right font-mono">
                          {tier.bonus > 0 ? (
                            bonusClaimed ? (
                              <span className="text-green-500">✓ Izplačano</span>
                            ) : (
                              `€${tier.bonus.toLocaleString('sl-SI')}`
                            )
                          ) : (
                            '—'
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

        {/* Payouts Section */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Zahtevki za izplačilo
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
                    <p>3. Ko prejmemo račun, kliknite 'Zahtevaj izplačilo' pri ustreznih strankah</p>
                    <p>4. Izplačilo prejmete v roku 14 dneh</p>
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ Če ste DDV zavezanec, k proviziji prištejte 22% DDV.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Single Consolidated Payouts Table */}
            {referrals.length > 0 ? (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="grid grid-cols-[1fr_auto_auto] md:table-row">
                        <TableHead className="order-4 md:order-none hidden md:table-cell">Stranka</TableHead>
                        <TableHead className="order-5 md:order-none hidden md:table-cell">Email</TableHead>
                        <TableHead className="order-3 md:order-none">Paket</TableHead>
                        <TableHead className="order-1 md:order-none">Provizija</TableHead>
                        <TableHead className="order-2 md:order-none hidden md:table-cell">Status</TableHead>
                        <TableHead className="order-2 md:order-none text-right">Akcija</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayoutReferrals.map((referral) => {
                        const isBonus = isBonusRow(referral);
                        return (
                          <TableRow 
                            key={referral.id}
                            className={cn(
                              "grid grid-cols-[1fr_auto_auto] md:table-row gap-2 md:gap-0 py-3 md:py-0",
                              isBonus && "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-l-[3px] border-l-amber-500"
                            )}
                          >
                            {/* Stranka - hidden on mobile */}
                            <TableCell className="order-4 md:order-none hidden md:table-cell font-medium">
                              {isBonus ? (
                                <div className="flex items-center gap-2">
                                  <Gift className="h-4 w-4 text-amber-500" />
                                  <div>
                                    <div>{referral.customer_name || 'Bonus'}</div>
                                    <div className="text-xs text-muted-foreground">Enkratni bonus za dosežen tier</div>
                                  </div>
                                </div>
                              ) : (
                                referral.customer_name || '—'
                              )}
                            </TableCell>
                            {/* Email - hidden on mobile */}
                            <TableCell className="order-5 md:order-none hidden md:table-cell">
                              {isBonus ? '—' : referral.customer_email}
                            </TableCell>
                            {/* Paket */}
                            <TableCell className="order-3 md:order-none">
                              {isBonus ? (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-500/10 text-amber-600 border-amber-500/20"
                                >
                                  🎁 Bonus
                                </Badge>
                              ) : (
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
                              )}
                            </TableCell>
                            {/* Provizija - first on mobile */}
                            <TableCell className="order-1 md:order-none font-semibold">
                              {formatCurrency(referral.commission_amount)}
                              {/* Show customer name on mobile */}
                              <div className="md:hidden text-xs text-muted-foreground font-normal mt-0.5">
                                {isBonus ? (
                                  <span className="flex items-center gap-1">
                                    <Gift className="h-3 w-3 text-amber-500" />
                                    {referral.customer_name || 'Bonus'}
                                  </span>
                                ) : (
                                  referral.customer_name || referral.customer_email
                                )}
                              </div>
                            </TableCell>
                            {/* Status - hidden on mobile, shown in Akcija cell */}
                            <TableCell className="order-2 md:order-none hidden md:table-cell">
                              {referral.invoice_paid ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-500/10 text-green-500 border-green-500/20"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Izplačano
                                </Badge>
                              ) : referral.invoice_requested ? (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-500/10 text-amber-500 border-amber-500/20"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  Čaka na izplačilo
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-muted text-muted-foreground">
                                  Na voljo
                                </Badge>
                              )}
                            </TableCell>
                            {/* Akcija - second on mobile, includes status on mobile */}
                            <TableCell className="order-2 md:order-none text-right">
                              {!referral.invoice_requested && !referral.invoice_paid && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRequestPayout(referral)}
                                  className="text-xs md:text-sm"
                                >
                                  <span className="hidden md:inline">Zahtevaj izplačilo</span>
                                  <span className="md:hidden">Zahtevaj</span>
                                </Button>
                              )}
                              {referral.invoice_requested && !referral.invoice_paid && (
                                <div className="flex flex-col items-end gap-1">
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs"
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span className="hidden md:inline">Čaka</span>
                                    <span className="md:hidden">⏳</span>
                                  </Badge>
                                  <span className="text-xs text-muted-foreground hidden md:block">
                                    {referral.invoice_requested_at
                                      ? formatDate(referral.invoice_requested_at)
                                      : '—'}
                                  </span>
                                </div>
                              )}
                              {referral.invoice_paid && (
                                <div className="flex flex-col items-end gap-1">
                                  <Badge
                                    variant="outline"
                                    className="bg-green-500/10 text-green-500 border-green-500/20 text-xs"
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    <span className="hidden md:inline">Izplačano</span>
                                    <span className="md:hidden">✓</span>
                                  </Badge>
                                  <span className="text-xs text-muted-foreground hidden md:block">
                                    {referral.invoice_paid_at
                                      ? formatDate(referral.invoice_paid_at)
                                      : '—'}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {payoutsTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">
                      Stran {payoutsPage} od {payoutsTotalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPayoutsPage(p => Math.max(1, p - 1))}
                        disabled={payoutsPage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prejšnja
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPayoutsPage(p => Math.min(payoutsTotalPages, p + 1))}
                        disabled={payoutsPage === payoutsTotalPages}
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
                <p>Še nimate provizij za izplačilo.</p>
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
              <div className="space-y-3">
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
                      {paginatedReferrals.map((referral) => {
                        const isBonus = isBonusRow(referral);
                        return (
                          <TableRow 
                            key={referral.id}
                            className={cn(
                              isBonus && "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-l-[3px] border-l-amber-500"
                            )}
                          >
                            <TableCell className="font-medium">
                              {isBonus ? (
                                <div className="flex items-center gap-2">
                                  <Gift className="h-4 w-4 text-amber-500" />
                                  <div>
                                    <div>{referral.customer_name || 'Bonus'}</div>
                                    <div className="text-xs text-muted-foreground">Enkratni bonus za dosežen tier</div>
                                  </div>
                                </div>
                              ) : (
                                referral.customer_name || '—'
                              )}
                            </TableCell>
                            <TableCell>{isBonus ? '—' : referral.customer_email}</TableCell>
                            <TableCell>
                              {isBonus ? (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-500/10 text-amber-600 border-amber-500/20"
                                >
                                  🎁 Bonus
                                </Badge>
                              ) : (
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
                              )}
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
                        );
                      })}
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
                
                {selectedReferral && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-foreground">
                      {selectedReferral.customer_name || selectedReferral.customer_email} - {selectedReferral.plan.charAt(0).toUpperCase() + selectedReferral.plan.slice(1)} paket - {formatCurrency(selectedReferral.commission_amount)}
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
