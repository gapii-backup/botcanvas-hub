import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { MessageSquare, Clock, User, X, Send, CheckCircle } from 'lucide-react';
import type { SupportTicketItem } from '@/types/supportTicket';

interface WidgetWithTickets {
  id: string;
  user_email: string;
  support_tickets: SupportTicketItem[];
}

interface FlatTicket extends SupportTicketItem {
  widget_id: string;
  user_email: string;
}

export default function AdminTickets() {
  const { toast } = useToast();
  const [widgets, setWidgets] = useState<WidgetWithTickets[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<FlatTicket | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWidgets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('widgets')
        .select('id, user_email, support_tickets')
        .not('support_tickets', 'eq', '[]');

      if (error) throw error;

      const widgetsWithTickets = ((data || []) as unknown as WidgetWithTickets[]).filter(w => {
        const tickets = Array.isArray(w.support_tickets) ? w.support_tickets : [];
        return tickets.length > 0;
      });

      setWidgets(widgetsWithTickets);
    } catch (err) {
      console.error('Error fetching widgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWidgets();
  }, []);

  const allTickets: FlatTicket[] = useMemo(() => {
    const tickets: FlatTicket[] = [];
    widgets.forEach(widget => {
      const widgetTickets = Array.isArray(widget.support_tickets) ? widget.support_tickets : [];
      widgetTickets.forEach(ticket => {
        tickets.push({
          ...ticket,
          widget_id: widget.id,
          user_email: widget.user_email,
        });
      });
    });
    return tickets.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [widgets]);

  const filteredTickets = useMemo(() => {
    return allTickets.filter(ticket => {
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
      return true;
    });
  }, [allTickets, statusFilter, priorityFilter]);

  const handleRespond = async () => {
    if (!selectedTicket || !adminResponse.trim()) {
      toast({
        title: "Napaka",
        description: "Vnesite odgovor.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const widget = widgets.find(w => w.id === selectedTicket.widget_id);
      if (!widget) throw new Error('Widget not found');

      const updatedTickets = widget.support_tickets.map(t => 
        t.id === selectedTicket.id
          ? {
              ...t,
              admin_response: adminResponse.trim(),
              status: 'answered' as const,
              responded_at: new Date().toISOString(),
            }
          : t
      );

      const { error } = await supabase
        .from('widgets')
        .update({ 
          support_tickets: updatedTickets as unknown as null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', widget.id);

      if (error) throw error;

      // Call webhook
      try {
        await fetch('https://n8n.botmotion.ai/webhook/ticket-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'no-cors',
          body: JSON.stringify({
            ticket_id: selectedTicket.id,
            user_email: selectedTicket.user_email,
            subject: selectedTicket.subject,
            admin_response: adminResponse.trim(),
          }),
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }

      toast({
        title: "Uspešno",
        description: "Odgovor je bil poslan.",
      });

      setSelectedTicket(null);
      setAdminResponse('');
      fetchWidgets();
    } catch (err) {
      console.error('Error responding:', err);
      toast({
        title: "Napaka",
        description: "Napaka pri pošiljanju odgovora.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    setSubmitting(true);

    try {
      const widget = widgets.find(w => w.id === selectedTicket.widget_id);
      if (!widget) throw new Error('Widget not found');

      const updatedTickets = widget.support_tickets.map(t => 
        t.id === selectedTicket.id
          ? { ...t, status: 'closed' as const }
          : t
      );

      const { error } = await supabase
        .from('widgets')
        .update({ 
          support_tickets: updatedTickets as unknown as null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', widget.id);

      if (error) throw error;

      toast({
        title: "Uspešno",
        description: "Ticket je bil zaprt.",
      });

      setSelectedTicket(null);
      fetchWidgets();
    } catch (err) {
      console.error('Error closing ticket:', err);
      toast({
        title: "Napaka",
        description: "Napaka pri zapiranju ticketa.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">Odprto</Badge>;
      case 'answered':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400">Odgovorjeno</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Zaprto</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Nujno</Badge>;
      case 'high':
        return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">Visoka</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normalna</Badge>;
      case 'low':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Nizka</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Support Ticketi</h1>
          <p className="text-muted-foreground">Upravljanje uporabniških ticketov</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vsi statusi</SelectItem>
              <SelectItem value="open">Odprti</SelectItem>
              <SelectItem value="answered">Odgovorjeni</SelectItem>
              <SelectItem value="closed">Zaprti</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Prioriteta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vse prioritete</SelectItem>
              <SelectItem value="urgent">Nujno</SelectItem>
              <SelectItem value="high">Visoka</SelectItem>
              <SelectItem value="normal">Normalna</SelectItem>
              <SelectItem value="low">Nizka</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Skupaj</p>
            <p className="text-2xl font-bold">{allTickets.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Odprti</p>
            <p className="text-2xl font-bold text-yellow-400">
              {allTickets.filter(t => t.status === 'open').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Odgovorjeni</p>
            <p className="text-2xl font-bold text-green-400">
              {allTickets.filter(t => t.status === 'answered').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Zaprti</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {allTickets.filter(t => t.status === 'closed').length}
            </p>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-card border border-border rounded-lg">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ni ticketov za prikaz.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTickets.map((ticket) => (
                <div
                  key={`${ticket.widget_id}-${ticket.id}`}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setAdminResponse(ticket.admin_response || '');
                  }}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{ticket.subject}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{ticket.user_email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(ticket.created_at), 'd. MMM yyyy, HH:mm', { locale: sl })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedTicket.subject}</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Uporabnik</p>
                  <p className="font-medium">{selectedTicket.user_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ustvarjeno</p>
                  <p className="font-medium">
                    {format(new Date(selectedTicket.created_at), 'd. MMM yyyy, HH:mm', { locale: sl })}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Sporočilo uporabnika:</p>
                <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {selectedTicket.status !== 'closed' && (
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Vaš odgovor:</label>
                  <Textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Vnesite odgovor..."
                    rows={5}
                  />
                </div>
              )}

              {selectedTicket.admin_response && selectedTicket.status !== 'open' && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-400 mb-1">Vaš prejšnji odgovor:</p>
                  <p className="whitespace-pre-wrap">{selectedTicket.admin_response}</p>
                  {selectedTicket.responded_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Odgovorjeno: {format(new Date(selectedTicket.responded_at), 'd. MMM yyyy, HH:mm', { locale: sl })}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              {selectedTicket.status !== 'closed' && (
                <>
                  <Button onClick={handleRespond} disabled={submitting} className="flex-1">
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Odgovori
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCloseTicket} disabled={submitting}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Zapri ticket
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={() => setSelectedTicket(null)}>
                Prekliči
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
