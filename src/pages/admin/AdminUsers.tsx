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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Users, Loader2, Crown } from 'lucide-react';

interface UserWidget {
  user_id: string;
  user_email: string;
  is_partner: boolean;
  plan: string | null;
  status: string;
  is_active: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  widget: UserWidget | null;
}

export default function AdminUsers() {
  const { session } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Add user dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isPartner, setIsPartner] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  
  // Edit user dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editIsPartner, setEditIsPartner] = useState(false);
  const [editPlan, setEditPlan] = useState('basic');
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  const fetchUsers = async () => {
    if (!session?.access_token) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'list' },
      });

      if (error) throw error;
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Napaka pri nalaganju uporabnikov');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [session]);

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
      const { error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'create',
          email: newEmail,
          password: newPassword,
          isPartner,
          plan: isPartner ? selectedPlan : null,
        },
      });

      if (error) throw error;

      toast.success('Uporabnik uspešno ustvarjen');
      setAddDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setIsPartner(false);
      setSelectedPlan('basic');
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Napaka pri ustvarjanju uporabnika');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      setActionLoading(true);
      const { error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'update',
          userId: editingUser.id,
          isPartner: editIsPartner,
          plan: editIsPartner ? editPlan : null,
        },
      });

      if (error) throw error;

      toast.success('Uporabnik uspešno posodobljen');
      setEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Napaka pri posodabljanju uporabnika');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setActionLoading(true);
      const { error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'delete',
          userId: deletingUser.id,
        },
      });

      if (error) throw error;

      toast.success('Uporabnik uspešno izbrisan');
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Napaka pri brisanju uporabnika');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    setEditIsPartner(user.widget?.is_partner || false);
    setEditPlan(user.widget?.plan || 'basic');
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (user: AdminUser) => {
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
                  <Input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
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
                      <TableHead>Zadnja prijava</TableHead>
                      <TableHead className="text-right">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          {user.widget?.is_partner && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              <Crown className="h-3 w-3 mr-1" />
                              Partner
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{getPlanBadge(user.widget?.plan || null)}</TableCell>
                        <TableCell>{getStatusBadge(user.widget?.status || 'new')}</TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), 'd. MMM yyyy', { locale: sl })}
                        </TableCell>
                        <TableCell>
                          {user.last_sign_in_at 
                            ? format(new Date(user.last_sign_in_at), 'd. MMM yyyy, HH:mm', { locale: sl })
                            : '-'
                          }
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
              Email: <span className="font-medium text-foreground">{editingUser?.email}</span>
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
              Ali ste prepričani, da želite izbrisati uporabnika <strong>{deletingUser?.email}</strong>? 
              Ta akcija bo izbrisala tudi vse povezane podatke in je ni mogoče razveljaviti.
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
