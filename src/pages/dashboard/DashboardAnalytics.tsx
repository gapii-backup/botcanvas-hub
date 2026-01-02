import { useState, useMemo, useCallback } from 'react';
import { useWidget } from '@/hooks/useWidget';
import { useConversationTopics } from '@/hooks/useConversationTopics';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LockedFeature } from '@/components/dashboard/LockedFeature';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth } from 'date-fns';
import { sl } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import {
  CalendarIcon,
  MessageSquare,
  FolderOpen,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  Clock,
  Download,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ActivityHeatmap } from '@/components/analytics/ActivityHeatmap';
import { HorizontalBarChart } from '@/components/analytics/HorizontalBarChart';
import { PieChart3D } from '@/components/analytics/PieChart3D';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--muted-foreground))',
  'hsl(220, 70%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(340, 70%, 50%)',
];

type SortField = 'category' | 'specific' | 'count';
type SortDirection = 'asc' | 'desc';

export default function DashboardAnalytics() {
  const { widget, loading } = useWidget();
  const hasAccess = widget?.plan === 'pro' || widget?.plan === 'enterprise';
  const tableName = widget?.table_name;

  // Date filter state - same as DashboardConversations
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days' | 'month' | 'custom'>('30days');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Calculate start/end dates based on filter
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    
    if (dateFilter === 'all') {
      return { startDate: undefined, endDate: undefined };
    }
    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: today, endDate: now };
    }
    if (dateFilter === '7days') {
      return { startDate: subDays(now, 7), endDate: now };
    }
    if (dateFilter === '30days') {
      return { startDate: subDays(now, 30), endDate: now };
    }
    if (dateFilter === 'month') {
      return { startDate: startOfMonth(now), endDate: now };
    }
    if (dateFilter === 'custom' && customDateRange) {
      return { startDate: customDateRange.from, endDate: customDateRange.to };
    }
    return { startDate: subDays(now, 30), endDate: now };
  }, [dateFilter, customDateRange]);

  const { rawData, categories, topTopics, trendData, heatmapData, sessionsCount, humanMessagesCount, loading: topicsLoading } = useConversationTopics(
    tableName,
    { startDate: startDate ?? null, endDate: endDate ?? null }
  );

  console.log('Heatmap data for render:', heatmapData);

  // Get date range label for display
  const getDateRangeLabel = () => {
    if (dateFilter === 'all') return 'Vse';
    if (dateFilter === 'today') return format(new Date(), 'd. MMMM yyyy', { locale: sl });
    if (dateFilter === '7days') {
      const from = format(subDays(new Date(), 7), 'd. MMM yyyy', { locale: sl });
      const to = format(new Date(), 'd. MMM yyyy', { locale: sl });
      return `${from} - ${to}`;
    }
    if (dateFilter === '30days') {
      const from = format(subDays(new Date(), 30), 'd. MMM yyyy', { locale: sl });
      const to = format(new Date(), 'd. MMM yyyy', { locale: sl });
      return `${from} - ${to}`;
    }
    if (dateFilter === 'month') {
      const from = format(startOfMonth(new Date()), 'd. MMM yyyy', { locale: sl });
      const to = format(new Date(), 'd. MMM yyyy', { locale: sl });
      return `${from} - ${to}`;
    }
    if (dateFilter === 'custom' && customDateRange?.from) {
      const from = format(customDateRange.from, 'd. MMM yyyy', { locale: sl });
      const to = customDateRange.to ? format(customDateRange.to, 'd. MMM yyyy', { locale: sl }) : '';
      return to ? `${from} - ${to}` : from;
    }
    return 'Neznano obdobje';
  };

  // Selected category state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modal state
  const [showAllModal, setShowAllModal] = useState(false);

  // PDF generation state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Table state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const itemsPerPage = 10;

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCount = rawData.length;
    const uniqueCategories = categories.length;
    const mostFrequentTopic = topTopics[0]?.topic || '-';
    return { totalCount, uniqueCategories, mostFrequentTopic };
  }, [rawData, categories, topTopics]);

  // Group data by specific topic
  const groupedBySpecific = useMemo(() => {
    const map = new Map<string, { category: string; specific: string; count: number }>();
    rawData.forEach(item => {
      if (item.specific) {
        const key = `${item.category}|${item.specific}`;
        const existing = map.get(key);
        if (existing) {
          existing.count++;
        } else {
          map.set(key, { category: item.category, specific: item.specific, count: 1 });
        }
      }
    });
    return Array.from(map.values());
  }, [rawData]);

  // Filter topics for selected category
  const topicsForCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return groupedBySpecific
      .filter(item => item.category === selectedCategory)
      .sort((a, b) => b.count - a.count);
  }, [groupedBySpecific, selectedCategory]);

  const categoryTotal = useMemo(() => {
    return topicsForCategory.reduce((sum, t) => sum + t.count, 0);
  }, [topicsForCategory]);

  // Filtered and sorted table data
  const filteredTableData = useMemo(() => {
    let data = [...groupedBySpecific];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item =>
        item.specific.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    data.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortField === 'specific') {
        comparison = a.specific.localeCompare(b.specific);
      } else {
        comparison = a.count - b.count;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return data;
  }, [groupedBySpecific, searchQuery, sortField, sortDirection]);

  const totalItems = filteredTableData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = filteredTableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalForPercent = useMemo(() => {
    return filteredTableData.reduce((sum, t) => sum + t.count, 0);
  }, [filteredTableData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  // Format trend data for chart
  const formattedTrendData = useMemo(() => {
    return trendData.map(item => ({
      ...item,
      label: format(new Date(item.day), 'd. MMM', { locale: sl })
    }));
  }, [trendData]);

  // PDF Generation function
  const generatePDF = useCallback(async () => {
    setIsGeneratingPdf(true);
    
    // Helper to replace Slovenian characters with ASCII equivalents for PDF
    const sanitizeForPdf = (text: string): string => {
      return text
        .replace(/č/g, 'c')
        .replace(/Č/g, 'C')
        .replace(/š/g, 's')
        .replace(/Š/g, 'S')
        .replace(/ž/g, 'z')
        .replace(/Ž/g, 'Z');
    };
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Colors
      const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
      const textColor: [number, number, number] = [30, 41, 59];
      const mutedColor: [number, number, number] = [100, 116, 139];

      // Helper function to add section title
      const addSectionTitle = (title: string) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.text(sanitizeForPdf(title), margin, yPos);
        yPos += 10;
        doc.setTextColor(...textColor);
      };

      // Header
      doc.setFontSize(24);
      doc.setTextColor(...primaryColor);
      doc.text('BotMotion.ai', margin, yPos);
      yPos += 10;
      
      doc.setFontSize(16);
      doc.setTextColor(...textColor);
      doc.text('Analiza pogovorov', margin, yPos);
      yPos += 15;

      // Date range and generation date
      doc.setFontSize(10);
      doc.setTextColor(...mutedColor);
      doc.text(sanitizeForPdf(`Obdobje: ${getDateRangeLabel()}`), margin, yPos);
      yPos += 6;
      doc.text(sanitizeForPdf(`Generirano: ${format(new Date(), 'd. MMMM yyyy, HH:mm', { locale: sl })}`), margin, yPos);
      yPos += 15;

      // Separator line
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;

      // SECTION 1: Statistics
      addSectionTitle('Statistike');
      
      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      
      const statsData = [
        ['Skupaj pogovorov', sessionsCount.toString()],
        ['Stevilo sporocil', humanMessagesCount.toString()],
        ['Najpogostejsa tema', sanitizeForPdf(stats.mostFrequentTopic)],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metrika', 'Vrednost']],
        body: statsData,
        margin: { left: margin, right: margin },
        headStyles: { 
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 10 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;

      // SECTION 2: Trends
      addSectionTitle('Trendi sporocil');
      
      if (formattedTrendData.length > 0) {
        const trendTableData = formattedTrendData.map(item => [
          sanitizeForPdf(item.label),
          item.count.toString()
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Dan', 'Stevilo sporocil']],
          body: trendTableData,
          margin: { left: margin, right: margin },
          headStyles: { 
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 9 },
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(...mutedColor);
        doc.text('Ni podatkov za prikaz trendov', margin, yPos);
        yPos += 15;
      }

      // SECTION 3: Categories
      addSectionTitle('Kategorije pogovorov');
      
      if (categories.length > 0) {
        const totalCategories = categories.reduce((sum, c) => sum + c.count, 0);
        const categoryTableData = categories.map(cat => [
          sanitizeForPdf(cat.category),
          cat.count.toString(),
          totalCategories > 0 ? `${((cat.count / totalCategories) * 100).toFixed(1)}%` : '0%'
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Kategorija', 'Stevilo', 'Procent']],
          body: categoryTableData,
          margin: { left: margin, right: margin },
          headStyles: { 
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 10 },
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // SECTION 4: Top 5 Topics
      addSectionTitle('Top 5 tem');
      
      if (topTopics.length > 0) {
        const topTopicsData = topTopics.slice(0, 5).map((topic, index) => [
          (index + 1).toString(),
          sanitizeForPdf(topic.topic),
          `${topic.count}x`
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Tema', 'Stevilo']],
          body: topTopicsData,
          margin: { left: margin, right: margin },
          headStyles: { 
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 10 },
          columnStyles: {
            0: { cellWidth: 15 },
            2: { cellWidth: 25 }
          }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // SECTION 5: Activity by hours (summary)
      addSectionTitle('Aktivnost po urah');
      
      // Find peak activity
      let maxActivity = 0;
      let peakDay = '';
      let peakHour = 0;
      const dayNames = ['Nedelja', 'Ponedeljek', 'Torek', 'Sreda', 'Cetrtek', 'Petek', 'Sobota'];
      
      heatmapData.forEach((dayData, dayIndex) => {
        dayData.forEach((count, hourIndex) => {
          if (count > maxActivity) {
            maxActivity = count;
            peakDay = dayNames[dayIndex];
            peakHour = hourIndex;
          }
        });
      });

      if (maxActivity > 0) {
        doc.setFontSize(10);
        doc.setTextColor(...textColor);
        doc.text(`Najvecja aktivnost: ${peakDay} ob ${peakHour}:00 (${maxActivity} sporocil)`, margin, yPos);
        yPos += 15;
      }

      // SECTION 6: All Topics
      if (groupedBySpecific.length > 0) {
        addSectionTitle('Vse teme');
        
        const allTopicsData = groupedBySpecific
          .sort((a, b) => b.count - a.count)
          .slice(0, 50) // Limit to 50 topics for PDF
          .map(item => [
            sanitizeForPdf(item.category),
            sanitizeForPdf(item.specific),
            item.count.toString(),
            totalForPercent > 0 ? `${((item.count / totalForPercent) * 100).toFixed(1)}%` : '0%'
          ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Kategorija', 'Tema', 'Stevilo', '%']],
          body: allTopicsData,
          margin: { left: margin, right: margin },
          headStyles: { 
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 35 },
            3: { cellWidth: 20 }
          }
        });
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...mutedColor);
        doc.text(
          `Stran ${i} od ${pageCount} | BotMotion.ai`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = `BotMotion-Analiza-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF uspesno generiran!', {
        description: fileName
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Napaka pri generiranju PDF-ja');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [
    categories, 
    topTopics, 
    formattedTrendData, 
    heatmapData, 
    groupedBySpecific, 
    sessionsCount, 
    humanMessagesCount, 
    stats, 
    totalForPercent,
    getDateRangeLabel
  ]);

  if (loading) {
    return (
      <DashboardLayout title="Analiza" subtitle="Teme in kategorije pogovorov">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAccess) {
    return (
      <DashboardLayout title="Analiza" subtitle="Teme in kategorije pogovorov">
        <LockedFeature 
          feature="Analiza"
          description="Pridobite vpogled v teme pogovorov, trende in aktivnost uporabnikov z naprednimi analitičnimi orodji."
        />
      </DashboardLayout>
    );
  }

  if (topicsLoading) {
    return (
      <DashboardLayout title="Analiza" subtitle="Teme in kategorije pogovorov">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Analiza" subtitle="Teme in kategorije pogovorov">
      <div className="space-y-6 animate-slide-up">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Skupaj pogovorov</p>
                <p className="text-2xl font-bold text-foreground">{sessionsCount}</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <MessageSquare className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Število sporočil</p>
                <p className="text-2xl font-bold text-foreground">{humanMessagesCount}</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-warning/10 shrink-0">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Najpogostejša tema</p>
                <p className="text-lg font-bold text-foreground break-words">
                  {stats.mostFrequentTopic}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Date Range Picker - style like conversations */}
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
            <Popover 
              open={calendarOpen} 
              onOpenChange={(open) => {
                setCalendarOpen(open);
                // Reset selection when opening calendar for fresh start
                if (open) {
                  setCustomDateRange(undefined);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant={dateFilter === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "transition-all min-w-[200px] justify-start text-left font-normal",
                    !customDateRange && dateFilter !== 'custom' && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter === 'custom' && customDateRange?.from ? (
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
                  defaultMonth={new Date()}
                  selected={customDateRange}
                  onSelect={(range) => {
                    setCustomDateRange(range);
                    if (range?.from && range?.to) {
                      setDateFilter('custom');
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
          
          {/* PDF Download Button */}
          <Button
            onClick={generatePDF}
            disabled={isGeneratingPdf}
            size="sm"
            className="gap-2"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generiram...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Prenesi analizo
              </>
            )}
          </Button>
        </div>

        {/* Main Charts Grid - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Line Chart - Trends */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Trendi sporočil
              </h3>
              
              {formattedTrendData.length > 0 ? (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedTrendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            // Slovenian plural: 1 = sporočilo, 2 = sporočili, 3-4 = sporočila, 0 or 5+ = sporočil
                            const getMessageLabel = (count: number) => {
                              if (count === 1) return 'sporočilo';
                              if (count === 2) return 'sporočili';
                              if (count === 3 || count === 4) return 'sporočila';
                              return 'sporočil';
                            };
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-medium text-foreground">{data.label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {data.count} {getMessageLabel(data.count)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                  Ni podatkov za prikaz trendov
                </div>
              )}
            </div>

            {/* Heatmap - Activity by hours */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Aktivnost po urah
              </h3>
              <ActivityHeatmap data={heatmapData} />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Horizontal Bar Chart - Categories */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Kategorije pogovorov
              </h3>
              <PieChart3D 
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryClick={handleCategoryClick}
              />
            </div>

            {/* Selected Category Topics or Top 5 Topics */}
            <div className="glass rounded-2xl p-6">
              {selectedCategory ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground">
                      Teme v kategoriji: {selectedCategory}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="border border-border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tema</TableHead>
                          <TableHead className="w-20 text-right">Število</TableHead>
                          <TableHead className="w-20 text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topicsForCategory.slice(0, 5).map((topic) => (
                          <TableRow key={topic.specific}>
                            <TableCell className="font-medium">{topic.specific}</TableCell>
                            <TableCell className="text-right">{topic.count}</TableCell>
                            <TableCell className="text-right">
                              {((topic.count / categoryTotal) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {topicsForCategory.length > 5 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAllModal(true)}
                    >
                      Prikaži vse ({topicsForCategory.length} tem)
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Top 5 tem
                  </h3>
                  
                  {topTopics.length > 0 ? (
                    <div className="space-y-3">
                      {topTopics.map((topic, index) => (
                        <div 
                          key={topic.topic}
                          className="flex items-start justify-between p-3 rounded-lg bg-muted/30 gap-3"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-foreground break-words">
                              {topic.topic}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground shrink-0">{topic.count}x</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                      Ni podatkov o temah
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All Topics Table */}
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-medium text-foreground">Vse teme</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Išči po temah..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {filteredTableData.length > 0 ? (
            <>
              <div className="border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          onClick={() => handleSort('category')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Kategorija
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('specific')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Specifična tema
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="w-24 text-right">
                        <button
                          onClick={() => handleSort('count')}
                          className="flex items-center gap-1 justify-end hover:text-foreground ml-auto"
                        >
                          Število
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="w-20 text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item, idx) => (
                      <TableRow key={`${item.category}-${item.specific}-${idx}`}>
                        <TableCell>
                          <span
                            className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs"
                            style={{
                              backgroundColor: `${CHART_COLORS[categories.findIndex(c => c.category === item.category) % CHART_COLORS.length]}20`,
                              color: CHART_COLORS[categories.findIndex(c => c.category === item.category) % CHART_COLORS.length],
                            }}
                          >
                            {item.category}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{item.specific}</TableCell>
                        <TableCell className="text-right">{item.count}</TableCell>
                        <TableCell className="text-right">
                          {((item.count / totalForPercent) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Prikazujem {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} od {totalItems}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              {searchQuery ? 'Ni rezultatov za iskanje' : 'Ni podatkov o temah'}
            </div>
          )}
        </div>
      </div>

      {/* Modal for all topics in category */}
      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Vse teme v kategoriji: {selectedCategory}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tema</TableHead>
                  <TableHead className="w-24 text-right">Število</TableHead>
                  <TableHead className="w-20 text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topicsForCategory.map((topic) => (
                  <TableRow key={topic.specific}>
                    <TableCell className="font-medium">{topic.specific}</TableCell>
                    <TableCell className="text-right">{topic.count}</TableCell>
                    <TableCell className="text-right">
                      {((topic.count / categoryTotal) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
