import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SystemSettings } from '@/types';

interface SettingsState extends SystemSettings {
  audioMuted: boolean;
  setAlertTimeout: (timeout: number) => void;
  setAudioAlarmEnabled: (enabled: boolean) => void;
  toggleAudioMute: () => void;
  setApiBaseUrl: (url: string) => void;
  setWsUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      alertAcknowledgmentTimeout: 60,
      audioAlarmEnabled: true,
      audioMuted: false,
      apiBaseUrl: '/api',
      wsUrl: 'ws://localhost:8080/realtime',

      setAlertTimeout: (timeout: number) => set({ alertAcknowledgmentTimeout: timeout }),
      setAudioAlarmEnabled: (enabled: boolean) => set({ audioAlarmEnabled: enabled }),
      toggleAudioMute: () => set((state) => ({ audioMuted: !state.audioMuted })),
      setApiBaseUrl: (url: string) => set({ apiBaseUrl: url }),
      setWsUrl: (url: string) => set({ wsUrl: url }),
    }),
    {
      name: 'atis-settings',
    }
  )
);
