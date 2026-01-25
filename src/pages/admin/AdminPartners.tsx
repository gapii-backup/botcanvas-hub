import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Users, Loader2, Crown, Shuffle, Copy, Eye, EyeOff, Search } from 'lucide-react';

interface PartnerData {
  id: string;
  user_id: string;
  user_email: string;
  bot_name: string | null;
  is_partner: boolean;
  plan: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  // Partner table data
  partner_id: string | null;
  promo_code: string | null;
  partner_is_active: boolean | null;
  referral_count: number;
}

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
  const [partners, setPartners] = useState<PartnerData[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<PartnerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add user dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  
  // Edit user dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerData | null>(null);
  const [editPlan, setEditPlan] = useState('basic');
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPartner, setDeletingPartner] = useState<PartnerData | null>(null);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      
      // Get all widgets where is_partner = true
      const { data: widgetsData, error: widgetsError } = await supabase
        .from('widgets')
        .select('id, user_id, user_email, bot_name, is_partner, plan, status, is_active, created_at')
        .eq('is_partner', true)
        .order('created_at', { ascending: false });

      if (widgetsError) throw widgetsError;

      // Get unique partners by email
      const uniqueEmails = [...new Set((widgetsData || []).map(w => w.user_email))];
      
      // Fetch partner data from partners table
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('id, email, promo_code, is_active');

      if (partnersError) {
        console.error('Error fetching partners table:', partnersError);
      }

      // Fetch referral counts
      const { data: referralsData, error: referralsError } = await supabase
        .from('partner_referrals')
        .select('partner_id');

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
      }

      // Count referrals per partner
      const referralCounts: Record<string, number> = {};
      (referralsData || []).forEach(r => {
        referralCounts[r.partner_id] = (referralCounts[r.partner_id] || 0) + 1;
      });

      // Build partner data with joined info
      const partnerDataList: PartnerData[] = [];
      const seenEmails = new Set<string>();

      for (const widget of (widgetsData || [])) {
        // Skip duplicate emails - only show first widget per email
        if (seenEmails.has(widget.user_email)) continue;
        seenEmails.add(widget.user_email);

        // Find partner record
        const partnerRecord = (partnersData || []).find(p => p.email === widget.user_email);

        partnerDataList.push({
          id: widget.id,
          user_id: widget.user_id,
          user_email: widget.user_email,
          bot_name: widget.bot_name,
          is_partner: widget.is_partner,
          plan: widget.plan,
          status: widget.status,
          is_active: widget.is_active,
          created_at: widget.created_at,
          partner_id: partnerRecord?.id || null,
          promo_code: partnerRecord?.promo_code || null,
          partner_is_active: partnerRecord?.is_active ?? null,
          referral_count: partnerRecord ? (referralCounts[partnerRecord.id] || 0) : 0,
        });
      }

      setPartners(partnerDataList);
      setFilteredPartners(partnerDataList);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('Napaka pri nalaganju partnerjev');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // Filter partners by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPartners(partners);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredPartners(
        partners.filter(p =>
          p.user_email.toLowerCase().includes(query) ||
          (p.promo_code && p.promo_code.toLowerCase().includes(query)) ||
          (p.bot_name && p.bot_name.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, partners]);

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

  const handleAddPartner = async () => {
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
        toast.error('Partner ustvarjen, vendar je seja potekla. Prosim, ponovno se prijavite.');
        window.location.href = '/login';
        return;
      }

      // Create widget for the partner
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
        toast.error('Partner ustvarjen, vendar widget ni bil ustvarjen: ' + widgetError.message);
      } else {
        toast.success('Partner uspešno ustvarjen z widgetom');
      }

      // Reset form and close dialog
      setAddDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setShowPassword(false);
      setSelectedPlan('basic');
      
      // Refresh partners list
      fetchPartners();
    } catch (error: unknown) {
      console.error('Error creating partner:', error);
      const message = error instanceof Error ? error.message : 'Napaka pri ustvarjanju partnerja';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPartner = async () => {
    if (!editingPartner) return;

    try {
      setActionLoading(true);

      const updateData: Record<string, unknown> = {
        plan: editPlan,
        updated_at: new Date().toISOString(),
      };

      switch (editPlan) {
        case 'enterprise':
          updateData.messages_limit = 8000;
          updateData.retention_days = 180;
          break;
        case 'pro':
          updateData.messages_limit = 3000;
          updateData.retention_days = 60;
          break;
        case 'basic':
        default:
          updateData.messages_limit = 1000;
          updateData.retention_days = 30;
          break;
      }

      const { error } = await supabase
        .from('widgets')
        .update(updateData)
        .eq('id', editingPartner.id);

      if (error) throw error;

      toast.success('Partner uspešno posodobljen');
      setEditDialogOpen(false);
      setEditingPartner(null);
      fetchPartners();
    } catch (error: unknown) {
      console.error('Error updating partner:', error);
      const message = error instanceof Error ? error.message : 'Napaka pri posodabljanju partnerja';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!deletingPartner) return;

    try {
      setActionLoading(true);

      // Only delete widget, not auth user
      const { error } = await supabase
        .from('widgets')
        .delete()
        .eq('id', deletingPartner.id);

      if (error) throw error;

      toast.success('Partner uspešno izbrisan');
      setDeleteDialogOpen(false);
      setDeletingPartner(null);
      fetchPartners();
    } catch (error: unknown) {
      console.error('Error deleting partner:', error);
      const message = error instanceof Error ? error.message : 'Napaka pri brisanju partnerja';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (partner: PartnerData) => {
    setEditingPartner(partner);
    setEditPlan(partner.plan || 'basic');
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (partner: PartnerData) => {
    setDeletingPartner(partner);
    setDeleteDialogOpen(true);
  };

  const getPartnerStatusBadge = (isActive: boolean | null) => {
    if (isActive === null) {
      return <Badge variant="outline" className="text-muted-foreground">Ni v tabeli</Badge>;
    }
    if (isActive) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aktiven</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Neaktiven</Badge>;
  };

  const getPlanBadge = (plan: string | null) => {
    if (!plan) return null;
    switch (plan) {
      case 'enterprise':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Enterprise</Badge>;
      case 'pro':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Pro</Badge>;
      case 'basic':
        return <Badge variant="outline">Basic</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold">Partnerji</h1>
          </div>
          
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj partnerja
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj novega partnerja</DialogTitle>
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
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Prekliči
                  </Button>
                  <Button onClick={handleAddPartner} disabled={actionLoading}>
                    {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Ustvari
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Išči po emailu, promo kodi ali imenu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vsi partnerji ({filteredPartners.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'Ni zadetkov za iskanje' : 'Ni partnerjev'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Ime</TableHead>
                      <TableHead>Promo koda</TableHead>
                      <TableHead>Status partnerja</TableHead>
                      <TableHead>Referralov</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPartners.map((partner) => (
                      <TableRow key={partner.id}>
                        <TableCell className="font-medium">{partner.user_email}</TableCell>
                        <TableCell>{partner.bot_name || '-'}</TableCell>
                        <TableCell>
                          {partner.promo_code ? (
                            <code className="bg-muted px-2 py-1 rounded text-sm">{partner.promo_code}</code>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getPartnerStatusBadge(partner.partner_is_active)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{partner.referral_count}</Badge>
                        </TableCell>
                        <TableCell>{getPlanBadge(partner.plan)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(partner)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(partner)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uredi partnerja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="text-sm text-muted-foreground">
              Email: <span className="font-medium text-foreground">{editingPartner?.user_email}</span>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
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
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Prekliči
              </Button>
              <Button onClick={handleEditPartner} disabled={actionLoading}>
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Shrani
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Izbriši partnerja?</AlertDialogTitle>
            <AlertDialogDescription>
              Ali ste prepričani, da želite izbrisati widget za partnerja <strong>{deletingPartner?.user_email}</strong>? 
              Ta akcija bo izbrisala vse povezane podatke in je ni mogoče razveljaviti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Prekliči</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePartner}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Izbriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
