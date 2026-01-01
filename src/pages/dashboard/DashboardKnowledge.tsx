import { useState, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useWidget } from '@/hooks/useWidget';
import { useKnowledgeQA, KnowledgeQA } from '@/hooks/useKnowledgeQA';
import { useKnowledgeDocuments } from '@/hooks/useKnowledgeDocuments';

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
  File,
  CheckCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';

export default function DashboardKnowledge() {
  const { widget } = useWidget();
  const { 
    items: qaItems, 
    loading: qaLoading, 
    addItem, 
    updateItem, 
    deleteItem, 
    getLatestTimestamp, 
    buildMarkdown,
    lastmod,
    lastTrained,
    updateLastTrained,
    fetchLastmod
  } = useKnowledgeQA(widget?.table_name);
  const { documents, loading: docsLoading, uploading, uploadDocument, deleteDocument } = useKnowledgeDocuments(widget?.table_name);
  const { toast } = useToast();

  // Calculate if training is needed
  const needsTraining = useMemo(() => {
    // Če ni Q&A parov, ni potrebe za training
    if (qaItems.length === 0) return false;
    
    // Če ni lastmod (ni bilo še nobenih sprememb v bazi), preveri ali obstajajo items
    // To se lahko zgodi če so bili Q&A dodani pred uvedbo lastmod sistema
    if (!lastmod) return qaItems.length > 0;
    
    // Če ni bilo še nobenega traininga, potrebujemo training
    if (!lastTrained) return true;
    
    // Če je lastmod novejši od last_trained, potrebujemo training
    return new Date(lastmod) > new Date(lastTrained);
  }, [lastmod, lastTrained, qaItems.length]);

  // Q&A Modal State
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [editingQa, setEditingQa] = useState<KnowledgeQA | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'qa' | 'doc'; id: string; fileUrl?: string; docId?: string } | null>(null);

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
      const { error } = await deleteDocument(
        itemToDelete.id, 
        itemToDelete.fileUrl,
        itemToDelete.docId,
        (widget as any)?.documents_delete_webhook_url
      );
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
      toast({ title: 'Napaka', description: 'Webhook URL ni nastavljen.', variant: 'destructive' });
      return;
    }

    if (qaItems.length === 0) {
      toast({ title: 'Napaka', description: 'Ni Q&A parov za treniranje.', variant: 'destructive' });
      return;
    }

    setTraining(true);

    // Sproži webhook TAKOJ (fire and forget)
    fetch(widget.qa_webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markdown: buildMarkdown(),
        lastmod: getLatestTimestamp()
      })
    }).catch(console.error);

    // Počakaj NAJMANJ 2 sekundi za boljši UX
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Posodobi last_trained
    await updateLastTrained();
    await fetchLastmod();

    setTraining(false);
    toast({ 
      title: '✓ Uspešno natrenirano', 
      description: 'Vaš chatbot je bil uspešno posodobljen z novimi Q&A pari.' 
    });
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.includes('pdf')) {
      toast({ title: 'Napaka', description: 'Samo PDF datoteke so dovoljene.', variant: 'destructive' });
      return;
    }

    const { data, error } = await uploadDocument(file, widget?.documents_webhook_url);
    if (error) {
      toast({ title: 'Napaka', description: error.message || 'Napaka pri nalaganju dokumenta.', variant: 'destructive' });
    } else {
      toast({ title: 'Uspeh', description: 'Dokument naložen in se procesira.' });
    }
  }, [uploadDocument, widget?.documents_webhook_url, toast]);

  const handleOpenDocument = (fileUrl: string) => {
    if (!fileUrl) {
      toast({ title: 'Napaka', description: 'URL dokumenta ni na voljo.', variant: 'destructive' });
      return;
    }
    window.open(fileUrl, '_blank');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'V procesu' },
      processing: { variant: 'default', label: 'V procesu' },
      done: { variant: 'outline', label: 'Naloženo' },
      error: { variant: 'destructive', label: 'Napaka' }
    };
    
    const { variant, label } = config[status] || config.pending;
    
    return <Badge variant={variant}>{label}</Badge>;
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        {/* Q&A Column */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>Q&A</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => handleOpenQaModal()} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Dodaj
              </Button>
              {needsTraining ? (
                <Button 
                  onClick={handleTrain} 
                  disabled={training || qaItems.length === 0}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {training ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Treniram...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Treniraj chatbota
                    </>
                  )}
                </Button>
              ) : qaItems.length > 0 ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Chatbot je natreniran</span>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[570px]">
            {/* Info box z nasvetom */}
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Nasvet za boljše odgovore</p>
                  <p className="mt-1 text-blue-600 dark:text-blue-400">
                    Odgovori naj bodo čim bolj podrobni in obsežni. Vključite vse pomembne informacije, 
                    da bo chatbot lahko natančno odgovoril na vprašanja vaših strank.
                  </p>
                </div>
              </div>
            </div>

            {qaLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : qaItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Ni Q&A parov.</p>
                <p className="text-sm">Kliknite "Dodaj" za začetek.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {qaItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm line-clamp-2">{item.question}</p>
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{item.answer}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(item.created_at), 'dd. MMM yyyy', { locale: sl })}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenQaModal(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setItemToDelete({ type: 'qa', id: item.id });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Column */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Dokumenti</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-auto max-h-[570px]">
            {/* Upload Area */}
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Nalaganje...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Povlecite PDF sem ali kliknite
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maksimalna velikost: 10MB
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
                <File className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Ni naloženih dokumentov.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div 
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => doc.file_url && handleOpenDocument(doc.file_url)}
                      title="Klikni za ogled dokumenta"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate hover:underline">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.created_at), 'dd. MMM yyyy', { locale: sl })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(doc.status)}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete({ type: 'doc', id: doc.id, fileUrl: doc.file_url, docId: doc.doc_id });
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                onKeyDown={(e) => {
                  // Prepreči Enter pri vprašanju
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                  }
                }}
                placeholder="Vnesite vprašanje (brez prelomov vrstic)..."
                rows={2}
                className="resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Odgovor</label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Vnesite podroben odgovor... (Enter za novo vrstico)"
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Napišite čim bolj podroben odgovor z vsemi relevantnimi informacijami.
              </p>
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
