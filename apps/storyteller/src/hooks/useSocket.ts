import { useConnectionStore } from '../stores/connectionStore';
import { useGameActions } from './useGameActions';
import { useSocketConnection } from './useSocketConnection';

/**
 * Convenience facade that combines connection management and game actions.
 * Prefer importing useSocketConnection or useGameActions directly
 * when you only need one concern.
 */
export function useSocket() {
  const isConnected = useConnectionStore((s) => s.isConnected);
  const { connect } = useSocketConnection();
  const actions = useGameActions();

  return {
    isConnected,
    connect,
    ...actions,
  };
}
