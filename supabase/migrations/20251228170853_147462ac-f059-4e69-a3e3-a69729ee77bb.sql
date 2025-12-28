CREATE OR REPLACE FUNCTION public.get_human_messages_count(p_table_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result integer;
BEGIN
  EXECUTE format(
    'SELECT COUNT(*)::integer FROM %I WHERE message::jsonb->>''type'' = ''human'' AND created_at >= date_trunc(''month'', CURRENT_DATE)',
    p_table_name
  ) INTO result;
  RETURN COALESCE(result, 0);
EXCEPTION
  WHEN undefined_table THEN
    RETURN 0;
  WHEN OTHERS THEN
    RETURN 0;
END;
$function$;