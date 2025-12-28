import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, isToday, isThisMonth } from 'date-fns';
import { sl } from 'date-fns/locale';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useWidget } from '@/hooks/useWidget';
import { useSupportTickets, SupportTicket } from '@/hooks/useSupportTickets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Ticket,
  Mail,
  Phone,
  User,
  CalendarIcon,
  Clock,
  MessageSquare,
  CheckCircle2,
  Circle,
  Filter,
} from 'lucide-react';

type DateFilter = 'all' | '7days' | '30days' | 'custom';
type StatusFilter = 'all' | 'open' | 'closed';

export default function DashboardSupport() {
  const { widget, loading: widgetLoading } = useWidget();
  const { tickets, loading: ticketsLoading, updateTicketStatus } = useSupportTickets(widget?.table_name);
  const { toast } = useToast();
  
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const hasTicketsAddon = widget?.addons && Array.isArray(widget.addons) && widget.addons.includes('tickets');

  // Filter tickets
  const filteredTickets = useMemo(() => {
    let result = tickets;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    // Date filter
    if (dateFilter === '7days') {
      const sevenDaysAgo = subDays(new Date(), 7);
      result = result.filter(t => new Date(t.created_at) >= sevenDaysAgo);
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = subDays(new Date(), 30);
      result = result.filter(t => new Date(t.created_at) >= thirtyDaysAgo);
    } else if (dateFilter === 'custom' && customDateRange?.from) {
      const from = startOfDay(customDateRange.from);
      const to = customDateRange.to ? startOfDay(new Date(customDateRange.to.getTime() + 86400000)) : new Date();
      result = result.filter(t => {
        const date = new Date(t.created_at);
        return date >= from && date <= to;
      });
    }

    return result;
  }, [tickets, statusFilter, dateFilter, customDateRange]);

  // Statistics
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    return { total, open, closed };
  }, [tickets]);

  const handleStatusChange = async (newStatus: 'open' | 'closed') => {
    if (!selectedTicket) return;
    
    setUpdatingStatus(true);
    const success = await updateTicketStatus(selectedTicket.ticket_id, newStatus);
    setUpdatingStatus(false);
    
    if (success) {
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      toast({
        title: 'Status posodobljen',
        description: `Ticket je zdaj ${newStatus === 'open' ? 'odprt' : 'zaključen'}.`,
      });
    } else {
      toast({
        title: 'Napaka',
        description: 'Ni bilo mogoče posodobiti statusa.',
        variant: 'destructive',
      });
    }
  };

  const formatChatHistory = (chatHistory: string | null) => {
    if (!chatHistory) return null;
    
    const lines = chatHistory.split('\n');
    return lines.map((line, index) => {
      const isUser = line.startsWith('👤') || line.toLowerCase().includes('user:');
      const isBot = line.startsWith('🤖') || line.toLowerCase().includes('bot:');
      
      return (
        <div
          key={index}
          className={cn(
            'p-3 rounded-lg mb-2',
            isUser ? 'bg-primary/10 ml-4' : isBot ? 'bg-muted mr-4' : 'bg-muted/50'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{line}</p>
        </div>
      );
    });
  };

  const loading = widgetLoading || ticketsLoading;

  return (
    <DashboardSidebar hasContactsAddon={widget?.addons?.includes('contacts')} hasTicketsAddon={hasTicketsAddon}>
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Support Ticketi</h1>
          <p className="text-muted-foreground">Pregled in upravljanje support zahtevkov</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skupaj ticketov</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.total}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Odprti</CardTitle>
              <Circle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-500">{stats.open}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zaključeni</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.closed}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex gap-1">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Vsi
            </Button>
            <Button
              variant={statusFilter === 'open' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('open')}
            >
              Odprti
            </Button>
            <Button
              variant={statusFilter === 'closed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('closed')}
            >
              Zaključeni
            </Button>
          </div>
          
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Obdobje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vse</SelectItem>
              <SelectItem value="7days">Zadnjih 7 dni</SelectItem>
              <SelectItem value="30days">Zadnjih 30 dni</SelectItem>
              <SelectItem value="custom">Po meri</SelectItem>
            </SelectContent>
          </Select>

          {dateFilter === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {customDateRange.from ? (
                    customDateRange.to ? (
                      <>
                        {format(customDateRange.from, 'dd.MM.yyyy')} - {format(customDateRange.to, 'dd.MM.yyyy')}
                      </>
                    ) : (
                      format(customDateRange.from, 'dd.MM.yyyy')
                    )
                  ) : (
                    'Izberi obdobje'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: customDateRange.from, to: customDateRange.to }}
                  onSelect={(range) => setCustomDateRange({ from: range?.from, to: range?.to })}
                  locale={sl}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Main Content - Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Ticket List */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Seznam ticketov</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <Ticket className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {tickets.length === 0
                      ? 'Še ni support ticketov. Ko bo uporabnik oddal vprašanje preko chatbota, se bo prikazalo tukaj.'
                      : 'Ni ticketov za izbrane filtre.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={cn(
                        'w-full text-left p-4 hover:bg-muted/50 transition-colors',
                        selectedTicket?.id === ticket.id && 'bg-muted'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-foreground">#{ticket.ticket_id}</span>
                        <Badge
                          variant={ticket.status === 'open' ? 'default' : 'secondary'}
                          className={cn(
                            ticket.status === 'open' && 'bg-green-500 hover:bg-green-600'
                          )}
                        >
                          {ticket.status === 'open' ? 'Odprt' : 'Zaključen'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{ticket.email}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {ticket.message.length > 50 ? `${ticket.message.slice(0, 50)}...` : ticket.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(ticket.created_at), 'dd.MM.yyyy HH:mm', { locale: sl })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Panel - Ticket Details */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Podrobnosti ticketa</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {!selectedTicket ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Izberi ticket za prikaz podrobnosti</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">#{selectedTicket.ticket_id}</h3>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(v) => handleStatusChange(v as 'open' | 'closed')}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">
                          <div className="flex items-center gap-2">
                            <Circle className="h-3 w-3 text-green-500 fill-green-500" />
                            Odprt
                          </div>
                        </SelectItem>
                        <SelectItem value="closed">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                            Zaključen
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedTicket.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${selectedTicket.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedTicket.email}
                      </a>
                    </div>
                    {selectedTicket.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${selectedTicket.phone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {selectedTicket.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(selectedTicket.created_at), 'dd.MM.yyyy HH:mm', { locale: sl })}
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Sporočilo</h4>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
                    </div>
                  </div>

                  {/* Chat History */}
                  {selectedTicket.chat_history && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Pogovor</h4>
                      <div className="space-y-1">
                        {formatChatHistory(selectedTicket.chat_history)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardSidebar>
  );
}
