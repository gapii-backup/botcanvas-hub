import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminPartners } from '@/hooks/useAdminPartners';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Search, Eye, Loader2, Plus, Crown, Shuffle, Copy, EyeOff } from 'lucide-react';

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

  // Add user dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [actionLoading, setActionLoading] = useState(false);

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
      if (isPartner) {
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
            plan: selectedPlan,
            messages_limit: selectedPlan === 'enterprise' ? 8000 : selectedPlan === 'pro' ? 3000 : 1000,
            retention_days: selectedPlan === 'enterprise' ? 180 : selectedPlan === 'pro' ? 60 : 30,
            billing_period: 'monthly',
            support_tickets: [],
          });

        if (widgetError) {
          console.error('Widget creation error:', widgetError);
          toast.error('Uporabnik ustvarjen, vendar widget ni bil ustvarjen: ' + widgetError.message);
        } else {
          toast.success('Partner uspešno ustvarjen z widgetom');
        }
        
        // DO NOT send webhook for partners - they don't get welcome email
      } else {
        // For non-partner users, create basic widget entry
        const { error: widgetError } = await supabase
          .from('widgets')
          .insert({
            user_id: newUserId,
            user_email: newEmail,
            api_key: crypto.randomUUID().replace(/-/g, '').slice(0, 16).replace(/(.{4})/g, '$1-').slice(0, -1),
            is_partner: false,
            subscription_status: 'inactive',
            status: 'new',
            is_active: false,
            plan: null,
            messages_limit: 1000,
            retention_days: 30,
            billing_period: 'monthly',
            support_tickets: [],
          });

        if (widgetError) {
          console.error('Widget creation error:', widgetError);
          // Don't fail completely - user was created
        }

        // Send webhook notification ONLY for non-partner users
        try {
          await fetch('https://hub.botmotion.ai/webhook/new-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: newEmail,
              name: newEmail.split('@')[0],
              is_partner: false,
            }),
          });
        } catch (webhookError) {
          console.error('Webhook notification failed:', webhookError);
        }

        toast.success('Uporabnik uspešno ustvarjen');
      }

      // Reset form and close dialog
      setAddDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setShowPassword(false);
      setIsPartner(false);
      setSelectedPlan('basic');
      
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="partner"
                    checked={isPartner}
                    onCheckedChange={(checked) => setIsPartner(checked === true)}
                  />
                  <Label htmlFor="partner" className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-purple-400" />
                    Partner
                  </Label>
                </div>
                {isPartner && (
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (1000 sporočil, 30 dni)</SelectItem>
                        <SelectItem value="pro">Pro (3000 sporočil, 60 dni)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (8000 sporočil, 180 dni)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
            <p className="text-sm text-muted-foreground">Aktivnih partnerjev</p>
            <p className="text-2xl font-bold text-green-500">
              {partners.filter((p) => p.is_active).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Skupni zaslužek</p>
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
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
