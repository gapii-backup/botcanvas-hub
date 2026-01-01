import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addMonths, addYears } from 'date-fns';
import { sl } from 'date-fns/locale';
import { Zap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CapacityAddonModal } from './CapacityAddonModal';

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
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);

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
    <>
      <div className="glass rounded-2xl p-8 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-lg font-medium text-foreground">Poraba sporočil</span>
          </div>
          <span className="text-xl font-semibold text-foreground">
            {messagesUsed.toLocaleString('sl-SI')} / {limit.toLocaleString('sl-SI')}
          </span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Obdobje se ponastavi: {format(nextBillingDate, 'd. MMMM yyyy', { locale: sl })}
          </p>
          <Button
            onClick={() => setCapacityModalOpen(true)}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold shadow-lg shadow-amber-500/25"
          >
            <Plus className="h-4 w-4 mr-1" />
            Dodaj kapaciteto
          </Button>
        </div>
      </div>

      <CapacityAddonModal open={capacityModalOpen} onOpenChange={setCapacityModalOpen} />
    </>
  );
}
