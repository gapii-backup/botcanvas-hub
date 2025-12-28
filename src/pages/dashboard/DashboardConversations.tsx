import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  MessageSquare,
  AlertCircle,
  Loader2,
  Calendar,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWidget } from '@/hooks/useWidget';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useConversations, type Message } from '@/hooks/useConversations';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function DashboardConversations() {
  const { widget, loading } = useWidget();
  const tableName = widget?.table_name;
  const { stats } = useDashboardStats(tableName);
  const { conversations, loading: convsLoading, loadingMore, hasMore, loadMore, fetchMessages } = useConversations(tableName);
  
  const conversationsListRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days' | 'custom'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const usagePercentage = stats.monthlyLimit > 0 
    ? Math.round((stats.monthlyCount / stats.monthlyLimit) * 100) 
    : 0;

  const handleSelectConversation = async (sessionId: string) => {
    setSelectedConversation(sessionId);
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loadingMore) {
      loadMore();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (dateRange === 'all') return true;
    
    const convDate = new Date(conv.last_message_at);
    const now = new Date();
    
    if (dateRange === '7days') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return convDate >= weekAgo;
    }
    
    if (dateRange === '30days') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return convDate >= monthAgo;
    }
    
    if (dateRange === 'custom') {
      if (dateFrom && convDate < new Date(dateFrom)) return false;
      if (dateTo && convDate > new Date(dateTo + 'T23:59:59')) return false;
    }
    
    return true;
  });

  // Calculate display count
  const displayCount = hasMore 
    ? `${filteredConversations.length}+` 
    : `${filteredConversations.length}`;

  if (loading) {
    return (
      <DashboardLayout title="Pogovori" subtitle="Preglejte vse pogovore z vašim chatbotom">
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pogovori" subtitle="Preglejte vse pogovore z vašim chatbotom">
      <div className="space-y-6 animate-slide-up">
        {/* Filter gumbi */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Vsi pogovori' },
            { key: '7days', label: 'Zadnjih 7 dni' },
            { key: '30days', label: 'Zadnjih 30 dni' },
            { key: 'custom', label: 'Po meri' }
          ].map((filter) => (
            <Button 
              key={filter.key}
              variant={dateRange === filter.key ? 'default' : 'outline'} 
              size="sm"
              className="transition-all"
              onClick={() => setDateRange(filter.key as any)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        
        {/* Custom date range picker */}
        {dateRange === 'custom' && (
          <div className="flex gap-2 items-center bg-muted p-3 rounded-lg">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36 bg-background"
              placeholder="Od"
            />
            <span className="text-muted-foreground">→</span>
            <Input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36 bg-background"
              placeholder="Do"
            />
            {(dateFrom || dateTo) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Usage Progress - moved above conversation list */}
        <div className="bg-muted rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">Poraba sporočil</span>
            <span className="text-sm font-semibold text-foreground">
              {stats.monthlyCount} / {stats.monthlyLimit} sporočil
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          {usagePercentage > 80 && (
            <div className="flex items-center gap-2 text-warning text-xs mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>Približujete se mesečni omejitvi</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Levi panel - seznam pogovorov */}
          <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 420px)' }}>
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-foreground">Pogovori ({displayCount})</h3>
            </div>
            
            <div 
              ref={conversationsListRef}
              className="flex-1 overflow-y-auto"
              onScroll={handleScroll}
            >
              {convsLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Nalagam pogovore...
                </div>
              ) : filteredConversations.length > 0 ? (
                <>
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.session_id}
                      onClick={() => handleSelectConversation(conv.session_id)}
                      className={cn(
                        "p-4 border-b border-border cursor-pointer transition-all duration-200",
                        selectedConversation === conv.session_id 
                          ? "bg-primary/10 border-l-4 border-l-primary" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          selectedConversation === conv.session_id ? "bg-primary/20" : "bg-muted"
                        )}>
                          <MessageSquare className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm truncate text-foreground">
                              Pogovor #{conv.session_id.split('_').pop()?.slice(0, 8)}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {new Date(conv.last_message_at).toLocaleDateString('sl-SI')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              {conv.message_count} sporočil
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(conv.last_message_at).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading more indicator */}
                  {loadingMore && (
                    <div className="p-4 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
                      <span className="text-sm">Nalagam več pogovorov...</span>
                    </div>
                  )}
                  
                  {!hasMore && conversations.length > 0 && (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Vsi pogovori naloženi
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Ni pogovorov</p>
                </div>
              )}
            </div>
          </div>

          {/* Desni panel - sporočila */}
          <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 420px)' }}>
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-foreground truncate">
                {selectedConversation ? `Pogovor #${selectedConversation.split('_').pop()?.slice(0, 8)}` : 'Izberite pogovor'}
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {selectedConversation ? (
                messagesLoading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg, index) => {
                      // Parse message - lahko je JSONB objekt ali string
                      let messageContent = '';
                      let isUser = false;
                      
                      // Debug - log the full message structure
                      console.log('Full message object:', JSON.stringify(msg.message));
                      
                      if (typeof msg.message === 'object' && msg.message !== null) {
                        // Preveri različne možne strukture
                        messageContent = msg.message.content || msg.message.text || JSON.stringify(msg.message);
                        // Preveri role - lahko je 'user', 'human', 'customer', 'sender' itd.
                        isUser = msg.message.role === 'user' || 
                                 msg.message.role === 'human' || 
                                 msg.message.role === 'customer' ||
                                 (msg.message as any).sender === 'user' ||
                                 (msg.message as any).type === 'user' ||
                                 (msg.message as any).from === 'user';
                      } else {
                        messageContent = String(msg.message || '');
                      }
                      
                      if (!messageContent.trim()) return null;
                      
                      return (
                        <div
                          key={msg.id || index}
                          className={cn(
                            "flex w-full",
                            isUser ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] p-4 rounded-2xl shadow-sm",
                              isUser
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-card border border-border rounded-bl-sm"
                            )}
                          >
                            <div 
                              className="text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{ 
                                __html: messageContent
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/^\* /gm, '• ')
                                  .replace(/^- /gm, '• ')
                                  .replace(/\n/g, '<br/>') 
                              }}
                            />
                            <span className={cn(
                              "text-xs mt-2 block",
                              isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {new Date(msg.created_at).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Ni sporočil v tem pogovoru
                  </div>
                )
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Izberite pogovor iz seznama na levi</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
