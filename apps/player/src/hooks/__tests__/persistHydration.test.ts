import { describe, expect, it, vi } from 'vitest';
import {
  type PersistHydrationStore,
  subscribeToPersistHydration,
} from '../persistHydration';

describe('subscribeToPersistHydration', () => {
  it('listener 등록 중 hydration이 완료돼도 마지막 상태를 true로 관측한다', () => {
    const hydrated = [false, false];
    const observed: boolean[] = [];
    const stores: PersistHydrationStore[] = [
      {
        hasHydrated: () => hydrated[0],
        onFinishHydration: () => {
          hydrated[0] = true;
          hydrated[1] = true;
          return vi.fn();
        },
      },
      {
        hasHydrated: () => hydrated[1],
        onFinishHydration: () => vi.fn(),
      },
    ];

    subscribeToPersistHydration(stores, (value) => observed.push(value));

    expect(observed.at(-1)).toBe(true);
  });

  it('cleanup 시 두 store의 hydration 구독을 모두 해제한다', () => {
    const unsubscribeConnection = vi.fn();
    const unsubscribePlayer = vi.fn();
    const stores: PersistHydrationStore[] = [
      {
        hasHydrated: () => true,
        onFinishHydration: () => unsubscribeConnection,
      },
      {
        hasHydrated: () => true,
        onFinishHydration: () => unsubscribePlayer,
      },
    ];

    const cleanup = subscribeToPersistHydration(stores, vi.fn());
    cleanup();

    expect(unsubscribeConnection).toHaveBeenCalledOnce();
    expect(unsubscribePlayer).toHaveBeenCalledOnce();
  });
});
