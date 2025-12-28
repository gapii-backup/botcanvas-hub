import { useState, useMemo } from 'react';
import { useWidget } from '@/hooks/useWidget';
import { useConversationTopics, TopicRecord } from '@/hooks/useConversationTopics';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { sl } from 'date-fns/locale';
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
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Sector,
} from 'recharts';

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

const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
      />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="hsl(var(--foreground))" className="text-sm font-medium">
        {payload.category}
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-xs">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

type SortField = 'category' | 'specific' | 'count';
type SortDirection = 'asc' | 'desc';

export default function DashboardAnalytics() {
  const { widget, loading } = useWidget();
  const tableName = widget?.table_name;

  // Date filter state
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { rawData, categories, topTopics, loading: topicsLoading } = useConversationTopics(
    tableName,
    { startDate, endDate }
  );

  // Pie chart state
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modal state
  const [showAllModal, setShowAllModal] = useState(false);

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

  const handlePieClick = (_: any, index: number) => {
    const category = categories[index]?.category;
    if (category === selectedCategory) {
      setSelectedCategory(null);
      setActiveIndex(null);
    } else {
      setSelectedCategory(category);
      setActiveIndex(index);
    }
  };

  const handlePieEnter = (_: any, index: number) => {
    if (selectedCategory === null) {
      setActiveIndex(index);
    }
  };

  const handlePieLeave = () => {
    if (selectedCategory === null) {
      setActiveIndex(null);
    }
  };

  if (loading || topicsLoading) {
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
        {/* Date Range Picker */}
        <div className="glass rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-muted-foreground">Obdobje:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'd. MMM yyyy', { locale: sl }) : 'Od'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">—</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'd. MMM yyyy', { locale: sl }) : 'Do'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate(subDays(new Date(), 30));
                setEndDate(new Date());
              }}
            >
              Zadnjih 30 dni
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate(subDays(new Date(), 7));
                setEndDate(new Date());
              }}
            >
              Zadnjih 7 dni
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Skupaj pogovorov</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalCount}</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <FolderOpen className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kategorij</p>
                <p className="text-2xl font-bold text-foreground">{stats.uniqueCategories}</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Najpogostejša tema</p>
                <p className="text-lg font-bold text-foreground truncate max-w-[200px]">
                  {stats.mostFrequentTopic}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart Section */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Kategorije pogovorov</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              {categories.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        activeIndex={activeIndex !== null ? activeIndex : undefined}
                        activeShape={renderActiveShape}
                        onMouseEnter={handlePieEnter}
                        onMouseLeave={handlePieLeave}
                        onClick={handlePieClick}
                        style={{ cursor: 'pointer' }}
                        label={({ category, percent, cx, cy, midAngle, outerRadius }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 25;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          if (percent < 0.05) return null;
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="hsl(var(--foreground))"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              className="text-xs"
                            >
                              {category}
                            </text>
                          );
                        }}
                        labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                      >
                        {categories.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                            style={{
                              opacity: selectedCategory === null || categories[index].category === selectedCategory ? 1 : 0.4,
                              transition: 'opacity 0.3s ease',
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const total = categories.reduce((sum, c) => sum + c.count, 0);
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-medium text-foreground">{data.category}</p>
                                <p className="text-sm text-muted-foreground">
                                  {data.count} pogovorov ({((data.count / total) * 100).toFixed(1)}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  Ni podatkov o kategorijah
                </div>
              )}

              {/* Legend */}
              {categories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                  {categories.map((cat, index) => {
                    const total = categories.reduce((sum, c) => sum + c.count, 0);
                    const percent = ((cat.count / total) * 100).toFixed(1);
                    return (
                      <button
                        key={cat.category}
                        onClick={() => {
                          if (selectedCategory === cat.category) {
                            setSelectedCategory(null);
                            setActiveIndex(null);
                          } else {
                            setSelectedCategory(cat.category);
                            setActiveIndex(index);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all",
                          selectedCategory === cat.category
                            ? "bg-primary/20 ring-2 ring-primary"
                            : "bg-muted/50 hover:bg-muted"
                        )}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-foreground">{cat.category}</span>
                        <span className="text-muted-foreground">{percent}%</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Category Topics */}
            <div>
              {selectedCategory ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">
                      Teme v kategoriji: {selectedCategory}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(null);
                        setActiveIndex(null);
                      }}
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
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                  <FolderOpen className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-center">
                    Kliknite na kategorijo v grafu ali legendi za prikaz specifičnih tem
                  </p>
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
