import { useEffect, useState } from 'react';
import { usePlayerStore } from '../stores/playerStore';

export function useWhisperExpired(): boolean {
  const whisperClock = usePlayerStore((s) => s.whisperClock);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!whisperClock) {
      setExpired(false);
      return;
    }
    const check = () => {
      const elapsed = Date.now() - whisperClock.startedAt;
      setExpired(elapsed >= whisperClock.durationMs);
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [whisperClock]);

  return expired;
}
