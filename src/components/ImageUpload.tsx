import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Link, Bot, MessageCircle, Sparkles, Headphones, Zap, Brain, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BOT_ICONS } from '@/hooks/useWizardConfig';

type ImageUploadProps = {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  selectedIcon?: string;
  onIconChange?: (iconName: string) => void;
  primaryColor?: string;
};

// Map icon names to Lucide components
const IconComponents: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  Robot: Bot,
  Bot: Bot,
  MessageCircle: MessageCircle,
  Sparkles: Sparkles,
  Headphones: Headphones,
  Zap: Zap,
  Brain: Brain,
  Heart: Heart,
};

export function ImageUpload({ 
  value, 
  onChange, 
  placeholder = "URL slike",
  selectedIcon = 'Robot',
  onIconChange,
  primaryColor = '#3B82F6'
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
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
      setShowIconPicker(false);
      
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

  const handleSelectIcon = (iconName: string) => {
    onIconChange?.(iconName);
    onChange(''); // Clear any uploaded image
    setShowIconPicker(false);
  };

  const SelectedIconComponent = IconComponents[selectedIcon] || Bot;

  return (
    <div className="space-y-3">
      {/* Current selection preview */}
      <div className="flex items-center gap-3">
        {/* Avatar/Icon preview */}
        <div 
          className="w-14 h-14 rounded-xl overflow-hidden border-2 border-border flex items-center justify-center"
          style={{ backgroundColor: value ? 'hsl(var(--muted))' : primaryColor }}
        >
          {value ? (
            <img 
              src={value} 
              alt="Avatar preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <SelectedIconComponent className="w-7 h-7 text-white" />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5">
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Odstrani
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">
              {BOT_ICONS.find(i => i.name === selectedIcon)?.name || 'Robot'} ikona
            </span>
          )}
        </div>
      </div>

      {/* Upload/Icon options */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Nalagam...' : 'Naloži sliko'}
        </Button>
        <Button
          type="button"
          variant={showIconPicker ? "default" : "outline"}
          size="sm"
          onClick={() => setShowIconPicker(!showIconPicker)}
          className="flex-1"
        >
          <Bot className="h-4 w-4 mr-2" />
          Izberi ikono
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      {/* URL input */}
      {showUrlInput && (
        <div className="flex gap-2 animate-fade-in">
          <Input
            placeholder={placeholder}
            value={value}
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

      {/* Icon picker */}
      {showIconPicker && (
        <div className="grid grid-cols-4 gap-2 p-3 rounded-lg border border-border bg-muted/30 animate-fade-in">
          {Object.keys(IconComponents).map((iconName) => {
            const IconComp = IconComponents[iconName];
            const isSelected = selectedIcon === iconName && !value;
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => handleSelectIcon(iconName)}
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center transition-all hover:scale-105",
                  isSelected 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                    : "hover:bg-muted"
                )}
                style={{ backgroundColor: isSelected ? primaryColor : undefined }}
              >
                <IconComp 
                  className="w-6 h-6" 
                  style={{ color: isSelected ? 'white' : 'hsl(var(--foreground))' }}
                />
              </button>
            );
          })}
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
    </div>
  );
}
