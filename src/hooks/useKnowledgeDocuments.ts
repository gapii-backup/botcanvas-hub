import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface KnowledgeDocument {
  id: string;
  table_name: string;
  doc_id: string;
  file_name: string;
  file_url: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  created_at: string;
}

function generateDocId(): string {
  return 'pdf_' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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
      // Generiraj doc_id
      const docId = generateDocId();

      // Upload to storage
      const filePath = `${tableName}/${docId}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('knowledge-documents')
        .upload(filePath, file);

      if (uploadError) {
        setUploading(false);
        return { data: null, error: uploadError };
      }

      // Get signed URL (1 year validity for private bucket)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('knowledge-documents')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (signedUrlError) {
        setUploading(false);
        return { data: null, error: signedUrlError };
      }

      const fileUrl = signedUrlData.signedUrl;

      // Insert record with doc_id
      const { data, error } = await supabase
        .from('knowledge_documents')
        .insert({
          table_name: tableName,
          doc_id: docId,
          file_name: file.name,
          file_url: fileUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (!error && data) {
        setDocuments(prev => [data as KnowledgeDocument, ...prev]);
        
        // Pošlji webhook TAKOJ (fire and forget)
        if (webhookUrl) {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_url: fileUrl,
              file_name: file.name,
              doc_id: docId,
              table_name: tableName
            })
          }).catch(err => console.error('Upload webhook error:', err));
        }
      }

      setUploading(false);
      return { data, error };
    } catch (err) {
      setUploading(false);
      return { data: null, error: err as Error };
    }
  };

  const deleteDocument = async (id: string, fileUrl: string, docId?: string, deleteWebhookUrl?: string | null) => {
    // Pošlji delete webhook NAJPREJ
    if (deleteWebhookUrl && docId) {
      fetch(deleteWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_id: docId
        })
      }).catch(err => console.error('Delete webhook error:', err));
    }

    // Izbriši iz storage
    const urlParts = fileUrl.split('/knowledge-documents/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from('knowledge-documents').remove([filePath]);
    }

    // Izbriši iz baze
    const { error } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', id);
    
    if (!error) setDocuments(prev => prev.filter(doc => doc.id !== id));
    return { error };
  };

  return { documents, loading, uploading, fetchDocuments, uploadDocument, deleteDocument };
}
