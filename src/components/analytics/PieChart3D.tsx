import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { TopicCategory } from '@/hooks/useConversationTopics';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 70%, 55%)',
  'hsl(160, 60%, 45%)',
  'hsl(45, 90%, 55%)',
  'hsl(340, 70%, 55%)',
  'hsl(280, 65%, 55%)',
  'hsl(200, 75%, 50%)',
  'hsl(25, 85%, 55%)',
];

// Convert HSL string to actual color for gradients
const getGradientColors = (baseColor: string, index: number) => {
  // Create lighter and darker versions for 3D effect
  return {
    light: baseColor.replace(')', ' / 0.9)').replace('hsl(', 'hsla('),
    main: baseColor,
    dark: baseColor.replace(')', ' / 0.7)').replace('hsl(', 'hsla('),
  };
};

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
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-2xl">
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

  return (
    <div className="space-y-4">
      {/* 3D Pie Chart */}
      <div className="relative h-[280px]">
        {/* Shadow layer for 3D depth effect */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
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
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
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
          className="absolute inset-0 flex items-center justify-center"
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
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
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
                {/* Glossy highlight effect */}
                <linearGradient id="glossy" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="white" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="white" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                onClick={(data) => onCategoryClick(data.name)}
                style={{ cursor: 'pointer' }}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#pieGradient-${index})`}
                    style={{
                      filter: entry.isSelected 
                        ? 'drop-shadow(0 0 12px rgba(var(--primary), 0.5)) brightness(1.1)' 
                        : 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                      transform: entry.isSelected ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: 'center',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground">Skupaj</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 px-2">
        {chartData.slice(0, 8).map((entry, index) => (
          <button
            key={entry.name}
            onClick={() => onCategoryClick(entry.name)}
            className={`flex items-center gap-2 p-2 rounded-lg transition-all text-left ${
              entry.isSelected 
                ? 'bg-primary/10 ring-1 ring-primary' 
                : 'hover:bg-muted/50'
            }`}
          >
            <div 
              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              style={{ 
                background: `linear-gradient(135deg, ${entry.color}, ${entry.color.replace(')', ' / 0.7)').replace('hsl(', 'hsla(')})`,
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">
                {entry.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {entry.value} ({entry.percent.toFixed(0)}%)
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
