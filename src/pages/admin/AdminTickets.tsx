import { useState, useEffect, useMemo, useRef } from 'react';
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
import { MessageSquare, Clock, User, Send, CheckCircle, ArrowLeft, Paperclip, X } from 'lucide-react';
import type { SupportTicketItem, TicketMessage } from '@/types/supportTicket';

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
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      if (statusFilter === 'all') return true;
      if (statusFilter === 'open') {
        return ticket.status === 'open' && !ticket.messages.some(m => m.sender === 'admin');
      }
      if (statusFilter === 'answered') {
        return ticket.status !== 'closed' && ticket.messages.some(m => m.sender === 'admin');
      }
      if (statusFilter === 'closed') {
        return ticket.status === 'closed';
      }
      return true;
    });
  }, [allTickets, statusFilter]);

  const selectedTicket = allTickets.find(t => t.id === selectedTicketId && t.widget_id === selectedWidgetId);

  useEffect(() => {
    if (selectedTicket && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages?.length]);

  const uploadFiles = async (files: File[], widgetId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('bot-avatars')
        .upload(`tickets/${widgetId}/${fileName}`, file);
      
      if (error) {
        console.error('Upload error:', error);
        continue;
      }
      
      const { data: publicUrl } = supabase.storage
        .from('bot-avatars')
        .getPublicUrl(`tickets/${widgetId}/${fileName}`);
      
      if (publicUrl) {
        urls.push(publicUrl.publicUrl);
      }
    }
    return urls;
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) {
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

      const attachmentUrls = await uploadFiles(replyAttachments, widget.id);

      const newMessage: TicketMessage = {
        id: crypto.randomUUID(),
        sender: 'admin',
        message: replyMessage.trim(),
        attachments: attachmentUrls,
        created_at: new Date().toISOString(),
      };

      const updatedTickets = widget.support_tickets.map(t => 
        t.id === selectedTicket.id
          ? {
              ...t,
              status: 'answered' as const,
              messages: [...t.messages, newMessage],
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
            admin_response: replyMessage.trim(),
          }),
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }

      toast({
        title: "Uspešno",
        description: "Odgovor je bil poslan.",
      });

      setReplyMessage('');
      setReplyAttachments([]);
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

      setSelectedTicketId(null);
      setSelectedWidgetId(null);
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

  const getStatusBadge = (ticket: SupportTicketItem) => {
    const hasAdminResponse = ticket.messages.some(m => m.sender === 'admin');
    
    if (ticket.status === 'closed') {
      return <Badge variant="secondary" className="bg-muted text-muted-foreground">Zaprto</Badge>;
    }
    if (hasAdminResponse) {
      return <Badge variant="secondary" className="bg-green-500/20 text-green-400">Odgovorjeno</Badge>;
    }
    return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">Nov</Badge>;
  };

  const getLastMessage = (ticket: SupportTicketItem): string => {
    if (!ticket.messages || ticket.messages.length === 0) return '';
    const lastMsg = ticket.messages[ticket.messages.length - 1];
    const prefix = lastMsg.sender === 'admin' ? 'Vi: ' : 'Uporabnik: ';
    const text = lastMsg.message.length > 40 
      ? lastMsg.message.substring(0, 40) + '...' 
      : lastMsg.message;
    return prefix + text;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setReplyAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
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

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Skupaj</p>
            <p className="text-2xl font-bold">{allTickets.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Novi</p>
            <p className="text-2xl font-bold text-yellow-400">
              {allTickets.filter(t => t.status !== 'closed' && !t.messages.some(m => m.sender === 'admin')).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Odgovorjeni</p>
            <p className="text-2xl font-bold text-green-400">
              {allTickets.filter(t => t.status !== 'closed' && t.messages.some(m => m.sender === 'admin')).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Zaprti</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {allTickets.filter(t => t.status === 'closed').length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tickets List */}
          <div className="bg-card border border-border rounded-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Ticketi</h2>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vsi</SelectItem>
                  <SelectItem value="open">Novi</SelectItem>
                  <SelectItem value="answered">Odgovorjeni</SelectItem>
                  <SelectItem value="closed">Zaprti</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ni ticketov za prikaz.</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {filteredTickets.map((ticket) => (
                  <div
                    key={`${ticket.widget_id}-${ticket.id}`}
                    onClick={() => {
                      setSelectedTicketId(ticket.id);
                      setSelectedWidgetId(ticket.widget_id);
                      setReplyMessage('');
                      setReplyAttachments([]);
                    }}
                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                      selectedTicketId === ticket.id && selectedWidgetId === ticket.widget_id
                        ? 'bg-muted/50'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">Zadeva: {ticket.subject}</p>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {getLastMessage(ticket)}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{ticket.user_email}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(ticket)}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(ticket.created_at), 'd. MMM', { locale: sl })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Detail */}
          <div className="bg-card border border-border rounded-lg">
            {selectedTicket ? (
              <>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setSelectedTicketId(null);
                        setSelectedWidgetId(null);
                      }}
                      className="lg:hidden"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                      <h2 className="font-semibold">Zadeva: {selectedTicket.subject}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(selectedTicket)}
                        <span className="text-xs text-muted-foreground">
                          {selectedTicket.user_email}
                        </span>
                      </div>
                    </div>
                    {selectedTicket.status !== 'closed' && (
                      <Button variant="outline" size="sm" onClick={handleCloseTicket} disabled={submitting}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Zapri
                      </Button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
                  {selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.sender === 'admin'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs underline block ${
                                  msg.sender === 'admin' ? 'text-primary-foreground/80' : 'text-primary'
                                }`}
                              >
                                Priloga {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                        <p className={`text-xs mt-1 ${
                          msg.sender === 'admin' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                        }`}>
                          {format(new Date(msg.created_at), 'HH:mm', { locale: sl })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                {selectedTicket.status !== 'closed' && (
                  <div className="p-4 border-t border-border space-y-2">
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Napišite odgovor..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button onClick={handleReply} disabled={submitting} className="flex-1">
                        {submitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Pošlji
                          </>
                        )}
                      </Button>
                    </div>
                    {replyAttachments.length > 0 && (
                      <div className="space-y-1">
                        {replyAttachments.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                            <span className="truncate flex-1">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeAttachment(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Izberite ticket za prikaz podrobnosti.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
