-- RPC function to get messages count for today
CREATE OR REPLACE FUNCTION public.get_messages_today(p_table_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result integer;
BEGIN
  EXECUTE format(
    'SELECT COUNT(*)::integer FROM %I WHERE created_at::date = CURRENT_DATE',
    p_table_name
  ) INTO result;
  RETURN COALESCE(result, 0);
EXCEPTION
  WHEN undefined_table THEN
    RETURN 0;
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;

-- RPC function to get unique sessions count this month
CREATE OR REPLACE FUNCTION public.get_sessions_this_month(p_table_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result integer;
BEGIN
  EXECUTE format(
    'SELECT COUNT(DISTINCT session_id)::integer FROM %I WHERE created_at >= date_trunc(''month'', CURRENT_DATE)',
    p_table_name
  ) INTO result;
  RETURN COALESCE(result, 0);
EXCEPTION
  WHEN undefined_table THEN
    RETURN 0;
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;

-- RPC function to get messages grouped by day (last 7 days)
CREATE OR REPLACE FUNCTION public.get_messages_by_day(p_table_name text)
RETURNS TABLE(day date, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT created_at::date as day, COUNT(*) as count 
     FROM %I 
     WHERE created_at >= CURRENT_DATE - INTERVAL ''7 days''
     GROUP BY created_at::date 
     ORDER BY day ASC',
    p_table_name
  );
EXCEPTION
  WHEN undefined_table THEN
    RETURN;
  WHEN OTHERS THEN
    RETURN;
END;
$$;