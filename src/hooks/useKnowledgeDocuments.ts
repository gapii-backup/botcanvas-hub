import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// File size limit
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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
    
    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { 
        data: null, 
        error: new Error(`Datoteka je prevelika. Maksimalna velikost je ${MAX_FILE_SIZE_MB}MB.`) 
      };
    }
    
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
        body: JSON.stringify({ doc_id: docId })
      }).catch(err => console.error('Delete webhook error:', err));
    }

    // Izbriši iz storage - popravljeno za signed URL
    try {
      // Signed URL format: .../storage/v1/object/sign/knowledge-documents/table_name/file.pdf?token=...
      // Public URL format: .../storage/v1/object/public/knowledge-documents/table_name/file.pdf
      
      let filePath = '';
      
      if (fileUrl.includes('/storage/v1/object/sign/knowledge-documents/')) {
        // Signed URL
        const pathPart = fileUrl.split('/storage/v1/object/sign/knowledge-documents/')[1];
        filePath = pathPart?.split('?')[0] || ''; // Odstrani query params
      } else if (fileUrl.includes('/storage/v1/object/public/knowledge-documents/')) {
        // Public URL
        filePath = fileUrl.split('/storage/v1/object/public/knowledge-documents/')[1] || '';
      } else if (fileUrl.includes('/knowledge-documents/')) {
        // Fallback
        filePath = fileUrl.split('/knowledge-documents/')[1]?.split('?')[0] || '';
      }
      
      if (filePath) {
        // Decode URL encoded characters (npr. %20 za presledke)
        filePath = decodeURIComponent(filePath);
        console.log('Deleting file from storage:', filePath);
        
        const { error: storageError } = await supabase.storage
          .from('knowledge-documents')
          .remove([filePath]);
          
        if (storageError) {
          console.error('Storage delete error:', storageError);
        }
      }
    } catch (err) {
      console.error('Error extracting file path:', err);
    }

    // Izbriši iz baze
    const { error } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', id);
    
    if (!error) setDocuments(prev => prev.filter(doc => doc.id !== id));
    return { error };
  };

  const updateDocumentStatus = async (docId: string, status: 'pending' | 'processing' | 'done' | 'error') => {
    const { error } = await supabase
      .from('knowledge_documents')
      .update({ status })
      .eq('doc_id', docId);
    
    if (!error) {
      setDocuments(prev => prev.map(doc => 
        doc.doc_id === docId ? { ...doc, status } : doc
      ));
    }
    return { error };
  };

  return { documents, loading, uploading, fetchDocuments, uploadDocument, deleteDocument, updateDocumentStatus };
}
