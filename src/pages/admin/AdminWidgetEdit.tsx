import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminWidgets, AdminWidget } from '@/hooks/useAdminWidgets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminWidgetEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchWidgetById, updateWidgetById, deleteWidgetById } = useAdminWidgets();
  
  const [widget, setWidget] = useState<AdminWidget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadWidget = async () => {
      if (!id) return;
      try {
        const data = await fetchWidgetById(id);
        setWidget(data);
      } catch (error) {
        toast.error('Napaka pri nalaganju widgeta');
      } finally {
        setLoading(false);
      }
    };
    loadWidget();
  }, [id]);

  const handleSave = async () => {
    if (!widget || !id) return;
    
    setSaving(true);
    try {
      await updateWidgetById(id, widget);
      toast.success('Widget shranjen');
    } catch (error) {
      toast.error('Napaka pri shranjevanju');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setDeleting(true);
    try {
      await deleteWidgetById(id);
      toast.success('Widget izbrisan');
      navigate('/admin/widgets');
    } catch (error) {
      toast.error('Napaka pri brisanju');
    } finally {
      setDeleting(false);
    }
  };

  const updateField = <K extends keyof AdminWidget>(field: K, value: AdminWidget[K]) => {
    setWidget(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!widget) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Widget ni bil najden.</p>
          <Button variant="link" onClick={() => navigate('/admin/widgets')}>
            Nazaj na seznam
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/widgets')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Uredi Widget</h1>
              <p className="text-muted-foreground">{widget.user_email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Izbriši
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ste prepričani?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ta akcija bo trajno izbrisala widget za {widget.user_email}. Tega ni mogoče razveljaviti.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Prekliči</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Izbriši</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Shrani
            </Button>
          </div>
        </div>

        {/* Admin Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Admin polja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={widget.status} onValueChange={(v) => updateField('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={widget.plan || ''} onValueChange={(v) => updateField('plan', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Izberi plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="scale">Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktiven</Label>
              <Switch
                checked={widget.is_active}
                onCheckedChange={(v) => updateField('is_active', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>API Key (readonly)</Label>
              <Input value={widget.api_key || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Table Name</Label>
              <Input
                value={widget.table_name || ''}
                onChange={(e) => updateField('table_name', e.target.value)}
                placeholder="ime_tabele"
              />
            </div>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL (glavni chat)</Label>
              <Input
                value={widget.webhook_url || ''}
                onChange={(e) => updateField('webhook_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Lead Webhook URL</Label>
              <Input
                value={widget.lead_webhook_url || ''}
                onChange={(e) => updateField('lead_webhook_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Support Webhook URL</Label>
              <Input
                value={widget.support_webhook_url || ''}
                onChange={(e) => updateField('support_webhook_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Health Check URL</Label>
              <Input
                value={widget.health_check_url || ''}
                onChange={(e) => updateField('health_check_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Osnovne informacije</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bot Name</Label>
                <Input
                  value={widget.bot_name || ''}
                  onChange={(e) => updateField('bot_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input
                  value={widget.website_url || ''}
                  onChange={(e) => updateField('website_url', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Welcome Message</Label>
              <Textarea
                value={widget.welcome_message || ''}
                onChange={(e) => updateField('welcome_message', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Home Title</Label>
                <Input
                  value={widget.home_title || ''}
                  onChange={(e) => updateField('home_title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Home Subtitle</Label>
                <Input
                  value={widget.home_subtitle_line2 || ''}
                  onChange={(e) => updateField('home_subtitle_line2', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colors & Style */}
        <Card>
          <CardHeader>
            <CardTitle>Barve in stil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={widget.primary_color || '#000000'}
                    onChange={(e) => updateField('primary_color', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={widget.primary_color || ''}
                    onChange={(e) => updateField('primary_color', e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon Background</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={widget.bot_icon_background || '#000000'}
                    onChange={(e) => updateField('bot_icon_background', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={widget.bot_icon_background || ''}
                    onChange={(e) => updateField('bot_icon_background', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={widget.bot_icon_color || '#ffffff'}
                    onChange={(e) => updateField('bot_icon_color', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={widget.bot_icon_color || ''}
                    onChange={(e) => updateField('bot_icon_color', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={widget.mode} onValueChange={(v) => updateField('mode', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Header Style</Label>
                <Select value={widget.header_style} onValueChange={(v) => updateField('header_style', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position & Trigger */}
        <Card>
          <CardHeader>
            <CardTitle>Pozicija in trigger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={widget.position} onValueChange={(v) => updateField('position', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trigger Style</Label>
                <Select value={widget.trigger_style} onValueChange={(v) => updateField('trigger_style', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="floating">Floating</SelectItem>
                    <SelectItem value="edge">Edge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vertical Offset</Label>
                <Input
                  type="number"
                  value={widget.vertical_offset}
                  onChange={(e) => updateField('vertical_offset', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Edge Trigger Text</Label>
                <Input
                  value={widget.edge_trigger_text || ''}
                  onChange={(e) => updateField('edge_trigger_text', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bubble Text</Label>
                <Input
                  value={widget.bubble_text || ''}
                  onChange={(e) => updateField('bubble_text', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Bubble</Label>
              <Switch
                checked={widget.show_bubble}
                onCheckedChange={(v) => updateField('show_bubble', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Funkcionalnosti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Show Email Field</Label>
              <Switch
                checked={widget.show_email_field}
                onCheckedChange={(v) => updateField('show_email_field', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Booking Enabled</Label>
              <Switch
                checked={widget.booking_enabled}
                onCheckedChange={(v) => updateField('booking_enabled', v)}
              />
            </div>
            {widget.booking_enabled && (
              <div className="space-y-2">
                <Label>Booking URL</Label>
                <Input
                  value={widget.booking_url || ''}
                  onChange={(e) => updateField('booking_url', e.target.value)}
                  placeholder="https://calendly.com/..."
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label>Support Enabled</Label>
              <Switch
                checked={widget.support_enabled}
                onCheckedChange={(v) => updateField('support_enabled', v)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
