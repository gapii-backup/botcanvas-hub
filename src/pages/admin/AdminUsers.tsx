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
import { Plus, Pencil, Trash2, Users, Loader2, Crown, Shuffle, Copy, Eye, EyeOff } from 'lucide-react';

interface WidgetUser {
  id: string;
  user_id: string;
  user_email: string;
  is_partner: boolean;
  plan: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
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

export default function AdminUsers() {
  const [users, setUsers] = useState<WidgetUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Add user dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  
  // Edit user dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<WidgetUser | null>(null);
  const [editIsPartner, setEditIsPartner] = useState(false);
  const [editPlan, setEditPlan] = useState('basic');
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<WidgetUser | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('widgets')
        .select('id, user_id, user_email, is_partner, plan, status, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data as WidgetUser[]) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Napaka pri nalaganju uporabnikov');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
            api_key: crypto.randomUUID(),
            is_partner: true,
            subscription_status: 'active',
            status: 'partner',
            is_active: true,
            plan: selectedPlan,
            messages_limit: selectedPlan === 'enterprise' ? 10000 : selectedPlan === 'pro' ? 5000 : 2000,
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
            api_key: crypto.randomUUID(),
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
      
      // Refresh users list
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      const message = error instanceof Error ? error.message : 'Napaka pri ustvarjanju uporabnika';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      setActionLoading(true);

      const updateData: Record<string, unknown> = {
        is_partner: editIsPartner,
        updated_at: new Date().toISOString(),
      };

      if (editIsPartner) {
        updateData.subscription_status = 'active';
        updateData.status = 'partner';
        updateData.is_active = true;
        updateData.plan = editPlan;
        
        switch (editPlan) {
          case 'enterprise':
            updateData.messages_limit = 10000;
            updateData.retention_days = 180;
            break;
          case 'pro':
            updateData.messages_limit = 5000;
            updateData.retention_days = 60;
            break;
          case 'basic':
          default:
            updateData.messages_limit = 2000;
            updateData.retention_days = 30;
            break;
        }
      } else {
        updateData.is_partner = false;
      }

      const { error } = await supabase
        .from('widgets')
        .update(updateData)
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success('Uporabnik uspešno posodobljen');
      setEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error updating user:', error);
      const message = error instanceof Error ? error.message : 'Napaka pri posodabljanju uporabnika';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setActionLoading(true);

      // Only delete widget, not auth user
      const { error } = await supabase
        .from('widgets')
        .delete()
        .eq('id', deletingUser.id);

      if (error) throw error;

      toast.success('Uporabnik uspešno izbrisan');
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      const message = error instanceof Error ? error.message : 'Napaka pri brisanju uporabnika';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (user: WidgetUser) => {
    setEditingUser(user);
    setEditIsPartner(user.is_partner || false);
    setEditPlan(user.plan || 'basic');
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (user: WidgetUser) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aktiven</Badge>;
      case 'partner':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Partner</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">V čakanju</Badge>;
      case 'new':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Nov</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Uporabniki</h1>
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
                        <SelectItem value="basic">Basic (2000 sporočil, 30 dni)</SelectItem>
                        <SelectItem value="pro">Pro (5000 sporočil, 60 dni)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (10000 sporočil, 180 dni)</SelectItem>
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

        <Card>
          <CardHeader>
            <CardTitle>Vsi uporabniki ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Ni uporabnikov
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ustvarjen</TableHead>
                      <TableHead className="text-right">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.user_email}</TableCell>
                        <TableCell>
                          {user.is_partner && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              <Crown className="h-3 w-3 mr-1" />
                              Partner
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{getPlanBadge(user.plan)}</TableCell>
                        <TableCell>{getStatusBadge(user.status || 'new')}</TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), 'd. MMM yyyy', { locale: sl })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(user)}
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
            <DialogTitle>Uredi uporabnika</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="text-sm text-muted-foreground">
              Email: <span className="font-medium text-foreground">{editingUser?.user_email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-partner"
                checked={editIsPartner}
                onCheckedChange={(checked) => setEditIsPartner(checked === true)}
              />
              <Label htmlFor="edit-partner" className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-400" />
                Partner
              </Label>
            </div>
            {editIsPartner && (
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={editPlan} onValueChange={setEditPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (2000 sporočil, 30 dni)</SelectItem>
                    <SelectItem value="pro">Pro (5000 sporočil, 60 dni)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (10000 sporočil, 180 dni)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Prekliči
              </Button>
              <Button onClick={handleEditUser} disabled={actionLoading}>
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
            <AlertDialogTitle>Izbriši uporabnika?</AlertDialogTitle>
            <AlertDialogDescription>
              Ali ste prepričani, da želite izbrisati widget za uporabnika <strong>{deletingUser?.user_email}</strong>? 
              Ta akcija bo izbrisala vse povezane podatke in je ni mogoče razveljaviti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Prekliči</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
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
