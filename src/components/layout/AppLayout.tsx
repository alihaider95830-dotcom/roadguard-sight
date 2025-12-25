import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuthStore } from '@/stores/authStore';
import { api, subscribeToEvents, startRealtimeSimulation } from '@/lib/api';
import type { Alert } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useSettingsStore } from '@/stores/settingsStore';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingAlerts, setPendingAlerts] = useState(0);
  const { isAuthenticated } = useAuthStore();
  const { audioMuted, audioAlarmEnabled } = useSettingsStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  // Start real-time simulation and subscribe to events
  useEffect(() => {
    startRealtimeSimulation();

    // Fetch initial pending alerts count
    api.getAlerts('Pending').then((alerts) => {
      setPendingAlerts(alerts.length);
    });

    // Subscribe to new alerts
    const unsubscribe = subscribeToEvents<Alert>('alert.created', (alert) => {
      setPendingAlerts((prev) => prev + 1);
      
      // Show toast notification
      toast({
        variant: 'destructive',
        title: 'New Alert!',
        description: alert.summary,
      });

      // Play audio alarm
      if (audioAlarmEnabled && !audioMuted) {
        playAlarmSound();
      }
    });

    // Subscribe to alert updates
    const unsubscribeUpdates = subscribeToEvents<Alert>('alert.updated', (alert) => {
      if (alert.status !== 'Pending') {
        setPendingAlerts((prev) => Math.max(0, prev - 1));
      }
    });

    return () => {
      unsubscribe();
      unsubscribeUpdates();
    };
  }, [toast, audioAlarmEnabled, audioMuted]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 w-full',
          !isMobile && (sidebarCollapsed ? 'ml-16' : 'ml-64')
        )}
      >
        <TopBar
          pendingAlerts={pendingAlerts}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className={cn(
          'flex-1 p-3 sm:p-4 md:p-6 overflow-auto',
          isMobile && 'pb-20' // Add padding for bottom nav
        )}>
          <Outlet />
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav
          pendingAlerts={pendingAlerts}
          onMoreClick={() => setMobileMenuOpen(true)}
        />
      )}
    </div>
  );
}

// Simple alarm sound using Web Audio API
function playAlarmSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch {
    console.log('Audio playback not available');
  }
}

export default AppLayout;
