import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface KnowledgeDocument {
  id: string;
  table_name: string;
  file_name: string;
  file_url: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  created_at: string;
  updated_at: string;
}

export function useKnowledgeDocuments(tableName: string | null | undefined) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    if (!tableName) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('table_name', tableName)
      .order('created_at', { ascending: false });
    
    if (!error && data) setDocuments(data as KnowledgeDocument[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [tableName]);

  const uploadDocument = async (file: File, webhookUrl?: string | null) => {
    if (!tableName) return { data: null, error: new Error('No table name') };
    
    setUploading(true);
    try {
      // Upload to storage
      const filePath = `${tableName}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('knowledge-documents')
        .upload(filePath, file);

      if (uploadError) {
        setUploading(false);
        return { data: null, error: uploadError };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('knowledge-documents')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // Insert record
      const { data, error } = await supabase
        .from('knowledge_documents')
        .insert({
          table_name: tableName,
          file_name: file.name,
          file_url: fileUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (!error && data) {
        setDocuments(prev => [data as KnowledgeDocument, ...prev]);
        
        // Send webhook if URL exists
        if (webhookUrl) {
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file_url: fileUrl,
                file_name: file.name,
                document_id: data.id
              })
            });
          } catch (webhookError) {
            console.error('Webhook error:', webhookError);
          }
        }
      }

      setUploading(false);
      return { data, error };
    } catch (err) {
      setUploading(false);
      return { data: null, error: err as Error };
    }
  };

  const deleteDocument = async (id: string, fileUrl: string) => {
    // Extract file path from URL
    const urlParts = fileUrl.split('/knowledge-documents/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from('knowledge-documents').remove([filePath]);
    }

    const { error } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', id);
    
    if (!error) setDocuments(prev => prev.filter(doc => doc.id !== id));
    return { error };
  };

  return { documents, loading, uploading, fetchDocuments, uploadDocument, deleteDocument };
}
