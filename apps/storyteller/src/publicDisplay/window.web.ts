import { createPublicDisplayWindow } from './controller';
import type { PublicDisplayModel } from './model';

let display: ReturnType<typeof createPublicDisplayWindow> | undefined;

export function openPublicDisplay() {
  display ??= createPublicDisplayWindow(window);
  return display.open();
}

export function updatePublicDisplay(
  model: PublicDisplayModel | null,
  connected: boolean,
) {
  display ??= createPublicDisplayWindow(window);
  display.update(model, connected);
}

export function closePublicDisplay() {
  display?.close();
}
