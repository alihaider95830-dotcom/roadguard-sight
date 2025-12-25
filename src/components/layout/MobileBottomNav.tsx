import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, History, BarChart3, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Alerts', path: '/alerts', icon: AlertTriangle },
  { label: 'History', path: '/history', icon: History },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
];

interface MobileBottomNavProps {
  pendingAlerts?: number;
  onMoreClick?: () => void;
}

export function MobileBottomNav({ pendingAlerts = 0, onMoreClick }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const showBadge = item.path === '/alerts' && pendingAlerts > 0;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                {showBadge && (
                  <Badge
                    variant="unsafe"
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {pendingAlerts > 9 ? '9+' : pendingAlerts}
                  </Badge>
                )}
              </div>
              <span className={cn('text-[10px] font-medium', isActive && 'text-primary')}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
        
        {/* More button for drawer menu */}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}

export default MobileBottomNav;
