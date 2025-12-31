import { useState, useRef, useEffect } from 'react';
import { Mail, Send, Clock, MessageSquare, AlertCircle, ArrowLeft, Paperclip, X } from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import type { SupportTicketItem, TicketMessage } from '@/types/supportTicket';

// Helper to migrate old ticket format to new format
const migrateTicket = (ticket: any): SupportTicketItem => {
  // If ticket already has messages array, return as-is
  if (Array.isArray(ticket.messages)) {
    return ticket as SupportTicketItem;
  }
  
  // Migrate old format to new format
  const messages: TicketMessage[] = [];
  
  // Add original message
  if (ticket.message) {
    messages.push({
      id: crypto.randomUUID(),
      sender: 'user',
      message: ticket.message,
      attachments: [],
      created_at: ticket.created_at,
    });
  }
  
  // Add admin response if exists
  if (ticket.admin_response) {
    messages.push({
      id: crypto.randomUUID(),
      sender: 'admin',
      message: ticket.admin_response,
      attachments: [],
      created_at: ticket.responded_at || ticket.created_at,
    });
  }
  
  return {
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    created_at: ticket.created_at,
    messages,
  };
};

export default function DashboardHelp() {
  const { widget, loading, fetchWidget } = useWidget();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tickets: SupportTicketItem[] = Array.isArray(widget?.support_tickets) 
    ? (widget.support_tickets as unknown as any[]).map(migrateTicket)
    : [];

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  useEffect(() => {
    if (selectedTicket && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages?.length]);

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('bot-avatars')
        .upload(`tickets/${widget?.id}/${fileName}`, file);
      
      if (error) {
        console.error('Upload error:', error);
        continue;
      }
      
      const { data: publicUrl } = supabase.storage
        .from('bot-avatars')
        .getPublicUrl(`tickets/${widget?.id}/${fileName}`);
      
      if (publicUrl) {
        urls.push(publicUrl.publicUrl);
      }
    }
    return urls;
  };

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
      const attachmentUrls = await uploadFiles(newAttachments);

      const newTicket: SupportTicketItem = {
        id: crypto.randomUUID(),
        subject: subject.trim(),
        status: 'open',
        created_at: new Date().toISOString(),
        messages: [{
          id: crypto.randomUUID(),
          sender: 'user',
          message: message.trim(),
          attachments: attachmentUrls,
          created_at: new Date().toISOString(),
        }],
      };

      const updatedTickets = [newTicket, ...tickets];

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
            message: message.trim(),
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
      setNewAttachments([]);
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

  const handleReply = async () => {
    if (!widget || !selectedTicket || !replyMessage.trim()) {
      toast({
        title: "Napaka",
        description: "Vnesite sporočilo.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const attachmentUrls = await uploadFiles(replyAttachments);

      const newMessage: TicketMessage = {
        id: crypto.randomUUID(),
        sender: 'user',
        message: replyMessage.trim(),
        attachments: attachmentUrls,
        created_at: new Date().toISOString(),
      };

      const updatedTickets = tickets.map(t => 
        t.id === selectedTicket.id
          ? {
              ...t,
              status: 'open' as const,
              messages: [...t.messages, newMessage],
            }
          : t
      );

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
            subject: selectedTicket.subject,
            message: replyMessage.trim(),
            ticket_id: selectedTicket.id,
          }),
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }

      toast({
        title: "Uspešno",
        description: "Sporočilo je bilo poslano.",
      });

      setReplyMessage('');
      setReplyAttachments([]);
      fetchWidget();
    } catch (err) {
      console.error('Error sending reply:', err);
      toast({
        title: "Napaka",
        description: "Napaka pri pošiljanju sporočila.",
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
    if (ticket.messages.length === 0) return '';
    const lastMsg = ticket.messages[ticket.messages.length - 1];
    const prefix = lastMsg.sender === 'admin' ? 'Podpora: ' : 'Vi: ';
    const text = lastMsg.message.length > 50 
      ? lastMsg.message.substring(0, 50) + '...' 
      : lastMsg.message;
    return prefix + text;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean) => {
    const files = Array.from(e.target.files || []);
    if (isReply) {
      setReplyAttachments(prev => [...prev, ...files]);
    } else {
      setNewAttachments(prev => [...prev, ...files]);
    }
  };

  const removeAttachment = (index: number, isReply: boolean) => {
    if (isReply) {
      setReplyAttachments(prev => prev.filter((_, i) => i !== index));
    } else {
      setNewAttachments(prev => prev.filter((_, i) => i !== index));
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
              <label className="text-sm text-muted-foreground mb-1 block">Sporočilo *</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Podrobno opišite vašo težavo ali vprašanje..."
                rows={5}
                required
              />
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e, false)}
                multiple
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Dodaj prilogo
              </Button>
              {newAttachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {newAttachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                      <span className="truncate flex-1">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeAttachment(index, false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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

        {/* Tickets List / Detail */}
        <div className="glass rounded-2xl p-6">
          {selectedTicket ? (
            <>
              {/* Ticket Detail Header */}
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedTicketId(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <h2 className="font-semibold">Zadeva: {selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedTicket)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(selectedTicket.created_at), 'd. MMM yyyy', { locale: sl })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto mb-4 pr-2">
                {selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.sender === 'user'
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
                                msg.sender === 'user' ? 'text-primary-foreground/80' : 'text-primary'
                              }`}
                            >
                              Priloga {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                      <p className={`text-xs mt-1 ${
                        msg.sender === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
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
                <div className="space-y-2 border-t border-border pt-4">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Napišite sporočilo..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={replyFileInputRef}
                      onChange={(e) => handleFileChange(e, true)}
                      multiple
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => replyFileInputRef.current?.click()}
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
                            onClick={() => removeAttachment(index, true)}
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
            <>
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
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">Zadeva: {ticket.subject}</p>
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {getLastMessage(ticket)}
                          </p>
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
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
