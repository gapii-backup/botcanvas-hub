import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useWidget } from '@/hooks/useWidget';
import { useLeads } from '@/hooks/useLeads';
import { useConversations, type Message } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';
import { format, startOfMonth, startOfDay } from 'date-fns';
import { sl } from 'date-fns/locale';
import {
  Lock,
  Users,
  Calendar,
  CalendarDays,
  Search,
  MessageSquare,
  Loader2,
  Mail,
} from 'lucide-react';

export default function DashboardContacts() {
  const navigate = useNavigate();
  const { widget, loading } = useWidget();
  const tableName = widget?.table_name;
  const { leads, loading: leadsLoading } = useLeads(tableName);
  const { fetchMessages } = useConversations(tableName);
  const hasContactsAddon = Array.isArray(widget?.addons) && widget.addons.includes('contacts');

  // State
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Filter leads by search
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    const query = searchQuery.toLowerCase();
    return leads.filter(lead => 
      lead.email?.toLowerCase().includes(query)
    );
  }, [leads, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = leads.length;
    const today = startOfDay(new Date());
    const thisMonth = startOfMonth(new Date());
    
    const todayCount = leads.filter(lead => 
      new Date(lead.created_at) >= today
    ).length;
    
    const monthCount = leads.filter(lead => 
      new Date(lead.created_at) >= thisMonth
    ).length;

    return { total, todayCount, monthCount };
  }, [leads]);

  // Handle lead selection
  const handleSelectLead = async (sessionId: string) => {
    setSelectedLead(sessionId);
    setMessagesLoading(true);
    try {
      const msgs = await fetchMessages(sessionId);
      setMessages(msgs || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Parse message content
  const getMessageContent = (message: Message['message']): string => {
    if (typeof message === 'string') {
      try {
        const parsed = JSON.parse(message);
        return parsed.content || parsed.text || message;
      } catch {
        return message;
      }
    }
    return message?.content || message?.text || '';
  };

  // Get message type
  const getMessageType = (message: Message['message']): 'human' | 'ai' => {
    if (typeof message === 'string') {
      try {
        const parsed = JSON.parse(message);
        return parsed.type === 'human' ? 'human' : 'ai';
      } catch {
        return 'ai';
      }
    }
    return message?.role === 'human' || (message as any)?.type === 'human' ? 'human' : 'ai';
  };

  if (loading || leadsLoading) {
    return (
      <DashboardLayout title="Kontakti" subtitle="Zbrani kontakti iz pogovorov">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-[600px]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasContactsAddon) {
    return (
      <DashboardLayout title="Kontakti" subtitle="Zbrani kontakti iz pogovorov">
        <div className="glass rounded-2xl p-12 animate-slide-up">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Odklenite zbiranje kontaktov
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Z nadgradnjo paketa omogočite zbiranje email naslovov vaših uporabnikov in 
              pregledujte njihove pogovore na enem mestu.
            </p>
            <Button onClick={() => navigate('/pricing')} size="lg">
              Nadgradi paket
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Kontakti" subtitle="Zbrani kontakti iz pogovorov">
      <div className="space-y-6 animate-slide-up">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Skupaj kontaktov</p>
              </div>
            </div>
          </div>
          
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.monthCount}</p>
                <p className="text-sm text-muted-foreground">Ta mesec</p>
              </div>
            </div>
          </div>
          
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.todayCount}</p>
                <p className="text-sm text-muted-foreground">Danes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Panel Layout */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex h-[600px]">
            {/* Left Panel - Contacts List */}
            <div className="w-full md:w-1/3 border-r border-border flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Išči po emailu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Contacts List */}
              <div className="flex-1 overflow-y-auto">
                {filteredLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'Ni rezultatov za iskanje'
                        : 'Še ni zbranih kontaktov. Ko bo uporabnik pustil email v chatbotu, se bo prikazal tukaj.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredLeads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => handleSelectLead(lead.session_id)}
                        className={cn(
                          "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                          selectedLead === lead.session_id && "bg-primary/10"
                        )}
                      >
                        <p className="font-medium text-foreground truncate">
                          {lead.email || 'Brez emaila'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(lead.created_at), "d. MMM yyyy, HH:mm", { locale: sl })}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Conversation */}
            <div className="hidden md:flex md:w-2/3 flex-col">
              {!selectedLead ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Izberite kontakt za prikaz pogovora
                    </p>
                  </div>
                </div>
              ) : messagesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Ni sporočil za ta pogovor
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => {
                    const content = getMessageContent(msg.message);
                    const type = getMessageType(msg.message);
                    const isHuman = type === 'human';

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          isHuman ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-3",
                            isHuman
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {content}
                          </p>
                          <p
                            className={cn(
                              "text-xs mt-2",
                              isHuman ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                          >
                            {format(new Date(msg.created_at), "HH:mm", { locale: sl })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
