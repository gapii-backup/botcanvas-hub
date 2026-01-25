import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminPartners } from '@/hooks/useAdminPartners';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Pencil, Loader2, Plus, Shuffle, Copy, EyeOff, Eye, FileWarning } from 'lucide-react';
import type { AdminPartner } from '@/hooks/useAdminPartners';

// Generate random password with letters, numbers, and symbols
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default function AdminPartners() {
  const { partners, isLoading, updatePartnerStatus, refetch } = useAdminPartners();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [unpaidInvoiceCount, setUnpaidInvoiceCount] = useState(0);

  // Add user dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit partner dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<AdminPartner | null>(null);
  const [editPromoCode, setEditPromoCode] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [promoCodeError, setPromoCodeError] = useState('');

  // Fetch unpaid invoice count
  useEffect(() => {
    const fetchUnpaidCount = async () => {
      try {
        const { count, error } = await supabase
          .from('partner_referrals')
          .select('*', { count: 'exact', head: true })
          .eq('invoice_requested', true)
          .eq('invoice_paid', false);

        if (!error) {
          setUnpaidInvoiceCount(count || 0);
        }
      } catch (error) {
        console.error('Error fetching unpaid count:', error);
      }
    };

    fetchUnpaidCount();
  }, []);

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (partner.company?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && partner.is_active) ||
      (statusFilter === 'inactive' && !partner.is_active);

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sl-SI', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const handleStatusToggle = async (id: string, currentStatus: boolean | null) => {
    await updatePartnerStatus(id, !currentStatus);
  };

  const handleEditClick = (partner: AdminPartner) => {
    setEditingPartner(partner);
    setEditPromoCode(partner.promo_code || '');
    setPromoCodeError('');
    setEditDialogOpen(true);
  };

  const handleSavePromoCode = async () => {
    if (!editingPartner) return;

    // Validation
    const trimmedCode = editPromoCode.trim();
    if (!trimmedCode) {
      setPromoCodeError('Promo koda ne sme biti prazna');
      return;
    }

    // Check if promo code already exists for another partner
    const existingPartner = partners.find(
      (p) => p.promo_code?.toLowerCase() === trimmedCode.toLowerCase() && p.id !== editingPartner.id
    );
    if (existingPartner) {
      setPromoCodeError('Ta promo koda že obstaja');
      return;
    }

    try {
      setEditLoading(true);
      const { error } = await supabase
        .from('partners')
        .update({ promo_code: trimmedCode })
        .eq('id', editingPartner.id);

      if (error) throw error;

      toast.success('Promo koda posodobljena');
      setEditDialogOpen(false);
      setEditingPartner(null);
      refetch();
    } catch (error) {
      console.error('Error updating promo code:', error);
      toast.error('Napaka pri posodabljanju promo kode');
    } finally {
      setEditLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const generated = generateRandomPassword();
    setNewPassword(generated);
    setShowPassword(true);
  };

  const handleCopyPassword = async () => {
    if (newPassword) {
      await navigator.clipboard.writeText(newPassword);
      toast.success('Geslo kopirano v odložišče');
    }
  };

  const handleAddUser = async () => {
    if (!newEmail || !newPassword) {
      toast.error('Vnesite email in geslo');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Geslo mora imeti vsaj 8 znakov');
      return;
    }

    try {
      setActionLoading(true);

      // IMPORTANT: Save admin session BEFORE signUp
      const { data: adminSessionData } = await supabase.auth.getSession();
      const adminSession = adminSessionData.session;
      
      if (!adminSession) {
        toast.error('Admin seja ni najdena. Prosim, ponovno se prijavite.');
        setActionLoading(false);
        return;
      }

      // Create user via signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User not created');

      const newUserId = authData.user.id;

      // IMMEDIATELY restore admin session
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });

      if (sessionError) {
        console.error('Failed to restore admin session:', sessionError);
        toast.error('Uporabnik ustvarjen, vendar je seja potekla. Prosim, ponovno se prijavite.');
        window.location.href = '/login';
        return;
      }

      // Now create widget for the user (admin is authenticated again)
      // Always create as partner with pro plan
      const { error: widgetError } = await supabase
        .from('widgets')
        .insert({
          user_id: newUserId,
          user_email: newEmail,
          api_key: crypto.randomUUID().replace(/-/g, '').slice(0, 16).replace(/(.{4})/g, '$1-').slice(0, -1),
          is_partner: true,
          subscription_status: 'active',
          status: 'partner',
          is_active: true,
          plan: 'pro',
          messages_limit: 3000,
          retention_days: 60,
          billing_period: 'monthly',
          support_tickets: [],
        });

      if (widgetError) {
        console.error('Widget creation error:', widgetError);
        toast.error('Uporabnik ustvarjen, vendar widget ni bil ustvarjen: ' + widgetError.message);
      } else {
        toast.success('Partner uspešno ustvarjen z widgetom');
      }

      // Reset form and close dialog
      setAddDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setShowPassword(false);
      
      // Refresh partners list
      refetch();
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      const message = error instanceof Error ? error.message : 'Napaka pri ustvarjanju uporabnika';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Partnerji</h1>
            <p className="text-muted-foreground">
              Upravljanje partnerjev in njihovih referalov
            </p>
          </div>
          
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj uporabnika
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj novega uporabnika</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Geslo * (min 8 znakov)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGeneratePassword}
                      title="Generiraj geslo"
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyPassword}
                      disabled={!newPassword}
                      title="Kopiraj geslo"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {newPassword && showPassword && (
                    <p className="text-xs text-muted-foreground">
                      Generirano geslo: <span className="font-mono text-foreground">{newPassword}</span>
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Prekliči
                  </Button>
                  <Button onClick={handleAddUser} disabled={actionLoading}>
                    {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Ustvari
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Išči po imenu, emailu ali podjetju..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter po statusu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vsi partnerji</SelectItem>
              <SelectItem value="active">Aktivni</SelectItem>
              <SelectItem value="inactive">Neaktivni</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Skupaj partnerjev</p>
            <p className="text-2xl font-bold">{partners.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-orange-500" />
              <p className="text-sm text-muted-foreground">Neplačani računi</p>
            </div>
            <p className="text-2xl font-bold text-orange-500">
              {unpaidInvoiceCount}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Skupne provizije</p>
            <p className="text-2xl font-bold">
              {formatCurrency(partners.reduce((sum, p) => sum + p.totalEarnings, 0))}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Ime</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Podjetje</TableHead>
                <TableHead>Promo koda</TableHead>
                <TableHead className="text-center">Aktivni referrali</TableHead>
                <TableHead className="text-right">Zaslužek</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Ni najdenih partnerjev
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>{partner.email}</TableCell>
                    <TableCell>{partner.company || '-'}</TableCell>
                    <TableCell>
                      {partner.promo_code ? (
                        <Badge variant="secondary" className="font-mono">
                          {partner.promo_code}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{partner.activeReferrals}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(partner.totalEarnings)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={partner.is_active ?? false}
                        onCheckedChange={() =>
                          handleStatusToggle(partner.id, partner.is_active)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditClick(partner)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Partner Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Uredi partnerja</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Ime</Label>
                <Input
                  value={editingPartner?.name || ''}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={editingPartner?.email || ''}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Podjetje</Label>
                <Input
                  value={editingPartner?.company || '-'}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo_code">Promo koda</Label>
                <Input
                  id="promo_code"
                  value={editPromoCode}
                  onChange={(e) => {
                    setEditPromoCode(e.target.value.toUpperCase());
                    setPromoCodeError('');
                  }}
                  placeholder="PROMO20"
                />
                {promoCodeError && (
                  <p className="text-sm text-destructive">{promoCodeError}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Prekliči
                </Button>
                <Button onClick={handleSavePromoCode} disabled={editLoading}>
                  {editLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Shrani
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
