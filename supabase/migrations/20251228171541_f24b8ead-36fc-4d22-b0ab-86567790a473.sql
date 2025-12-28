DROP FUNCTION IF EXISTS public.get_conversations(text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_conversations(p_table_name text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE(
  session_id text, 
  message_count bigint, 
  first_message_at timestamp with time zone, 
  last_message_at timestamp with time zone,
  first_question text,
  first_answer text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY EXECUTE format(
    'WITH conversation_stats AS (
      SELECT 
        t.session_id::text,
        COUNT(*)::bigint as message_count,
        MIN(t.created_at) as first_message_at,
        MAX(t.created_at) as last_message_at
      FROM %I t
      GROUP BY t.session_id
    ),
    first_human AS (
      SELECT DISTINCT ON (session_id) 
        session_id::text,
        (message::jsonb->>''content'')::text as first_question
      FROM %I 
      WHERE message::jsonb->>''type'' = ''human''
      ORDER BY session_id, created_at ASC
    ),
    first_ai AS (
      SELECT DISTINCT ON (session_id) 
        session_id::text,
        (message::jsonb->>''content'')::text as first_answer
      FROM %I 
      WHERE message::jsonb->>''type'' = ''ai''
      ORDER BY session_id, created_at ASC
    )
    SELECT 
      cs.session_id,
      cs.message_count,
      cs.first_message_at,
      cs.last_message_at,
      COALESCE(fh.first_question, '''')::text as first_question,
      COALESCE(fa.first_answer, '''')::text as first_answer
    FROM conversation_stats cs
    LEFT JOIN first_human fh ON cs.session_id = fh.session_id
    LEFT JOIN first_ai fa ON cs.session_id = fa.session_id
    ORDER BY cs.last_message_at DESC
    LIMIT %s OFFSET %s',
    p_table_name,
    p_table_name,
    p_table_name,
    p_limit,
    p_offset
  );
EXCEPTION
  WHEN undefined_table THEN
    RETURN;
END;
$function$;