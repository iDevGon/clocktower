import { useConnection } from './useConnection';
import { useGameActions } from './useGameActions';

export function useSocket() {
  const { connect, joinGame, rejoinGame } = useConnection();
  const { castVote, submitNightAction, sendWhisper, nominatePlayer } =
    useGameActions();

  return {
    connect,
    joinGame,
    rejoinGame,
    castVote,
    submitNightAction,
    sendWhisper,
    nominatePlayer,
  };
}
