-- Function to count unique sessions within a date range
CREATE OR REPLACE FUNCTION public.get_sessions_count(
  p_table_name text,
  p_start_date text DEFAULT NULL,
  p_end_date text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result integer;
  query_text text;
BEGIN
  query_text := format(
    'SELECT COUNT(DISTINCT session_id)::integer FROM %I WHERE 1=1',
    p_table_name
  );
  
  IF p_start_date IS NOT NULL THEN
    query_text := query_text || format(' AND created_at >= %L::timestamp', p_start_date);
  END IF;
  
  IF p_end_date IS NOT NULL THEN
    query_text := query_text || format(' AND created_at <= %L::timestamp', p_end_date);
  END IF;
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, 0);
EXCEPTION
  WHEN undefined_table THEN
    RETURN 0;
  WHEN OTHERS THEN
    RETURN 0;
END;
$function$;

-- Function to count human messages within a date range
CREATE OR REPLACE FUNCTION public.get_human_messages_count_range(
  p_table_name text,
  p_start_date text DEFAULT NULL,
  p_end_date text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result integer;
  query_text text;
BEGIN
  query_text := format(
    'SELECT COUNT(*)::integer FROM %I WHERE message::jsonb->>''type'' = ''human''',
    p_table_name
  );
  
  IF p_start_date IS NOT NULL THEN
    query_text := query_text || format(' AND created_at >= %L::timestamp', p_start_date);
  END IF;
  
  IF p_end_date IS NOT NULL THEN
    query_text := query_text || format(' AND created_at <= %L::timestamp', p_end_date);
  END IF;
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, 0);
EXCEPTION
  WHEN undefined_table THEN
    RETURN 0;
  WHEN OTHERS THEN
    RETURN 0;
END;
$function$;