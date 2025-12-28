DROP FUNCTION IF EXISTS get_conversations(TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_conversations(TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_conversations(p_table_name TEXT, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE(
  session_id TEXT,
  message_count BIGINT,
  first_message_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT 
      session_id::text,
      COUNT(*)::bigint as message_count,
      MIN(created_at) as first_message_at,
      MAX(created_at) as last_message_at
     FROM %I 
     GROUP BY session_id
     ORDER BY MAX(created_at) DESC
     LIMIT %s OFFSET %s',
    p_table_name,
    p_limit,
    p_offset
  );
EXCEPTION
  WHEN undefined_table THEN
    RETURN;
END;
$$;