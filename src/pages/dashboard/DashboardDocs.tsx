import { useState } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useWidget } from '@/hooks/useWidget';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountDeactivatedLock } from '@/components/dashboard/AccountDeactivatedLock';
import { SetupPendingLock } from '@/components/dashboard/SetupPendingLock';
import { Badge } from '@/components/ui/badge';
import { LightboxImage } from '@/components/ui/lightbox-image';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Code,
  Copy,
  Check,
  Globe,
  ShoppingBag,
  FileCode,
  ExternalLink,
  ChevronDown,
  MessageSquare,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';


export default function DashboardDocs() {
  const { widget, loading } = useWidget();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  const embedCode = widget?.api_key 
    ? `<script src="https://cdn.botmotion.ai/widget.js" data-key="${widget.api_key}"></script>`
    : '';

  const copyToClipboard = (text: string, type: 'embed' | 'other' = 'embed') => {
    navigator.clipboard.writeText(text);
    if (type === 'embed') {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
    toast({
      title: 'Kopirano!',
      description: 'Koda je bila kopirana v odložišče.',
    });
  };

  if (loading) {
    return (
      <DashboardSidebar>
        <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </DashboardSidebar>
    );
  }

  if (widget?.status === 'pending') {
    return (
      <DashboardSidebar>
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold">Dokumentacija</h1>
            <p className="text-sm md:text-base text-muted-foreground">Kako namestiti chatbot na vašo spletno stran</p>
          </div>
          <SetupPendingLock />
        </div>
      </DashboardSidebar>
    );
  }

  if (widget?.subscription_status === 'cancelled') {
    return (
      <DashboardSidebar>
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold">Dokumentacija</h1>
            <p className="text-sm md:text-base text-muted-foreground">Kako namestiti chatbot na vašo spletno stran</p>
          </div>
          <AccountDeactivatedLock />
        </div>
      </DashboardSidebar>
    );
  }

  const sections = [
    {
      id: 'embed',
      title: '1. Embed koda',
      icon: Code,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/20',
      content: (
        <div className="space-y-3 md:space-y-4">
          <p className="text-sm md:text-base text-muted-foreground">
            Kopirajte spodnjo kodo in jo dodajte na vašo spletno stran:
          </p>
          
          {widget?.api_key ? (
            <div className="relative">
              <pre className="bg-muted/50 rounded-lg p-3 md:p-4 overflow-x-auto font-mono text-xs md:text-sm border border-border">
                <code>{embedCode}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 text-xs md:text-sm"
                onClick={() => copyToClipboard(embedCode)}
              >
                {copiedEmbed ? (
                  <>
                    <Check className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    <span className="hidden sm:inline">Kopirano</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    <span className="hidden sm:inline">Kopiraj kodo</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 md:p-4">
              <p className="text-warning text-xs md:text-sm">
                ⚠️ Če je vaš chatbot še v pripravi, embed koda še ni na voljo.
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'placement',
      title: '2. HTML',
      icon: FileCode,
      iconColor: 'text-success',
      bgColor: 'bg-success/20',
      content: (
        <div className="space-y-3 md:space-y-4">
          <p className="text-sm md:text-base text-muted-foreground">
            Kodo prilepite pred zaključni <code className="bg-muted px-1 md:px-1.5 py-0.5 rounded text-xs md:text-sm font-mono">&lt;/body&gt;</code> tag na vaši spletni strani.
          </p>
          
          <pre className="bg-muted/50 rounded-lg p-3 md:p-4 overflow-x-auto font-mono text-xs md:text-sm border border-border">
            <code>{`<!DOCTYPE html>
<html>
<head>
  <title>Vaša stran</title>
</head>
<body>
  <!-- Vsebina vaše strani -->
  
  <!-- BotMotion chatbot - prilepite TUKAJ -->
  <script src="https://cdn.botmotion.ai/widget.js" data-key="vaš-api-ključ"></script>
</body>
</html>`}</code>
          </pre>
        </div>
      ),
    },
    {
      id: 'wordpress',
      title: '3. WordPress',
      subtitle: 'Priporočamo uporabo vtičnika HFCM za lažjo namestitev',
      icon: Globe,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      content: (
        <div className="space-y-4 md:space-y-6">
          {/* Option 1 - HFCM Plugin */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm md:text-base font-medium">Opcija 1 - HFCM vtičnik</h3>
              <Badge className="bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 border-emerald-500/30 text-xs">
                Priporočeno
              </Badge>
            </div>
            
            <p className="text-sm md:text-base text-muted-foreground">
              Namestite brezplačni vtičnik Header Footer Code Manager:
            </p>
            
            <a
              href="https://wordpress.org/plugins/header-footer-code-manager/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-colors font-medium text-sm md:text-base w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4" />
              Prenesi HFCM vtičnik
            </a>
            
            <ol className="list-decimal list-inside space-y-1.5 md:space-y-2 text-sm md:text-base text-muted-foreground">
              <li>V stranskem meniju kliknite <strong className="text-foreground">HFCM → Add New</strong></li>
              <li>Pri "Snippet Name" vpišite poljubno ime (npr. "Chatbot")</li>
              <li>Pri "Location" izberite <strong className="text-foreground">"Footer"</strong></li>
              <li>V polje "Snippet / Code" prilepite vašo embed kodo in kliknite <strong className="text-foreground">Save</strong></li>
            </ol>
            
            <LightboxImage 
              src="/docs/wordpress-hfcm.png" 
              alt="WordPress HFCM vtičnik nastavitve"
            />
          </div>

          {/* Option 2 - Manual editing */}
          <Collapsible open={isManualOpen} onOpenChange={setIsManualOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full text-sm md:text-base">
              <ChevronDown className={cn("h-4 w-4 transition-transform shrink-0", isManualOpen && "rotate-180")} />
              <span className="font-medium">Opcija 2: Ročno urejanje teme</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 md:mt-4 space-y-3 md:space-y-4 pl-4 md:pl-6 border-l-2 border-border">
              <ol className="list-decimal list-inside space-y-1.5 md:space-y-2 text-sm md:text-base text-muted-foreground">
                <li>Pojdite na <strong className="text-foreground">Videz → Urejevalnik datotek tem</strong></li>
                <li>V desnem stolpcu izberite <strong className="text-foreground">"Noga teme" (footer.php)</strong></li>
                <li>Prilepite embed kodo pred <code className="bg-muted px-1 md:px-1.5 py-0.5 rounded text-xs md:text-sm font-mono">&lt;/body&gt;</code> tag in shranite</li>
              </ol>
              
              <LightboxImage 
                src="/docs/wordpress-manual.png" 
                alt="WordPress ročno urejanje teme"
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      ),
    },
    {
      id: 'shopify',
      title: '4. Shopify',
      icon: ShoppingBag,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/20',
      content: (
        <div className="space-y-3 md:space-y-4">
          <ol className="list-decimal list-inside space-y-1.5 md:space-y-2 text-sm md:text-base text-muted-foreground">
            <li>Pojdite na <strong className="text-foreground">Online Store → Themes</strong></li>
            <li>Pri vaši aktivni temi kliknite na tri pikice (⋯) in izberite <strong className="text-foreground">"Edit code"</strong></li>
          </ol>
          
          <LightboxImage 
            src="/docs/shopify-1.png" 
            alt="Shopify Themes nastavitve"
          />

          <ol start={3} className="list-decimal list-inside space-y-1.5 md:space-y-2 text-sm md:text-base text-muted-foreground">
            <li>V levem meniju odprite mapo <strong className="text-foreground">"Layout"</strong> in kliknite na <strong className="text-foreground">"theme.liquid"</strong></li>
            <li>Prilepite embed kodo pred <code className="bg-muted px-1 md:px-1.5 py-0.5 rounded text-xs md:text-sm font-mono">&lt;/body&gt;</code> tag in kliknite <strong className="text-foreground">"Save"</strong></li>
          </ol>
          
          <LightboxImage 
            src="/docs/shopify-2.png" 
            alt="Shopify theme.liquid urejanje"
          />
        </div>
      ),
    },
    {
      id: 'help',
      title: 'Potrebujete pomoč pri namestitvi?',
      icon: Calendar,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/20',
      content: (
        <div className="space-y-4 md:space-y-5">
          <p className="text-sm md:text-base text-muted-foreground">
            Z veseljem vam pomagamo namestiti chatbot na vašo spletno stran.
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Button
              variant="outline"
              className="w-full sm:w-auto justify-center gap-2"
              onClick={() => navigate('/dashboard/help')}
            >
              <MessageSquare className="h-4 w-4" />
              Kontaktirajte nas
            </Button>
            <Button
              className="w-full sm:w-auto justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0"
              onClick={() => window.open('https://cal.botmotion.ai/admin/nastavitev-chatbota', '_blank')}
            >
              <Calendar className="h-4 w-4" />
              Naroči brezplačno namestitev
            </Button>
          </div>

          {/* Info boxes */}
          <div className="space-y-3">
            {/* Neutral info box */}
            <div className="bg-muted/50 border border-border rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-muted-foreground">
                Brezplačna pomoč pri namestitvi preko TeamViewer-ja. Termin traja približno 15 minut.
              </p>
            </div>
            
            {/* Warning info box */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 md:p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm text-amber-700 dark:text-amber-400">
                Pred terminom si namestite{' '}
                <a
                  href="https://www.teamviewer.com/en/download/windows/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2 hover:text-amber-600 dark:hover:text-amber-300 inline-flex items-center gap-1"
                >
                  TeamViewer
                  <ExternalLink className="h-3 w-3" />
                </a>
                {' '}za oddaljeni dostop.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <DashboardSidebar>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8 animate-fade-in">
          <h1 className="text-xl md:text-2xl font-bold">Dokumentacija</h1>
          <p className="text-sm md:text-base text-muted-foreground">Kako namestiti chatbot na vašo spletno stran</p>
        </div>

        {/* Sections */}
        <div className="space-y-4 md:space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.id}
                className={cn(
                  "glass p-4 md:p-6 animate-slide-up",
                  `delay-${(index + 1) * 100}`
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className={cn("h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center shrink-0", section.bgColor)}>
                    <Icon className={cn("h-4 w-4 md:h-5 md:w-5", section.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base md:text-lg font-semibold mb-1">{section.title}</h2>
                    {'subtitle' in section && section.subtitle && (
                      <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">{section.subtitle}</p>
                    )}
                    {!('subtitle' in section) && <div className="mb-3 md:mb-4" />}
                    {section.content}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardSidebar>
  );
}
