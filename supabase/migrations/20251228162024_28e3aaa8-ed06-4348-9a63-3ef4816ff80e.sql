-- Function to get conversations grouped by session_id
CREATE OR REPLACE FUNCTION public.get_conversations(p_table_name text, p_limit integer DEFAULT 50)
RETURNS TABLE(
  session_id text,
  message_count bigint,
  first_message_at timestamptz,
  last_message_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
     LIMIT %s',
    p_table_name,
    p_limit
  );
EXCEPTION
  WHEN undefined_table THEN
    RETURN;
  WHEN OTHERS THEN
    RETURN;
END;
$$;

-- Function to get messages for a specific conversation
CREATE OR REPLACE FUNCTION public.get_conversation_messages(p_table_name text, p_session_id text)
RETURNS TABLE(
  id bigint,
  session_id text,
  message text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT 
      id::bigint,
      session_id::text,
      message::text,
      created_at
     FROM %I 
     WHERE session_id = %L
     ORDER BY created_at ASC',
    p_table_name,
    p_session_id
  );
EXCEPTION
  WHEN undefined_table THEN
    RETURN;
  WHEN OTHERS THEN
    RETURN;
END;
$$;