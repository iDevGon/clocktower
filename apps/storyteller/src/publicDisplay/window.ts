import type { PublicDisplayModel } from './model';

// Native entry point: the browser controller is only bundled on web.
export function openPublicDisplay(): boolean {
  return false;
}
export function updatePublicDisplay(
  _model: PublicDisplayModel | null,
  _connected: boolean,
): void {}
export function closePublicDisplay(): void {}
