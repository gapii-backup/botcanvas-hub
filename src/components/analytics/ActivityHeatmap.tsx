import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActivityHeatmapProps {
  data: number[][]; // 7 days x 24 hours
}

const DAY_LABELS = ['Ned', 'Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob'];
const DAY_NAMES_FULL = ['Nedelja', 'Ponedeljek', 'Torek', 'Sreda', 'Četrtek', 'Petek', 'Sobota'];

// Reorder to start with Monday (index 1, 2, 3, 4, 5, 6, 0)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const { maxValue, reorderedData } = useMemo(() => {
    let max = 0;
    data.forEach(day => {
      day.forEach(hour => {
        if (hour > max) max = hour;
      });
    });
    
    // Reorder days to start with Monday
    const reordered = DAY_ORDER.map(dayIndex => ({
      dayIndex,
      label: DAY_LABELS[dayIndex],
      fullName: DAY_NAMES_FULL[dayIndex],
      hours: data[dayIndex] || Array(24).fill(0)
    }));
    
    return { maxValue: max, reorderedData: reordered };
  }, [data]);

  const getCellStyle = (value: number) => {
    if (maxValue === 0 || value <= 0) {
      // "white/light" for 0
      return { backgroundColor: 'hsl(var(--muted) / 0.25)' };
    }

    const ratio = value / maxValue;
    const alpha = 0.2 + ratio * 0.8; // 0.2..1.0

    // Theme-safe "blue" via primary token
    return { backgroundColor: `hsl(var(--primary) / ${alpha})` };
  };

  const hourLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = 0; i < 24; i += 3) {
      labels.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return labels;
  }, []);

  // Check if data is empty or all zeros
  const hasData = data.length > 0 && maxValue > 0;

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        Ni podatkov za heatmap
      </div>
    );
  }

  // Debug log
  console.log('ActivityHeatmap render - data:', data, 'maxValue:', maxValue, 'hasData:', hasData);

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {/* Hour labels */}
        <div className="flex">
          <div className="w-10" /> {/* Spacer for day labels */}
          <div className="flex-1 flex justify-between text-xs text-muted-foreground px-0.5">
            {hourLabels.map(label => (
              <span key={label} className="w-8 text-center">{label}</span>
            ))}
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="space-y-1.5">
          {reorderedData.map(({ dayIndex, label, fullName, hours }) => (
            <div key={dayIndex} className="flex items-center gap-1">
              <span className="w-10 text-xs text-muted-foreground text-right pr-2">
                {label}
              </span>
              <div className="flex-1 flex gap-0.5">
                {hours.map((value, hourIndex) => (
                  <Tooltip key={`${dayIndex}-${hourIndex}`}>
                    <TooltipTrigger asChild>
                      <div
                        style={getCellStyle(value)}
                        className={cn(
                          "flex-1 h-7 rounded-sm transition-colors cursor-default"
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">
                        {fullName} {hourIndex.toString().padStart(2, '0')}:00 - {value} sporočil
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <span className="text-xs text-muted-foreground">Manj</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded-sm bg-muted/30" />
            <div className="w-4 h-4 rounded-sm bg-primary/20" />
            <div className="w-4 h-4 rounded-sm bg-primary/40" />
            <div className="w-4 h-4 rounded-sm bg-primary/60" />
            <div className="w-4 h-4 rounded-sm bg-primary/90" />
          </div>
          <span className="text-xs text-muted-foreground">Več</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
