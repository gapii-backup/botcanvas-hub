import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Users,
  Settings,
  CreditCard,
  HelpCircle,
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
  TicketCheck,
  Save,
  Undo2,
  Lock,
} from 'lucide-react';
import { useWidget } from '@/hooks/useWidget';

interface DashboardSidebarProps {
  children: React.ReactNode;
}

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  requiresPro?: boolean;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Pogovori', icon: MessageSquare, href: '/dashboard/conversations' },
  { label: 'Analiza', icon: BarChart3, href: '/dashboard/analytics', requiresPro: true },
  { label: 'Kontakti', icon: Users, href: '/dashboard/contacts', requiresPro: true },
  { label: 'Support Ticketi', icon: TicketCheck, href: '/dashboard/support', requiresPro: true },
  { label: 'Nastavitve', icon: Settings, href: '/dashboard/settings' },
  { label: 'Računi', icon: CreditCard, href: '/dashboard/billing' },
  { label: 'Pomoč', icon: HelpCircle, href: '/dashboard/help' },
];

export function DashboardSidebar({ 
  children,
}: DashboardSidebarProps) {
  const { widget } = useWidget();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { 
    hasUnsavedChanges, 
    setHasUnsavedChanges,
    pendingNavigation, 
    setPendingNavigation,
    onSave,
    onDiscard
  } = useUnsavedChanges();

  // Check if user has Pro or Enterprise plan
  const hasProAccess = widget?.plan === 'pro' || widget?.plan === 'enterprise';

  // Check if a section is locked for basic users
  const isLocked = (item: NavItem) => {
    if (hasProAccess) return false;
    return item.requiresPro === true;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNavClick = (href: string) => {
    // Check for unsaved changes before navigating
    if (hasUnsavedChanges && location.pathname !== href) {
      setPendingNavigation(href);
      setShowUnsavedDialog(true);
      return;
    }
    navigate(href);
    setMobileMenuOpen(false);
  };

  const handleSaveAndContinue = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave();
        setHasUnsavedChanges(false);
        if (pendingNavigation) {
          navigate(pendingNavigation);
          setPendingNavigation(null);
        }
      } finally {
        setIsSaving(false);
      }
    }
    setShowUnsavedDialog(false);
    setMobileMenuOpen(false);
  };

  const handleDiscardAndContinue = () => {
    if (onDiscard) {
      onDiscard();
    }
    setHasUnsavedChanges(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
    setShowUnsavedDialog(false);
    setMobileMenuOpen(false);
  };

  const handleStayHere = () => {
    setPendingNavigation(null);
    setShowUnsavedDialog(false);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:hidden z-50">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">BotMotion.ai</span>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {user?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNavClick('/dashboard/settings')}>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavClick('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Nastavitve
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Odjava
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed top-16 left-0 bottom-0 w-64 bg-card border-r border-border z-40 transition-transform duration-300 lg:hidden",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const locked = isLocked(item);
            
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="text-lg font-bold text-foreground">BotMotion.ai</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const locked = isLocked(item);
            
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </button>
            );
          })}
        </nav>

        {/* User Info at Bottom */}
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 px-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 text-left truncate">
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleNavClick('/dashboard/settings')}>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavClick('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Nastavitve
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Odjava
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64">
        <div className="pt-16 lg:pt-0 min-h-screen">
          {children}
        </div>
      </main>

      {/* Unsaved changes dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Neshranjene spremembe</AlertDialogTitle>
            <AlertDialogDescription>
              Imate neshranjene spremembe. Kaj želite narediti?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleStayHere}>
              Ostani tukaj
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleDiscardAndContinue}
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Prekliči spremembe
            </Button>
            <AlertDialogAction onClick={handleSaveAndContinue} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Shranjujem...' : 'Shrani'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
