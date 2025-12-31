import { useState } from 'react';
import { Mail, Send, Clock, MessageSquare, AlertCircle, ChevronRight, X } from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import type { SupportTicketItem } from '@/types/supportTicket';

export default function DashboardHelp() {
  const { widget, loading, fetchWidget } = useWidget();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);

  const tickets: SupportTicketItem[] = Array.isArray(widget?.support_tickets) 
    ? (widget.support_tickets as unknown as SupportTicketItem[])
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!widget) return;
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Napaka",
        description: "Izpolnite vsa obvezna polja.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const newTicket: SupportTicketItem = {
        id: crypto.randomUUID(),
        subject: subject.trim(),
        message: message.trim(),
        priority,
        status: 'open',
        admin_response: null,
        created_at: new Date().toISOString(),
        responded_at: null,
      };

      const updatedTickets = [newTicket, ...tickets];

      // Update widget with new ticket
      const { error: updateError } = await supabase
        .from('widgets')
        .update({ 
          support_tickets: updatedTickets as unknown as null,
          updated_at: new Date().toISOString()
        })
        .eq('id', widget.id);

      if (updateError) throw updateError;

      // Call webhook
      try {
        await fetch('https://n8n.botmotion.ai/webhook/support-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'no-cors',
          body: JSON.stringify({
            widget_id: widget.id,
            user_email: widget.user_email,
            subject: newTicket.subject,
            priority: newTicket.priority,
            message: newTicket.message,
            ticket_id: newTicket.id,
          }),
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }

      toast({
        title: "Uspešno",
        description: "Vaš ticket je bil poslan.",
      });

      setSubject('');
      setMessage('');
      setPriority('normal');
      fetchWidget();
    } catch (err) {
      console.error('Error submitting ticket:', err);
      toast({
        title: "Napaka",
        description: "Napaka pri pošiljanju ticketa.",
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
      <DashboardLayout title="Pomoč" subtitle="Kontaktne informacije in podpora">
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pomoč" subtitle="Kontaktne informacije in podpora">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
        {/* New Ticket Form */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Nov ticket</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Zadeva *</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Kratko opišite težavo..."
                required
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Prioriteta</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Nizka</SelectItem>
                  <SelectItem value="normal">Normalna</SelectItem>
                  <SelectItem value="high">Visoka</SelectItem>
                  <SelectItem value="urgent">Nujno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Sporočilo *</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Podrobno opišite vašo težavo ali vprašanje..."
                rows={5}
                required
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Pošlji
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Lahko nas kontaktirate tudi na{' '}
              <a href="mailto:info@botmotion.ai" className="text-primary hover:underline">
                info@botmotion.ai
              </a>
            </p>
          </div>
        </div>

        {/* Tickets List */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Moji ticketi</h2>
            <span className="text-sm text-muted-foreground">({tickets.length})</span>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nimate še nobenih ticketov.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{ticket.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(ticket.created_at), 'd. MMM yyyy, HH:mm', { locale: sl })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(ticket.status)}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedTicket.created_at), 'd. MMM yyyy, HH:mm', { locale: sl })}
                </span>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Vaše sporočilo:</p>
                <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {selectedTicket.admin_response && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-400 mb-1">Odgovor podpore:</p>
                  <p className="whitespace-pre-wrap">{selectedTicket.admin_response}</p>
                  {selectedTicket.responded_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Odgovorjeno: {format(new Date(selectedTicket.responded_at), 'd. MMM yyyy, HH:mm', { locale: sl })}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border">
              <Button variant="outline" onClick={() => setSelectedTicket(null)} className="w-full">
                Zapri
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
