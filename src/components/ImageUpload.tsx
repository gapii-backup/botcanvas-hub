import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Image as ImageIcon, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type ImageUploadProps = {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
};

export function ImageUpload({ value, onChange, placeholder = "URL slike" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Napaka',
        description: 'Prosimo, izberite slikovno datoteko.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Napaka',
        description: 'Slika je prevelika. Največja velikost je 2MB.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Napaka',
        description: 'Morate biti prijavljeni za nalaganje slik.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('bot-avatars')
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('bot-avatars')
        .getPublicUrl(fileName);

      onChange(publicUrl);
      
      toast({
        title: 'Uspešno!',
        description: 'Slika je bila naložena.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Napaka',
        description: 'Ni bilo mogoče naložiti slike.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      {value && (
        <div className="relative inline-block">
          <div 
            className="w-16 h-16 rounded-xl overflow-hidden border-2 border-border"
            style={{ backgroundColor: 'hsl(var(--muted))' }}
          >
            <img 
              src={value} 
              alt="Avatar preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Upload buttons */}
      {!value && !showUrlInput && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Nalagam...' : 'Naloži sliko'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowUrlInput(true)}
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* URL input */}
      {!value && showUrlInput && (
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowUrlInput(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Help text */}
      {!value && !showUrlInput && (
        <p className="text-xs text-muted-foreground">
          Naloži sliko ali vnesi URL. Največja velikost: 2MB.
        </p>
      )}
    </div>
  );
}
