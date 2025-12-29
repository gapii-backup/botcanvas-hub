import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LockedFeature } from '@/components/dashboard/LockedFeature';
import { useWidget } from '@/hooks/useWidget';
import { useLeads } from '@/hooks/useLeads';
import { useConversations, type Message } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';
import { format, startOfMonth, startOfDay, subDays } from 'date-fns';
import { sl } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Lock,
  Users,
  Calendar,
  CalendarDays,
  Search,
  MessageSquare,
  Loader2,
  Mail,
  CalendarIcon,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

type DateFilter = 'all' | '7days' | '30days' | 'custom';

export default function DashboardContacts() {
  const navigate = useNavigate();
  const { widget, loading } = useWidget();
  const hasAccess = widget?.plan === 'pro' || widget?.plan === 'enterprise';
  const tableName = widget?.table_name;
  const { leads, loading: leadsLoading } = useLeads(tableName);
  const { fetchMessages } = useConversations(tableName);

  // State
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [exporting, setExporting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Get unique leads (one per email, most recent) - for statistics and export
  const uniqueLeads = useMemo(() => {
    return Object.values(
      leads.reduce((acc, lead) => {
        const email = lead.email || '';
        if (!acc[email] || new Date(lead.created_at) > new Date(acc[email].created_at)) {
          acc[email] = lead;
        }
        return acc;
      }, {} as Record<string, typeof leads[0]>)
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [leads]);

  // Filter ALL leads by search and date - for display list
  const displayLeads = useMemo(() => {
    let result = leads;
    
    // Date filter
    if (dateFilter === '7days') {
      const sevenDaysAgo = subDays(new Date(), 7);
      result = result.filter(lead => new Date(lead.created_at) >= sevenDaysAgo);
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = subDays(new Date(), 30);
      result = result.filter(lead => new Date(lead.created_at) >= thirtyDaysAgo);
    } else if (dateFilter === 'custom' && customDateRange?.from) {
      const from = startOfDay(customDateRange.from);
      const to = customDateRange.to ? startOfDay(new Date(customDateRange.to.getTime() + 86400000)) : new Date();
      result = result.filter(lead => {
        const date = new Date(lead.created_at);
        return date >= from && date <= to;
      });
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lead => lead.email?.toLowerCase().includes(query));
    }
    
    return result;
  }, [leads, searchQuery, dateFilter, customDateRange]);

  // Filter UNIQUE leads - for export
  const filteredLeads = useMemo(() => {
    let result = uniqueLeads;
    
    // Date filter
    if (dateFilter === '7days') {
      const sevenDaysAgo = subDays(new Date(), 7);
      result = result.filter(lead => new Date(lead.created_at) >= sevenDaysAgo);
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = subDays(new Date(), 30);
      result = result.filter(lead => new Date(lead.created_at) >= thirtyDaysAgo);
    } else if (dateFilter === 'custom' && customDateRange?.from) {
      const from = startOfDay(customDateRange.from);
      const to = customDateRange.to ? startOfDay(new Date(customDateRange.to.getTime() + 86400000)) : new Date();
      result = result.filter(lead => {
        const date = new Date(lead.created_at);
        return date >= from && date <= to;
      });
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lead => lead.email?.toLowerCase().includes(query));
    }
    
    return result;
  }, [uniqueLeads, searchQuery, dateFilter, customDateRange]);

  // Statistics - count unique emails
  const stats = useMemo(() => {
    const total = uniqueLeads.length;
    const today = startOfDay(new Date());
    const thisMonth = startOfMonth(new Date());
    
    // For today: unique emails from leads created today
    const todayLeads = leads.filter(lead => new Date(lead.created_at) >= today);
    const uniqueToday = [...new Set(todayLeads.map(lead => lead.email))].length;
    
    // For this month: unique emails from leads created this month
    const monthLeads = leads.filter(lead => new Date(lead.created_at) >= thisMonth);
    const uniqueThisMonth = [...new Set(monthLeads.map(lead => lead.email))].length;

    return { total, todayCount: uniqueToday, monthCount: uniqueThisMonth };
  }, [leads, uniqueLeads]);

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

  // Helper to sanitize text for PDF (replace Slovenian characters)
  const sanitizeForPdf = (text: string): string => {
    return text
      .replace(/č/g, 'c').replace(/Č/g, 'C')
      .replace(/š/g, 's').replace(/Š/g, 'S')
      .replace(/ž/g, 'z').replace(/Ž/g, 'Z');
  };

  // Get date range label for exports
  const getDateRangeLabel = (): string => {
    if (dateFilter === 'all') return 'Vsi kontakti';
    if (dateFilter === '7days') return 'Zadnjih 7 dni';
    if (dateFilter === '30days') return 'Zadnjih 30 dni';
    if (dateFilter === 'custom' && customDateRange?.from) {
      if (customDateRange.to) {
        return `${format(customDateRange.from, 'd. MMM yyyy', { locale: sl })} - ${format(customDateRange.to, 'd. MMM yyyy', { locale: sl })}`;
      }
      return format(customDateRange.from, 'd. MMM yyyy', { locale: sl });
    }
    return '';
  };

  // Export to CSV
  const exportCSV = async () => {
    setExporting(true);
    try {
      const BOM = '\uFEFF';
      const headers = ['Email', 'Datum'];
      const rows = filteredLeads.map(lead => [
        lead.email || '',
        new Date(lead.created_at).toLocaleString('sl-SI')
      ]);
      
      const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BotMotion-Kontakti-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  // Export to PDF
  const exportPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(18);
      doc.text('BotMotion.ai - Seznam kontaktov', pageWidth / 2, 20, { align: 'center' });
      
      // Period and date
      doc.setFontSize(11);
      doc.text(sanitizeForPdf(`Obdobje: ${getDateRangeLabel()}`), 14, 35);
      doc.text(sanitizeForPdf(`Datum: ${format(new Date(), 'd. MMMM yyyy', { locale: sl })}`), 14, 42);
      doc.text(sanitizeForPdf(`Stevilo kontaktov: ${filteredLeads.length}`), 14, 49);
      
      // Table
      const tableData = filteredLeads.map(lead => [
        lead.email || '-',
        format(new Date(lead.created_at), 'd. MMM yyyy, HH:mm', { locale: sl })
      ]);

      autoTable(doc, {
        startY: 58,
        head: [['Email', 'Datum']],
        body: tableData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`BotMotion-Kontakti-${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setExporting(false);
    }
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

  if (!hasAccess) {
    return (
      <DashboardLayout title="Kontakti" subtitle="Zbrani kontakti iz pogovorov">
        <LockedFeature 
          feature="Kontakti"
          description="Zbirajte kontaktne podatke obiskovalcev in jih izvozite v CSV ali PDF."
          addon="contacts"
        />
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

        {/* Date Filter Buttons */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={dateFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDateFilter('all');
                setCustomDateRange(undefined);
              }}
            >
              Vsi kontakti
            </Button>
            <Button
              variant={dateFilter === '7days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDateFilter('7days');
                setCustomDateRange(undefined);
              }}
            >
              Zadnjih 7 dni
            </Button>
            <Button
              variant={dateFilter === '30days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDateFilter('30days');
                setCustomDateRange(undefined);
              }}
            >
              Zadnjih 30 dni
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={dateFilter === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  {dateFilter === 'custom' && customDateRange?.from
                    ? customDateRange.to
                      ? `${format(customDateRange.from, 'd. MMM', { locale: sl })} - ${format(customDateRange.to, 'd. MMM', { locale: sl })}`
                      : format(customDateRange.from, 'd. MMM yyyy', { locale: sl })
                    : 'Izberi obdobje'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={customDateRange?.from}
                  selected={customDateRange}
                  onSelect={(range) => {
                    setCustomDateRange(range);
                    if (range?.from) {
                      setDateFilter('custom');
                    }
                  }}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2" disabled={exporting || filteredLeads.length === 0}>
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Prenesi kontakte
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportCSV} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" />
                Prenesi CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPDF} className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                Prenesi PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                {displayLeads.length === 0 ? (
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
                    {displayLeads.map((lead) => (
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
