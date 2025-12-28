import { useWidget } from '@/hooks/useWidget';
import { useConversationTopics } from '@/hooks/useConversationTopics';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

export default function DashboardAnalytics() {
  const { widget, loading } = useWidget();
  const tableName = widget?.table_name;
  const { categories, topTopics, loading: topicsLoading } = useConversationTopics(tableName);

  if (loading || topicsLoading) {
    return (
      <DashboardLayout title="Analiza" subtitle="Teme in kategorije pogovorov">
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Analiza" subtitle="Teme in kategorije pogovorov">
      <div className="glass rounded-2xl p-6 animate-slide-up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Kategorije pogovorov</h3>
            {categories.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ category }) => category}
                    >
                      {categories.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Ni podatkov o kategorijah
              </div>
            )}
          </div>

          {/* Top Topics */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Top 5 tem</h3>
            {topTopics.length > 0 ? (
              <div className="space-y-3">
                {topTopics.map((topic, index) => (
                  <div key={topic.topic} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{index + 1}. {topic.topic}</span>
                    <span className="text-sm text-muted-foreground">{topic.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                Ni podatkov o temah
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
