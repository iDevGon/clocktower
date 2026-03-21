import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsStore {
  lowPowerMode: boolean;
  setLowPowerMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      lowPowerMode: false,
      setLowPowerMode: (enabled) => set({ lowPowerMode: enabled }),
    }),
    {
      name: 'clocktower-storyteller-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
