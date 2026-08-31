export interface PersistHydrationStore {
  hasHydrated: () => boolean;
  onFinishHydration: (listener: () => void) => () => void;
}

export function subscribeToPersistHydration(
  stores: PersistHydrationStore[],
  onHydrationChange: (hydrated: boolean) => void,
): () => void {
  const updateHydrationState = () => {
    onHydrationChange(stores.every((store) => store.hasHydrated()));
  };

  const unsubscribers = stores.map((store) =>
    store.onFinishHydration(updateHydrationState),
  );
  updateHydrationState();

  return () => {
    for (const unsubscribe of unsubscribers) unsubscribe();
  };
}
