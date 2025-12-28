import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { TopicCategory } from '@/hooks/useConversationTopics';
import { cn } from '@/lib/utils';

const CHART_COLORS = [
  'hsl(220, 70%, 55%)',
  'hsl(var(--primary))',
  'hsl(160, 60%, 45%)',
  'hsl(45, 90%, 55%)',
  'hsl(340, 70%, 55%)',
  'hsl(25, 85%, 55%)',
  'hsl(280, 65%, 55%)',
  'hsl(200, 75%, 50%)',
];

interface PieChart3DProps {
  categories: TopicCategory[];
  selectedCategory: string | null;
  onCategoryClick: (category: string) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      percent: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-2xl animate-scale-in">
        <p className="font-semibold text-foreground text-sm">{data.name}</p>
        <p className="text-muted-foreground text-xs mt-1">
          {data.value} pogovorov ({data.percent.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export function PieChart3D({ 
  categories, 
  selectedCategory, 
  onCategoryClick 
}: PieChart3DProps) {
  const total = categories.reduce((sum, c) => sum + c.count, 0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return categories.map((cat, index) => ({
      name: cat.category,
      value: cat.count,
      percent: total > 0 ? (cat.count / total) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length],
      isSelected: selectedCategory === cat.category,
    }));
  }, [categories, selectedCategory, total]);

  if (categories.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Ni podatkov o kategorijah
      </div>
    );
  }

  const handleCategoryClick = (name: string) => {
    onCategoryClick(name);
  };

  return (
    <div className="space-y-6">
      {/* 3D Pie Chart */}
      <div className="relative h-[260px]">
        {/* Shadow layer for 3D depth effect */}
        <div 
          className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
          style={{ 
            transform: 'translateY(12px) scale(0.95)',
            filter: 'blur(8px)',
            opacity: 0.3
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`shadow-${index}`} 
                    fill="hsl(var(--foreground))"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Middle layer for depth */}
        <div 
          className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
          style={{ 
            transform: 'translateY(6px)',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                animationBegin={100}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`mid-${index}`} 
                    fill={entry.color.replace(')', ' / 0.5)').replace('hsl(', 'hsla(')}
                    stroke="none"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Main pie chart layer */}
        <div className="absolute inset-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {chartData.map((entry, index) => (
                  <linearGradient
                    key={`gradient-${index}`}
                    id={`pieGradient-${index}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                    <stop offset="50%" stopColor={entry.color} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                onClick={(data) => handleCategoryClick(data.name)}
                style={{ cursor: 'pointer' }}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                animationBegin={200}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#pieGradient-${index})`}
                    className="transition-all duration-300 ease-out"
                    style={{
                      filter: entry.isSelected 
                        ? 'drop-shadow(0 0 16px rgba(59, 130, 246, 0.6)) brightness(1.15)' 
                        : hoveredIndex === index
                        ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.2)) brightness(1.05)'
                        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      transform: entry.isSelected 
                        ? 'scale(1.08)' 
                        : hoveredIndex === index 
                        ? 'scale(1.03)' 
                        : 'scale(1)',
                      transformOrigin: 'center',
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Center text with animation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={cn(
            "text-center transition-all duration-300",
            selectedCategory ? "scale-90 opacity-80" : "scale-100 opacity-100"
          )}>
            <p className="text-3xl font-bold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground">Skupaj</p>
          </div>
        </div>
      </div>

      {/* Legend - Horizontal scrollable row */}
      <div className="flex flex-wrap justify-center gap-3 px-1">
        {chartData.map((entry, index) => (
          <button
            key={entry.name}
            onClick={() => handleCategoryClick(entry.name)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ease-out",
              "border backdrop-blur-sm",
              entry.isSelected 
                ? "bg-primary/15 border-primary/50 shadow-lg shadow-primary/20 scale-105" 
                : hoveredIndex === index
                ? "bg-muted/60 border-border/60 scale-102"
                : "bg-muted/30 border-transparent hover:bg-muted/50"
            )}
            style={{
              animationDelay: `${index * 50}ms`
            }}
          >
            <div 
              className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-300",
                entry.isSelected && "ring-2 ring-offset-1 ring-offset-background"
              )}
              style={{ 
                background: entry.color,
                boxShadow: entry.isSelected ? `0 0 8px ${entry.color}` : 'none',
              }}
            />
            <span className={cn(
              "text-sm font-medium transition-colors duration-300",
              entry.isSelected ? "text-foreground" : "text-muted-foreground"
            )}>
              {entry.name}
            </span>
            <span className={cn(
              "text-xs transition-colors duration-300 tabular-nums",
              entry.isSelected ? "text-foreground/80" : "text-muted-foreground/70"
            )}>
              {entry.value} <span className="text-[10px]">({entry.percent.toFixed(0)}%)</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
