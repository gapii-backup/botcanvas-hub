import { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useWidget } from '@/hooks/useWidget';
import { useKnowledgeQA, KnowledgeQA } from '@/hooks/useKnowledgeQA';
import { useKnowledgeDocuments, KnowledgeDocument } from '@/hooks/useKnowledgeDocuments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  FileText, 
  Plus, 
  Pencil, 
  Trash2, 
  Upload, 
  Loader2,
  Zap,
  MessageSquare,
  File
} from 'lucide-react';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';

export default function DashboardKnowledge() {
  const { widget } = useWidget();
  const { items: qaItems, loading: qaLoading, addItem, updateItem, deleteItem, getLatestTimestamp, buildMarkdown } = useKnowledgeQA(widget?.table_name);
  const { documents, loading: docsLoading, uploading, uploadDocument, deleteDocument } = useKnowledgeDocuments(widget?.table_name);
  const { toast } = useToast();

  // Q&A Modal State
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [editingQa, setEditingQa] = useState<KnowledgeQA | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'qa' | 'doc'; id: string; fileUrl?: string } | null>(null);

  // Training State
  const [training, setTraining] = useState(false);

  const handleOpenQaModal = (item?: KnowledgeQA) => {
    if (item) {
      setEditingQa(item);
      setQuestion(item.question);
      setAnswer(item.answer);
    } else {
      setEditingQa(null);
      setQuestion('');
      setAnswer('');
    }
    setQaModalOpen(true);
  };

  const handleSaveQa = async () => {
    if (!question.trim() || !answer.trim()) {
      toast({ title: 'Napaka', description: 'Vprašanje in odgovor sta obvezna.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    if (editingQa) {
      const { error } = await updateItem(editingQa.id, question, answer);
      if (error) {
        toast({ title: 'Napaka', description: 'Napaka pri posodabljanju.', variant: 'destructive' });
      } else {
        toast({ title: 'Uspeh', description: 'Q&A posodobljen.' });
      }
    } else {
      const { error } = await addItem(question, answer);
      if (error) {
        toast({ title: 'Napaka', description: 'Napaka pri dodajanju.', variant: 'destructive' });
      } else {
        toast({ title: 'Uspeh', description: 'Q&A dodan.' });
      }
    }
    setSaving(false);
    setQaModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'qa') {
      const { error } = await deleteItem(itemToDelete.id);
      if (error) {
        toast({ title: 'Napaka', description: 'Napaka pri brisanju.', variant: 'destructive' });
      } else {
        toast({ title: 'Uspeh', description: 'Q&A izbrisan.' });
      }
    } else if (itemToDelete.type === 'doc' && itemToDelete.fileUrl) {
      const { error } = await deleteDocument(itemToDelete.id, itemToDelete.fileUrl);
      if (error) {
        toast({ title: 'Napaka', description: 'Napaka pri brisanju dokumenta.', variant: 'destructive' });
      } else {
        toast({ title: 'Uspeh', description: 'Dokument izbrisan.' });
      }
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleTrain = async () => {
    if (!widget?.qa_webhook_url) {
      toast({ title: 'Napaka', description: 'Webhook URL ni nastavljen. Prosim nastavite ga v admin panelu.', variant: 'destructive' });
      return;
    }

    if (qaItems.length === 0) {
      toast({ title: 'Napaka', description: 'Ni Q&A parov za treniranje.', variant: 'destructive' });
      return;
    }

    setTraining(true);
    try {
      const response = await fetch(widget.qa_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: buildMarkdown(),
          lastmod: getLatestTimestamp()
        })
      });

      if (response.ok) {
        toast({ title: 'Uspeh', description: 'Treniranje uspešno poslano!' });
      } else {
        toast({ title: 'Napaka', description: 'Napaka pri pošiljanju na webhook.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Napaka', description: 'Napaka pri povezavi z webhookom.', variant: 'destructive' });
    }
    setTraining(false);
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.includes('pdf')) {
      toast({ title: 'Napaka', description: 'Samo PDF datoteke so dovoljene.', variant: 'destructive' });
      return;
    }

    const { error } = await uploadDocument(file, widget?.documents_webhook_url);
    if (error) {
      toast({ title: 'Napaka', description: 'Napaka pri nalaganju dokumenta.', variant: 'destructive' });
    } else {
      toast({ title: 'Uspeh', description: 'Dokument naložen.' });
    }
  }, [uploadDocument, widget?.documents_webhook_url, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      processing: 'default',
      done: 'outline',
      error: 'destructive'
    };
    const labels: Record<string, string> = {
      pending: 'Čaka',
      processing: 'V obdelavi',
      done: 'Končano',
      error: 'Napaka'
    };
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  return (
    <DashboardLayout title="Baza znanja" subtitle="Upravljajte Q&A pare in dokumente za treniranje vašega bota">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skupaj Q&A parov</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skupaj dokumentov</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="qa" className="animate-fade-in">
        <TabsList className="mb-4">
          <TabsTrigger value="qa" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Q&A
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dokumenti
          </TabsTrigger>
        </TabsList>

        {/* Q&A Tab */}
        <TabsContent value="qa">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vprašanja in odgovori</CardTitle>
              <div className="flex gap-2">
                <Button onClick={() => handleOpenQaModal()} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj novo
                </Button>
                <Button 
                  onClick={handleTrain} 
                  disabled={training || qaItems.length === 0}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {training ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                  Treniraj
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {qaLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : qaItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Ni Q&A parov. Kliknite "Dodaj novo" za začetek.
                </div>
              ) : (
                <div className="space-y-4">
                  {qaItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.question}</p>
                          <p className="text-muted-foreground mt-1">{item.answer}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(item.created_at), 'dd. MMM yyyy, HH:mm', { locale: sl })}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenQaModal(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setItemToDelete({ type: 'qa', id: item.id });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Dokumenti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Nalaganje...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Povlecite PDF datoteko sem ali kliknite za izbiro
                    </p>
                  </div>
                )}
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </div>

              {/* Documents List */}
              {docsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Ni naloženih dokumentov.
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(doc.created_at), 'dd. MMM yyyy, HH:mm', { locale: sl })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(doc.status)}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setItemToDelete({ type: 'doc', id: doc.id, fileUrl: doc.file_url });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Q&A Modal */}
      <Dialog open={qaModalOpen} onOpenChange={setQaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingQa ? 'Uredi Q&A' : 'Dodaj novo Q&A'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Vprašanje</label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Vnesite vprašanje..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Odgovor</label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Vnesite odgovor..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQaModalOpen(false)}>Prekliči</Button>
            <Button onClick={handleSaveQa} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingQa ? 'Posodobi' : 'Dodaj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ste prepričani?</AlertDialogTitle>
            <AlertDialogDescription>
              To dejanje ni mogoče razveljaviti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Prekliči</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Izbriši</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
