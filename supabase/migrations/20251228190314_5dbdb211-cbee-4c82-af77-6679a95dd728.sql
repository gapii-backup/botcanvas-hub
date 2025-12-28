-- Update get_activity_heatmap to accept date range parameters
CREATE OR REPLACE FUNCTION public.get_activity_heatmap(
  p_table_name text, 
  p_start_date text DEFAULT NULL, 
  p_end_date text DEFAULT NULL
)
RETURNS TABLE(day_of_week integer, hour integer, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  query_text text;
BEGIN
  query_text := format(
    'SELECT 
      EXTRACT(DOW FROM created_at)::integer as day_of_week,
      EXTRACT(HOUR FROM created_at)::integer as hour,
      COUNT(*)::bigint as count
     FROM %I 
     WHERE 1=1',
    p_table_name
  );
  
  IF p_start_date IS NOT NULL THEN
    query_text := query_text || format(' AND created_at >= %L::timestamp', p_start_date);
  END IF;
  
  IF p_end_date IS NOT NULL THEN
    query_text := query_text || format(' AND created_at <= %L::timestamp', p_end_date);
  END IF;
  
  query_text := query_text || ' GROUP BY day_of_week, hour ORDER BY day_of_week, hour';
  
  RETURN QUERY EXECUTE query_text;
EXCEPTION
  WHEN undefined_table THEN
    RETURN;
  WHEN OTHERS THEN
    RETURN;
END;
$function$;