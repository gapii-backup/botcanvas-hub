import { useState, useMemo } from 'react';
import { ArrowLeft, Send, XCircle, Clock, CheckCircle, MessageCircle, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminSupportTickets, AdminSupportTicket } from '@/hooks/useAdminSupportTickets';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function AdminTickets() {
  const navigate = useNavigate();
  const { tickets, loading, updateTicketResponse, closeTicket } = useAdminSupportTickets();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
      return true;
    });
  }, [tickets, statusFilter, priorityFilter]);

  const handleRespond = async () => {
    if (!selectedTicket || !response.trim()) {
      toast.error('Prosim vnesite odgovor');
      return;
    }

    setSubmitting(true);
    try {
      const success = await updateTicketResponse(selectedTicket.ticket_id, response.trim());
      
      if (success) {
        // Call webhook
        await fetch('https://n8n.botmotion.ai/webhook/ticket-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket_id: selectedTicket.ticket_id,
            user_email: selectedTicket.email,
            subject: selectedTicket.subject,
            admin_response: response.trim(),
          }),
        });

        toast.success('Odgovor uspešno poslan');
        setSelectedTicket(prev => prev ? { ...prev, admin_response: response.trim(), status: 'answered' } : null);
        setResponse('');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error responding:', error);
      toast.error('Napaka pri pošiljanju odgovora');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!selectedTicket) return;

    setSubmitting(true);
    try {
      const success = await closeTicket(selectedTicket.ticket_id);
      if (success) {
        toast.success('Ticket zaprt');
        setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
      } else {
        throw new Error('Failed to close');
      }
    } catch (error) {
      console.error('Error closing:', error);
      toast.error('Napaka pri zapiranju ticketa');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Support Ticketi</h1>
            <p className="text-muted-foreground">Upravljaj z uporabniškimi vprašanji</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Filter className="h-5 w-5 text-muted-foreground" />
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
              <SelectItem value="low">Nizka</SelectItem>
              <SelectItem value="normal">Normalna</SelectItem>
              <SelectItem value="high">Visoka</SelectItem>
              <SelectItem value="urgent">Nujna</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets list */}
        <div className="glass rounded-2xl overflow-hidden">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Ni ticketov za prikaz
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTickets.map((ticket) => (
                <button
                  key={ticket.ticket_id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setResponse(ticket.admin_response || '');
                  }}
                  className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground truncate">
                          {ticket.subject || 'Brez zadeve'}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {ticket.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject || 'Brez zadeve'}</DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              {/* Ticket info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{selectedTicket.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ime:</span>
                  <p className="font-medium">{selectedTicket.name || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ustvarjeno:</span>
                  <p className="font-medium">
                    {format(new Date(selectedTicket.created_at), 'dd. MMM yyyy, HH:mm', { locale: sl })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={priorityColors[selectedTicket.priority]}>
                    {priorityLabels[selectedTicket.priority]}
                  </Badge>
                  <Badge className={statusColors[selectedTicket.status]}>
                    {statusIcons[selectedTicket.status]}
                    <span className="ml-1">{statusLabels[selectedTicket.status]}</span>
                  </Badge>
                </div>
              </div>

              {/* User message */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Sporočilo uporabnika:</p>
                <p className="text-foreground whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {/* Existing response */}
              {selectedTicket.admin_response && selectedTicket.status !== 'open' && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-sm font-medium text-green-400 mb-2">
                    Vaš odgovor:
                    {selectedTicket.responded_at && (
                      <span className="font-normal ml-2">
                        ({format(new Date(selectedTicket.responded_at), 'dd. MMM yyyy, HH:mm', { locale: sl })})
                      </span>
                    )}
                  </p>
                  <p className="text-foreground whitespace-pre-wrap">{selectedTicket.admin_response}</p>
                </div>
              )}

              {/* Response form - only show for non-closed tickets */}
              {selectedTicket.status !== 'closed' && (
                <div className="space-y-3">
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Vpišite odgovor..."
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleRespond} disabled={submitting || !response.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      {selectedTicket.admin_response ? 'Posodobi odgovor' : 'Pošlji odgovor'}
                    </Button>
                    <Button variant="outline" onClick={handleClose} disabled={submitting}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Zapri ticket
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
