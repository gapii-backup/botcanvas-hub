import { cn } from '@/lib/utils';
import type { TopicCategory } from '@/hooks/useConversationTopics';

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

interface HorizontalBarChartProps {
  categories: TopicCategory[];
  selectedCategory: string | null;
  onCategoryClick: (category: string) => void;
}

export function HorizontalBarChart({ 
  categories, 
  selectedCategory, 
  onCategoryClick 
}: HorizontalBarChartProps) {
  const total = categories.reduce((sum, c) => sum + c.count, 0);
  const maxCount = Math.max(...categories.map(c => c.count), 1);

  if (categories.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        Ni podatkov o kategorijah
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((cat, index) => {
        const percent = total > 0 ? ((cat.count / total) * 100).toFixed(1) : '0';
        const barWidth = (cat.count / maxCount) * 100;
        const isSelected = selectedCategory === cat.category;
        const color = CHART_COLORS[index % CHART_COLORS.length];

        return (
          <button
            key={cat.category}
            onClick={() => onCategoryClick(cat.category)}
            className={cn(
              "w-full text-left transition-all rounded-lg p-2 -mx-2",
              isSelected 
                ? "bg-primary/10 ring-2 ring-primary" 
                : "hover:bg-muted/50"
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium text-foreground truncate">
                  {cat.category}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm shrink-0">
                <span className="text-foreground font-medium">{cat.count}</span>
                <span className="text-muted-foreground">({percent}%)</span>
              </div>
            </div>
            <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${barWidth}%`,
                  backgroundColor: color,
                  opacity: isSelected ? 1 : 0.8
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
