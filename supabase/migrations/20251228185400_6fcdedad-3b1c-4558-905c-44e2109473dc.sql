-- Update get_messages_by_day to accept dynamic days parameter
CREATE OR REPLACE FUNCTION public.get_messages_by_day(p_table_name text, p_days integer DEFAULT 7)
RETURNS TABLE(day date, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT created_at::date as day, COUNT(*) as count 
     FROM %I 
     WHERE created_at >= CURRENT_DATE - INTERVAL ''1 day'' * %s
     GROUP BY created_at::date 
     ORDER BY day ASC',
    p_table_name,
    p_days
  );
EXCEPTION
  WHEN undefined_table THEN
    RETURN;
  WHEN OTHERS THEN
    RETURN;
END;
$function$;