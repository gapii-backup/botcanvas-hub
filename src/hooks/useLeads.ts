import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  email: string | null;
  session_id: string;
  created_at: string;
}

export function useLeads(tableName: string | null | undefined) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tableName) {
      setLoading(false);
      return;
    }

    const fetchLeads = async () => {
      try {
        setLoading(true);

        const { data, error: fetchError } = await supabase
          .from('leads')
          .select('id, email, session_id, created_at')
          .eq('table_name', tableName)
          .order('created_at', { ascending: false })
          .limit(100);

        if (fetchError) throw fetchError;
        setLeads(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [tableName]);

  return { leads, loading, error };
}
