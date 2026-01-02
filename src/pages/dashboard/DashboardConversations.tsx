import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  AlertCircle,
  Loader2,
  CalendarIcon,
  Download,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWidget } from '@/hooks/useWidget';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useConversations, type Message } from '@/hooks/useConversations';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';

export default function DashboardConversations() {
  const { widget, loading } = useWidget();
  const tableName = widget?.table_name;
  const { stats } = useDashboardStats(tableName);
  const { conversations, loading: convsLoading, loadingMore, hasMore, loadMore, fetchMessages, fetchAllConversations } = useConversations(tableName);
  
  const conversationsListRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const usagePercentage = stats.monthlyLimit > 0 
    ? Math.round((stats.humanMessagesCount / stats.monthlyLimit) * 100) 
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
    if (dateFilter === 'all') return true;
    
    const convDate = new Date(conv.last_message_at);
    const now = new Date();
    
    if (dateFilter === '7days') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return convDate >= weekAgo;
    }
    
    if (dateFilter === '30days') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return convDate >= monthAgo;
    }
    
    if (dateFilter === 'custom' && customDateRange) {
      if (customDateRange.from && convDate < customDateRange.from) return false;
      if (customDateRange.to) {
        const endOfDay = new Date(customDateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        if (convDate > endOfDay) return false;
      }
    }
    
    return true;
  });

  // Calculate display count
  const displayCount = hasMore 
    ? `${filteredConversations.length}+` 
    : `${filteredConversations.length}`;

  const getDateRangeLabel = () => {
    if (dateFilter === 'all') return 'Vsi pogovori';
    if (dateFilter === '7days') return 'Zadnjih 7 dni';
    if (dateFilter === '30days') return 'Zadnjih 30 dni';
    if (dateFilter === 'custom' && customDateRange) {
      const from = customDateRange.from ? format(customDateRange.from, 'dd. MM. yyyy', { locale: sl }) : '';
      const to = customDateRange.to ? format(customDateRange.to, 'dd. MM. yyyy', { locale: sl }) : '';
      return `${from} - ${to}`;
    }
    return 'Neznano obdobje';
  };

  const exportToCSV = (messages: Array<{ session_id: string; date: string; type: string; content: string }>) => {
    const headers = ['Session ID', 'Datum', 'Pošiljatelj', 'Sporočilo'];
    const csvContent = [
      headers.join(','),
      ...messages.map(m => [
        `"${m.session_id}"`,
        `"${m.date}"`,
        `"${m.type}"`,
        `"${m.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pogovori_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (messages: Array<{ session_id: string; date: string; type: string; content: string }>) => {
    const grouped: Record<string, Array<{ session_id: string; date: string; type: string; content: string }>> = {};
    messages.forEach(m => {
      if (!grouped[m.session_id]) grouped[m.session_id] = [];
      grouped[m.session_id].push(m);
    });
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Pogovori - BotMotion</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .message { margin: 10px 0; padding: 10px; border-radius: 8px; }
          .user { background: #dbeafe; }
          .bot { background: #f3f4f6; }
          .meta { font-size: 12px; color: #6b7280; margin-top: 5px; }
          .period { color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>Pogovori - BotMotion</h1>
        <p class="period">Obdobje: ${getDateRangeLabel()}</p>
        <p class="period">Število pogovorov: ${Object.keys(grouped).length}</p>
    `;
    
    Object.entries(grouped).forEach(([, msgs], index) => {
      html += `<h2>Pogovor #${index + 1}</h2>`;
      msgs.forEach(m => {
        const msgClass = m.type === 'Uporabnik' ? 'user' : 'bot';
        html += `
          <div class="message ${msgClass}">
            <strong>${m.type}:</strong> ${m.content}
            <div class="meta">${m.date}</div>
          </div>
        `;
      });
    });
    
    html += '</body></html>';
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExport = async (formatType: 'csv' | 'pdf') => {
    setExporting(true);
    
    try {
      // Določi date filter glede na izbrano obdobje
      let exportDateFilter: { from?: Date; to?: Date; days?: number } | undefined;
      
      if (dateFilter === '7days') {
        exportDateFilter = { days: 7 };
      } else if (dateFilter === '30days') {
        exportDateFilter = { days: 30 };
      } else if (dateFilter === 'custom' && customDateRange) {
        exportDateFilter = {
          from: customDateRange.from,
          to: customDateRange.to
        };
      }
      
      toast({
        title: 'Pripravljam izvoz...',
        description: 'Nalagam vse pogovore za izbrano obdobje.'
      });
      
      // Fetch VSE pogovore za izbrano obdobje
      const allConversations = await fetchAllConversations(exportDateFilter);
      
      if (allConversations.length === 0) {
        toast({
          title: 'Ni pogovorov',
          description: 'Za izbrano obdobje ni pogovorov za izvoz.',
          variant: 'destructive'
        });
        setExporting(false);
        return;
      }
      
      const allMessages: Array<{ session_id: string; date: string; type: string; content: string }> = [];
      let processed = 0;
      
      for (const conv of allConversations) {
        const msgs = await fetchMessages(conv.session_id);
        msgs.forEach(msg => {
          let content = '';
          let type = '';
          
          if (typeof msg.message === 'object' && msg.message !== null) {
            content = (msg.message as any).content || (msg.message as any).text || '';
            type = (msg.message as any).type === 'human' ? 'Uporabnik' : 'Bot';
          } else {
            content = String(msg.message || '');
            type = 'Neznano';
          }
          
          allMessages.push({
            session_id: conv.session_id,
            date: new Date(msg.created_at).toLocaleString('sl-SI'),
            type,
            content
          });
        });
        
        processed++;
        if (processed % 10 === 0) {
          console.log(`Processed ${processed}/${allConversations.length} conversations`);
        }
      }
      
      if (formatType === 'csv') {
        exportToCSV(allMessages);
      } else {
        exportToPDF(allMessages);
      }
      
      toast({
        title: 'Izvoz uspešen',
        description: `Izvoženih ${allConversations.length} pogovorov v ${formatType.toUpperCase()} format.`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Napaka pri izvozu',
        description: 'Prišlo je do napake pri izvozu pogovorov.',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Pogovori" subtitle="Preglejte vse pogovore z vašim chatbotom">
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pogovori" subtitle="Preglejte vse pogovore z vašim chatbotom">
      {/* Export loading overlay */}
      {exporting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border rounded-xl p-6 flex flex-col items-center gap-4 shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-foreground font-medium">Izvažam pogovore...</span>
            <span className="text-sm text-muted-foreground">To lahko traja nekaj trenutkov</span>
          </div>
        </div>
      )}
      <div className="space-y-6 animate-slide-up">
        {/* Usage Progress */}
        <div className="bg-muted rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">Poraba sporočil</span>
            <span className="text-sm font-semibold text-foreground">
              {stats.humanMessagesCount} / {stats.monthlyLimit} sporočil
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

        {/* Filter gumbi in izvoz */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
            {[
              { key: 'all', label: 'Vsi pogovori' },
              { key: '7days', label: 'Zadnjih 7 dni' },
              { key: '30days', label: 'Zadnjih 30 dni' },
            ].map((filter) => (
              <Button 
                key={filter.key}
                variant={dateFilter === filter.key ? 'default' : 'outline'} 
                size="sm"
                className="transition-all"
                onClick={() => {
                  setDateFilter(filter.key as any);
                  setCustomDateRange(undefined);
                }}
              >
                {filter.label}
              </Button>
            ))}
            
            {/* Custom Date Range Picker */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={dateFilter === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "transition-all min-w-[200px] justify-start text-left font-normal",
                    !customDateRange && dateFilter !== 'custom' && "text-muted-foreground"
                  )}
                  onClick={() => setDateFilter('custom')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange?.from ? (
                    customDateRange.to ? (
                      <>
                        {format(customDateRange.from, "dd. MM. yyyy", { locale: sl })} - {format(customDateRange.to, "dd. MM. yyyy", { locale: sl })}
                      </>
                    ) : (
                      format(customDateRange.from, "dd. MM. yyyy", { locale: sl })
                    )
                  ) : (
                    "Izberi obdobje"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={customDateRange?.from}
                  selected={customDateRange}
                  onSelect={(range) => {
                    setCustomDateRange(range);
                    if (range?.from && range?.to) {
                      setCalendarOpen(false);
                    }
                  }}
                  numberOfMonths={2}
                  locale={sl}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Gumb za izvoz z dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="default" 
                size="sm"
                disabled={exporting || filteredConversations.length === 0}
              >
                {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Prenesi pogovore
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Levi panel - seznam pogovorov */}
          <div className="bg-card border border-border shadow-lg rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: '400px', maxHeight: 'calc(100vh - 380px)' }}>
            <div className="p-3 sm:p-4 border-b border-border bg-muted/50">
              <h3 className="font-medium text-foreground text-sm sm:text-base">Pogovori ({displayCount})</h3>
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
                      <div className="space-y-2">
                        {/* First question - bold */}
                        <p className="font-medium text-sm text-foreground line-clamp-2">
                          {conv.first_question || `Pogovor #${conv.session_id.split('_').pop()?.slice(0, 8)}`}
                        </p>
                        
                        {/* First answer - normal */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {conv.first_answer || 'Ni odgovora'}
                        </p>
                        
                        {/* Meta info */}
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-xs text-muted-foreground">
                            {conv.message_count} sporočil
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(conv.last_message_at).toLocaleDateString('sl-SI')}
                          </span>
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
                <div className="flex-1 flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                  <p>Ni pogovorov</p>
                </div>
              )}
            </div>
          </div>

          {/* Desni panel - sporočila */}
          <div className="bg-card border border-border shadow-lg rounded-2xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 320px)' }}>
            <div className="p-4 border-b border-border bg-muted/50">
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
                      let messageContent = '';
                      let isUser = false;
                      
                      if (typeof msg.message === 'object' && msg.message !== null) {
                        messageContent = msg.message.content || msg.message.text || JSON.stringify(msg.message);
                        isUser = (msg.message as any).type === 'human';
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
