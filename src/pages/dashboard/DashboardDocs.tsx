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
  Mail,
  Phone,
  FileCode,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';


export default function DashboardDocs() {
  const { widget, loading } = useWidget();
  const { toast } = useToast();
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
        <div className="p-6 lg:p-8 space-y-6">
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
        <div className="p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Dokumentacija</h1>
            <p className="text-muted-foreground">Kako namestiti chatbot na vašo spletno stran</p>
          </div>
          <SetupPendingLock />
        </div>
      </DashboardSidebar>
    );
  }

  if (widget?.subscription_status === 'cancelled') {
    return (
      <DashboardSidebar>
        <div className="p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Dokumentacija</h1>
            <p className="text-muted-foreground">Kako namestiti chatbot na vašo spletno stran</p>
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
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Kopirajte spodnjo kodo in jo dodajte na vašo spletno stran:
          </p>
          
          {widget?.api_key ? (
            <div className="relative">
              <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto font-mono text-sm border border-border">
                <code>{embedCode}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(embedCode)}
              >
                {copiedEmbed ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Kopirano
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Kopiraj kodo
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <p className="text-warning text-sm">
                ⚠️ Če je vaš chatbot še v pripravi, embed koda še ni na voljo.
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'placement',
      title: '2. Kam prilepiti kodo?',
      icon: FileCode,
      iconColor: 'text-success',
      bgColor: 'bg-success/20',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Kodo prilepite pred zaključni <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">&lt;/body&gt;</code> tag na vaši spletni strani.
          </p>
          
          <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto font-mono text-sm border border-border">
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
        <div className="space-y-6">
          {/* Option 1 - HFCM Plugin */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Opcija 1 - HFCM vtičnik</h3>
              <Badge className="bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 border-emerald-500/30">
                Priporočeno
              </Badge>
            </div>
            
            <p className="text-muted-foreground">
              Namestite brezplačni vtičnik Header Footer Code Manager:
            </p>
            
            <a
              href="https://wordpress.org/plugins/header-footer-code-manager/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Prenesi HFCM vtičnik
            </a>
            
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
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
            <CollapsibleTrigger className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full">
              <ChevronDown className={cn("h-4 w-4 transition-transform", isManualOpen && "rotate-180")} />
              <span className="font-medium">Alternativa: Ročno urejanje teme (za napredne)</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4 pl-6 border-l-2 border-border">
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Pojdite na <strong className="text-foreground">Videz → Urejevalnik datotek tem</strong></li>
                <li>V desnem stolpcu izberite <strong className="text-foreground">"Noga teme" (footer.php)</strong></li>
                <li>Prilepite embed kodo pred <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">&lt;/body&gt;</code> tag in shranite</li>
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
        <div className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Pojdite na <strong className="text-foreground">Online Store → Themes</strong></li>
            <li>Pri vaši aktivni temi kliknite na tri pikice (⋯) in izberite <strong className="text-foreground">"Edit code"</strong></li>
          </ol>
          
          <LightboxImage 
            src="/docs/shopify-1.png" 
            alt="Shopify Themes nastavitve"
          />

          <ol start={3} className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>V levem meniju odprite mapo <strong className="text-foreground">"Layout"</strong> in kliknite na <strong className="text-foreground">"theme.liquid"</strong></li>
            <li>Prilepite embed kodo pred <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">&lt;/body&gt;</code> tag in kliknite <strong className="text-foreground">"Save"</strong></li>
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
      title: 'Potrebujete pomoč?',
      icon: Mail,
      iconColor: 'text-rose-500',
      bgColor: 'bg-rose-500/20',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Če imate težave z namestitvijo ali uporabljate drugo platformo (Wix, Squarespace, ipd.), nas kontaktirajte:
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:info@botmotion.ai"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              info@botmotion.ai
            </a>
            <a
              href="tel:+38641353600"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Phone className="h-4 w-4" />
              +386 41 353 600
            </a>
          </div>
        </div>
      ),
    },
  ];

  return (
    <DashboardSidebar>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold">Dokumentacija</h1>
          <p className="text-muted-foreground">Kako namestiti chatbot na vašo spletno stran</p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.id}
                className={cn(
                  "glass p-6 animate-slide-up",
                  `delay-${(index + 1) * 100}`
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", section.bgColor)}>
                    <Icon className={cn("h-5 w-5", section.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold mb-1">{section.title}</h2>
                    {'subtitle' in section && section.subtitle && (
                      <p className="text-sm text-muted-foreground mb-4">{section.subtitle}</p>
                    )}
                    {!('subtitle' in section) && <div className="mb-4" />}
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
