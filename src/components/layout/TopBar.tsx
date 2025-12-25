import { Bell, Volume2, VolumeX, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface TopBarProps {
  pendingAlerts?: number;
  onMobileMenuToggle?: () => void;
}

export function TopBar({ pendingAlerts = 0, onMobileMenuToggle }: TopBarProps) {
  const { user, logout } = useAuthStore();
  const { audioMuted, toggleAudioMute } = useSettingsStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 sm:h-16 bg-card border-b border-border flex items-center justify-between px-3 sm:px-6">
      {/* Left section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onMobileMenuToggle}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-safe animate-pulse" />
          <span className="text-xs sm:text-sm text-muted-foreground font-mono hidden sm:inline">
            System Online
          </span>
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Audio toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleAudioMute}
          className="relative h-9 w-9 sm:h-10 sm:w-10"
          title={audioMuted ? 'Unmute alerts' : 'Mute alerts'}
        >
          {audioMuted ? (
            <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          ) : (
            <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>

        {/* Alerts button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/alerts')}
          className="relative h-9 w-9 sm:h-10 sm:w-10"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {pendingAlerts > 0 && (
            <Badge
              variant="unsafe"
              className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs"
            >
              {pendingAlerts > 9 ? '9+' : pendingAlerts}
            </Badge>
          )}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 sm:px-3">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="truncate">{user?.email}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Badge variant={user?.role === 'Admin' ? 'default' : 'secondary'}>
                {user?.role}
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default TopBar;
