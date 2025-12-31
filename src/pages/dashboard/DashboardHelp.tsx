import { useState } from 'react';
import { Mail, Send, ChevronRight, Clock, CheckCircle, MessageCircle, AlertCircle } from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { useUserSupportTickets, UserSupportTicket } from '@/hooks/useUserSupportTickets';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';

const priorityLabels: Record<string, string> = {
  low: 'Nizka',
  normal: 'Normalna',
  high: 'Visoka',
  urgent: 'Nujna',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  urgent: 'bg-red-500/20 text-red-400',
};

const statusLabels: Record<string, string> = {
  open: 'Odprt',
  answered: 'Odgovorjen',
  closed: 'Zaprt',
};

const statusIcons: Record<string, React.ReactNode> = {
  open: <Clock className="h-4 w-4" />,
  answered: <MessageCircle className="h-4 w-4" />,
  closed: <CheckCircle className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500/20 text-yellow-400',
  answered: 'bg-green-500/20 text-green-400',
  closed: 'bg-muted text-muted-foreground',
};

export default function DashboardHelp() {
  const { widget, loading: widgetLoading } = useWidget();
  const { user } = useAuth();
  const { tickets, loading: ticketsLoading, refetch } = useUserSupportTickets(widget?.id);
  
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('normal');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<UserSupportTicket | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error('Prosim izpolnite vsa obvezna polja');
      return;
    }

    if (!widget?.id || !user?.email) {
      toast.error('Napaka pri pridobivanju podatkov uporabnika');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch('https://n8n.botmotion.ai/webhook/support-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          widget_id: widget.id,
          user_email: user.email,
          subject: subject.trim(),
          priority,
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit ticket');
      }

      toast.success('Ticket uspešno poslan!');
      setSubject('');
      setPriority('normal');
      setMessage('');
      refetch();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('Napaka pri pošiljanju ticketa');
    } finally {
      setSubmitting(false);
    }
  };

  if (widgetLoading || ticketsLoading) {
    return (
      <DashboardLayout title="Pomoč" subtitle="Kontaktne informacije in podpora">
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pomoč" subtitle="Kontaktne informacije in podpora">
      <div className="space-y-6">
        {/* Contact info */}
        <div className="glass rounded-2xl p-6 animate-slide-up">
          <div className="text-center py-4">
            <Mail className="h-10 w-10 mx-auto mb-3 text-primary opacity-75" />
            <p className="text-muted-foreground mb-2">Splošna vprašanja:</p>
            <a 
              href="mailto:info@botmotion.ai" 
              className="text-primary hover:underline text-lg font-medium"
            >
              info@botmotion.ai
            </a>
          </div>
        </div>

        {/* New ticket form */}
        <div className="glass rounded-2xl p-6 animate-slide-up">
          <h3 className="text-lg font-semibold text-foreground mb-4">Nov Support Ticket</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Zadeva *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Kratko opišite problem..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Prioriteta</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Nizka</SelectItem>
                  <SelectItem value="normal">Normalna</SelectItem>
                  <SelectItem value="high">Visoka</SelectItem>
                  <SelectItem value="urgent">Nujna</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Sporočilo *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Podrobno opišite vaš problem ali vprašanje..."
                rows={5}
                required
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                'Pošiljam...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Pošlji
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Ticket history */}
        <div className="glass rounded-2xl p-6 animate-slide-up">
          <h3 className="text-lg font-semibold text-foreground mb-4">Vaši ticketi</h3>
          
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nimate še nobenih ticketov</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket.ticket_id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full text-left p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {ticket.subject || 'Brez zadeve'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(ticket.created_at), 'dd. MMM yyyy, HH:mm', { locale: sl })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={priorityColors[ticket.priority]}>
                        {priorityLabels[ticket.priority]}
                      </Badge>
                      <Badge className={statusColors[ticket.status]}>
                        {statusIcons[ticket.status]}
                        <span className="ml-1">{statusLabels[ticket.status]}</span>
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket detail dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject || 'Brez zadeve'}</DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={priorityColors[selectedTicket.priority]}>
                  {priorityLabels[selectedTicket.priority]}
                </Badge>
                <Badge className={statusColors[selectedTicket.status]}>
                  {statusIcons[selectedTicket.status]}
                  <span className="ml-1">{statusLabels[selectedTicket.status]}</span>
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Poslano: {format(new Date(selectedTicket.created_at), 'dd. MMM yyyy, HH:mm', { locale: sl })}
              </p>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Vaše sporočilo:</p>
                <p className="text-foreground whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {selectedTicket.admin_response && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-sm font-medium text-green-400 mb-2">
                    Odgovor podpore:
                    {selectedTicket.responded_at && (
                      <span className="font-normal ml-2">
                        ({format(new Date(selectedTicket.responded_at), 'dd. MMM yyyy, HH:mm', { locale: sl })})
                      </span>
                    )}
                  </p>
                  <p className="text-foreground whitespace-pre-wrap">{selectedTicket.admin_response}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
