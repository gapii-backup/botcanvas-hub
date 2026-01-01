import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addMonths, addYears } from 'date-fns';
import { sl } from 'date-fns/locale';
import { Zap } from 'lucide-react';

interface MessageUsageCardProps {
  tableName: string | null | undefined;
  billingPeriodStart: string | null | undefined;
  messagesLimit: number | null | undefined;
  billingPeriod: string | null | undefined;
}

export function MessageUsageCard({ 
  tableName, 
  billingPeriodStart, 
  messagesLimit,
  billingPeriod 
}: MessageUsageCardProps) {
  const [messagesUsed, setMessagesUsed] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getMessagesUsed = async () => {
      if (!tableName || !billingPeriodStart) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('get_human_messages_count_range', { 
            p_table_name: tableName,
            p_start_date: billingPeriodStart
          });

        if (error) {
          console.error('Error counting messages:', error);
          setMessagesUsed(0);
        } else {
          setMessagesUsed(data || 0);
        }
      } catch (err) {
        console.error('Error counting messages:', err);
        setMessagesUsed(0);
      } finally {
        setLoading(false);
      }
    };

    getMessagesUsed();
  }, [tableName, billingPeriodStart]);

  if (!billingPeriodStart || !messagesLimit) {
    return null;
  }

  const limit = messagesLimit || 1000;
  const percentage = limit ? (messagesUsed / limit) * 100 : 0;

  // Calculate next billing date
  const startDate = new Date(billingPeriodStart);
  const nextBillingDate = billingPeriod === 'yearly' 
    ? addYears(startDate, 1) 
    : addMonths(startDate, 1);

  const getProgressColor = () => {
    if (percentage > 95) return 'bg-destructive';
    if (percentage > 80) return 'bg-warning';
    return 'bg-success';
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-2 bg-muted rounded w-full mb-2"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">Porabljena sporočila ta mesec</span>
        </div>
        <span className="text-sm font-medium text-foreground">
          {messagesUsed.toLocaleString('sl-SI')} / {limit.toLocaleString('sl-SI')}
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      <p className="text-xs text-muted-foreground mt-3">
        Obdobje se ponastavi: {format(nextBillingDate, 'd. MMMM yyyy', { locale: sl })}
      </p>
    </div>
  );
}
