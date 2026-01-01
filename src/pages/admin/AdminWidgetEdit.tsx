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
import { ArrowLeft, Save, Trash2, Loader2, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// All available addons
const ALL_ADDONS = [
  { id: 'capacity_1000', name: '+1.000 pogovorov', capacityValue: 1000 },
  { id: 'capacity_2000', name: '+2.000 pogovorov', capacityValue: 2000 },
  { id: 'capacity_5000', name: '+5.000 pogovorov', capacityValue: 5000 },
  { id: 'capacity_10000', name: '+10.000 pogovorov', capacityValue: 10000 },
  { id: 'multilanguage', name: 'Multilanguage', capacityValue: 0 },
  { id: 'booking', name: 'Rezervacija sestankov', capacityValue: 0 },
  { id: 'contacts', name: 'Zbiranje kontaktov', capacityValue: 0 },
  { id: 'product_ai', name: 'Product AI', capacityValue: 0 },
  { id: 'tickets', name: 'Support Ticketi', capacityValue: 0 }
];

// Helper to get capacity value for an addon
const getAddonCapacity = (addonId: string): number => {
  const addon = ALL_ADDONS.find(a => a.id === addonId);
  return addon?.capacityValue || 0;
};

// Status options
const STATUS_OPTIONS = [
  { value: 'new', label: 'Nov' },
  { value: 'setup_pending', label: 'Setup Pending' },
  { value: 'setup_paid', label: 'Setup Paid' },
  { value: 'sub_pending', label: 'Subscription Pending' },
  { value: 'sub_paid', label: 'Subscription Paid' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// Subscription status options
const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'active', label: 'Active' },
  { value: 'cancelling', label: 'Cancelling' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
];

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

  // Track original is_active state to detect changes
  const [originalIsActive, setOriginalIsActive] = useState<boolean>(false);

  useEffect(() => {
    if (widget) {
      setOriginalIsActive(widget.is_active);
    }
  }, [widget?.id]);

  const handleSave = async () => {
    if (!widget || !id) return;
    
    setSaving(true);
    try {
      // Exclude stripe fields from update - they are managed by workflows
      const { stripe_customer_id, stripe_subscription_id, ...updateData } = widget;
      
      await updateWidgetById(id, updateData);
      
      // Check if is_active was changed to TRUE
      if (widget.is_active && !originalIsActive) {
        // Call the webhook to notify about bot activation
        try {
          await fetch('https://hub.botmotion.ai/webhook/bot-activated', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_email: widget.user_email,
              bot_name: widget.bot_name,
              api_key: widget.api_key
            })
          });
          toast.success('Bot aktiviran in email poslan uporabniku');
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
          toast.success('Widget shranjen, a webhook ni bil uspešen');
        }
        // Update original state after successful activation
        setOriginalIsActive(true);
      } else {
        toast.success('Widget shranjen');
      }
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

  // Quick questions helpers
  const questions = Array.isArray(widget?.quick_questions) ? widget.quick_questions : [];
  
  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    updateField('quick_questions', newQuestions);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    updateField('quick_questions', newQuestions);
  };

  const addQuestion = () => {
    updateField('quick_questions', [...questions, '']);
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
                <Label>Plan</Label>
                <Select value={widget.plan || ''} onValueChange={(v) => updateField('plan', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Izberi plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Billing Period</Label>
                <Select value={widget.billing_period} onValueChange={(v) => updateField('billing_period', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={widget.status} onValueChange={(v) => updateField('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subscription Status</Label>
                <Select value={widget.subscription_status} onValueChange={(v) => updateField('subscription_status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stripe Customer ID (readonly)</Label>
                <Input value={widget.stripe_customer_id || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Stripe Subscription ID (readonly)</Label>
                <Input value={widget.stripe_subscription_id || ''} readOnly className="bg-muted" />
              </div>
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
            <div className="space-y-2">
              <Label htmlFor="knowledge_webhook_url">Knowledge Base Webhook URL</Label>
              <Input
                id="knowledge_webhook_url"
                value={(widget as any).knowledge_webhook_url || ''}
                onChange={(e) => setWidget({ ...widget, knowledge_webhook_url: e.target.value } as any)}
                placeholder="https://hub.botmotion.ai/webhook/..."
              />
              <p className="text-xs text-muted-foreground">Webhook za Q&A, PDF upload in PDF delete</p>
            </div>
            <div className="space-y-2">
              <Label>Booking URL</Label>
              <Input
                value={widget.booking_url || ''}
                onChange={(e) => updateField('booking_url', e.target.value)}
                placeholder="https://cal.com/..."
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

        {/* Bot Avatar */}
        <Card>
          <CardHeader>
            <CardTitle>Bot Avatar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {widget.bot_avatar && (
                <img 
                  src={widget.bot_avatar} 
                  alt="Bot avatar" 
                  className="w-16 h-16 rounded-full object-cover border border-border"
                />
              )}
              <div className="flex-1 space-y-2">
                <Label>Bot Avatar URL</Label>
                <Input
                  value={widget.bot_avatar || ''}
                  onChange={(e) => updateField('bot_avatar', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vprašanja za hitre predloge</Label>
              {questions.map((q, index) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    value={q} 
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    placeholder="Vprašanje..."
                  />
                  <Button variant="destructive" size="icon" onClick={() => removeQuestion(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addQuestion} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Dodaj vprašanje
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Addons */}
        <Card>
          <CardHeader>
            <CardTitle>Addoni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Izberi aktivne addone</Label>
              <div className="grid grid-cols-2 gap-3">
                {ALL_ADDONS.map((addon) => {
                  const currentAddons = Array.isArray(widget.addons) ? widget.addons : [];
                  const isEnabled = currentAddons.includes(addon.id);
                  
                  return (
                    <label
                      key={addon.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={async (e) => {
                          const capacityValue = getAddonCapacity(addon.id);
                          const currentMessagesLimit = widget.messages_limit || 0;
                          
                          if (e.target.checked) {
                            // ENABLE addon - add capacity to messages_limit
                            const newAddons = [...currentAddons, addon.id];
                            const newMessagesLimit = currentMessagesLimit + capacityValue;
                            
                            try {
                              await updateWidgetById(id!, {
                                addons: newAddons,
                                messages_limit: newMessagesLimit
                              });
                              setWidget(prev => prev ? {
                                ...prev,
                                addons: newAddons,
                                messages_limit: newMessagesLimit
                              } : null);
                              toast.success(`Addon ${addon.name} vklopljen`);
                            } catch (error) {
                              toast.error('Napaka pri vklopu addona');
                            }
                          } else {
                            // DISABLE addon - subtract capacity from messages_limit
                            const newAddons = currentAddons.filter(a => a !== addon.id);
                            const newMessagesLimit = Math.max(0, currentMessagesLimit - capacityValue);
                            
                            try {
                              await updateWidgetById(id!, {
                                addons: newAddons,
                                messages_limit: newMessagesLimit
                              });
                              setWidget(prev => prev ? {
                                ...prev,
                                addons: newAddons,
                                messages_limit: newMessagesLimit
                              } : null);
                              toast.success(`Addon ${addon.name} izklopljen`);
                            } catch (error) {
                              toast.error('Napaka pri izklopu addona');
                            }
                          }
                        }}
                        className="w-4 h-4 rounded border-border bg-background"
                      />
                      <span className="text-sm font-medium">{addon.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Show active addons summary */}
            {widget.addons && (widget.addons as string[]).length > 0 && (
              <div className="pt-4 border-t border-border">
                <Label className="text-sm text-muted-foreground">Aktivni addoni:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(widget.addons as string[]).map((addonId) => {
                    const addon = ALL_ADDONS.find(a => a.id === addonId);
                    return (
                      <Badge key={addonId} variant="secondary">
                        {addon?.name || addonId}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardHeader>
            <CardTitle>Footer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Footer Prefix</Label>
                <Input
                  value={widget.footer_prefix || ''}
                  onChange={(e) => updateField('footer_prefix', e.target.value)}
                  placeholder="Powered by"
                />
              </div>
              <div className="space-y-2">
                <Label>Footer Link Text</Label>
                <Input
                  value={widget.footer_link_text || ''}
                  onChange={(e) => updateField('footer_link_text', e.target.value)}
                  placeholder="Our Company"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Footer Link URL</Label>
                <Input
                  value={widget.footer_link_url || ''}
                  onChange={(e) => updateField('footer_link_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Footer Suffix</Label>
                <Input
                  value={widget.footer_suffix || ''}
                  onChange={(e) => updateField('footer_suffix', e.target.value)}
                  placeholder=""
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Capacity - at the bottom */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="space-y-2 flex-1">
                <Label>Trenutna custom capacity</Label>
                <div className="text-2xl font-bold">{widget.custom_capacity?.toLocaleString() || 0}</div>
              </div>
              <div className="space-y-2 flex-1">
                <Label>Messages Limit</Label>
                <div className="text-2xl font-bold">{widget.messages_limit?.toLocaleString() || 0}</div>
              </div>
            </div>
            {widget.custom_capacity && widget.custom_capacity > 0 ? (
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground flex-1">
                  Custom capacity je že dodan. Odstranite ga, če želite dodati novega.
                </p>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      const currentCustom = widget.custom_capacity || 0;
                      const newMessagesLimit = Math.max(0, (widget.messages_limit || 0) - currentCustom);
                      await updateWidgetById(id!, { 
                        custom_capacity: 0, 
                        messages_limit: newMessagesLimit 
                      });
                      setWidget(prev => prev ? { 
                        ...prev, 
                        custom_capacity: 0, 
                        messages_limit: newMessagesLimit 
                      } : null);
                      toast.success('Custom capacity odstranjen');
                    } catch (error) {
                      toast.error('Napaka pri odstranjevanju');
                    }
                  }}
                >
                  Odstrani custom capacity
                </Button>
              </div>
            ) : (
              <div className="flex items-end gap-4">
                <div className="space-y-2 flex-1">
                  <Label>Nova custom capacity vrednost</Label>
                  <Input
                    type="number"
                    id="custom-capacity-input"
                    placeholder="npr. 5000, 10000"
                    min={0}
                  />
                </div>
                <Button
                  onClick={async () => {
                    const input = document.getElementById('custom-capacity-input') as HTMLInputElement;
                    const value = parseInt(input.value);
                    if (isNaN(value) || value <= 0) {
                      toast.error('Vnesite veljavno število');
                      return;
                    }
                    try {
                      const newMessagesLimit = (widget.messages_limit || 0) + value;
                      await updateWidgetById(id!, { 
                        custom_capacity: value, 
                        messages_limit: newMessagesLimit 
                      });
                      setWidget(prev => prev ? { 
                        ...prev, 
                        custom_capacity: value, 
                        messages_limit: newMessagesLimit 
                      } : null);
                      input.value = '';
                      toast.success('Custom capacity dodan');
                    } catch (error) {
                      toast.error('Napaka pri posodabljanju');
                    }
                  }}
                >
                  Dodaj custom capacity
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
