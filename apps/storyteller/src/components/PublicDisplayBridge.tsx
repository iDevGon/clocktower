import { useEffect } from 'react';
import { Platform } from 'react-native';
import { createPublicDisplayProjector } from '../publicDisplay/model';
import {
  closePublicDisplay,
  updatePublicDisplay,
} from '../publicDisplay/window';
import { useConnectionStore } from '../stores/connectionStore';
import { useGameStore } from '../stores/gameStore';

/** Mounted above routes so navigation never interrupts the public window. */
export function PublicDisplayBridge() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const project = createPublicDisplayProjector();
    const update = () =>
      updatePublicDisplay(
        project(useGameStore.getState()),
        useConnectionStore.getState().isConnected,
      );
    update();
    const unsubscribeGame = useGameStore.subscribe(update);
    const unsubscribeConnection = useConnectionStore.subscribe(update);
    window.addEventListener('pagehide', closePublicDisplay);
    return () => {
      unsubscribeGame();
      unsubscribeConnection();
      window.removeEventListener('pagehide', closePublicDisplay);
      closePublicDisplay();
    };
  }, []);
  return null;
}
