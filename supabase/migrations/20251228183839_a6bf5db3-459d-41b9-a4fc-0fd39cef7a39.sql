-- Create RPC function for activity heatmap
CREATE OR REPLACE FUNCTION public.get_activity_heatmap(p_table_name text)
RETURNS TABLE(day_of_week integer, hour integer, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT 
      EXTRACT(DOW FROM created_at)::integer as day_of_week,
      EXTRACT(HOUR FROM created_at)::integer as hour,
      COUNT(*)::bigint as count
     FROM %I 
     GROUP BY day_of_week, hour
     ORDER BY day_of_week, hour',
    p_table_name
  );
EXCEPTION
  WHEN undefined_table THEN
    RETURN;
  WHEN OTHERS THEN
    RETURN;
END;
$function$;