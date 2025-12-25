import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  AlertTriangle,
  History,
  BarChart3,
  Users,
  Settings,
  FileText,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Alerts', path: '/alerts', icon: AlertTriangle },
  { label: 'History', path: '/history', icon: History },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
];

const adminNavItems: NavItem[] = [
  { label: 'Users', path: '/admin/users', icon: Users, adminOnly: true },
  { label: 'Settings', path: '/admin/settings', icon: Settings, adminOnly: true },
  { label: 'Audit Logs', path: '/admin/audit', icon: FileText, adminOnly: true },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin';
  const isMobile = useIsMobile();

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between border-b border-sidebar-border px-4">
        {collapsed && !isMobile ? (
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-lg">A</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-accent-foreground">ATIS</h1>
              <p className="text-xs text-sidebar-foreground">Tire Inspection</p>
            </div>
          </div>
        )}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="p-2 rounded-md hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5 text-sidebar-foreground" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {/* Main nav */}
        <div className="space-y-1">
          {(!collapsed || isMobile) && (
            <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground uppercase tracking-wider">
              Main
            </p>
          )}
          {mainNavItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
              collapsed={collapsed && !isMobile}
              onNavigate={onMobileClose}
            />
          ))}
        </div>

        {/* Admin nav */}
        {isAdmin && (
          <div className="space-y-1 pt-4 border-t border-sidebar-border mt-4">
            {(!collapsed || isMobile) && (
              <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground uppercase tracking-wider">
                Admin
              </p>
            )}
            {adminNavItems.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isActive={location.pathname === item.path}
                collapsed={collapsed && !isMobile}
                onNavigate={onMobileClose}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Collapse toggle - desktop only */}
      {!isMobile && (
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={onToggle}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors',
              collapsed && 'px-0'
            )}
          >
            <ChevronRight
              className={cn('h-4 w-4 transition-transform', !collapsed && 'rotate-180')}
            />
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      )}
    </>
  );

  // Mobile: use Sheet/Drawer
  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            {sidebarContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: fixed sidebar
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {sidebarContent}
    </aside>
  );
}

function NavItem({
  item,
  isActive,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <RouterNavLink
      to={item.path}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 py-2.5 px-3 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
        collapsed && 'justify-center px-0'
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-sidebar-primary')} />
      {!collapsed && <span>{item.label}</span>}
    </RouterNavLink>
  );
}

export default Sidebar;
