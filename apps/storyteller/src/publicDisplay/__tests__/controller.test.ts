import { describe, expect, it, vi } from 'vitest';
import { createPublicDisplayWindow } from '../controller';

function browser(blocked = false) {
  const elements = new Map(
    [
      'connection',
      'heading',
      'timer',
      'board',
      'composition',
      'script',
      'activity',
      'display-root',
      'display-canvas',
      'fullscreen',
    ].map((id) => [
      id,
      {
        innerHTML: '',
        textContent: '',
        addEventListener: vi.fn(),
        style: { transform: '', left: '', top: '' },
        scrollWidth: 1600,
        scrollHeight: 900,
      },
    ]),
  );
  const popup = {
    closed: false,
    innerWidth: 1280,
    innerHeight: 720,
    addEventListener: vi.fn(),
    focus: vi.fn(),
    close: vi.fn(),
    document: {
      addEventListener: vi.fn(),
      title: '',
      documentElement: { innerHTML: '', lang: '' },
      getElementById: (id: string) => elements.get(id),
    },
  };
  const host = {
    open: vi.fn(() => (blocked ? null : popup)),
    setInterval: vi.fn(() => 1),
    clearInterval: vi.fn(),
  };
  return { host: host as unknown as Window, popup, elements, mocks: host };
}

describe('public display window lifecycle', () => {
  it('reports blocked popups without starting an interval', () => {
    const { host, mocks } = browser(true);
    expect(createPublicDisplayWindow(host).open()).toBe(false);
    expect(mocks.setInterval).not.toHaveBeenCalled();
  });

  it('reuses the existing window, reopens closed windows and cleans up', () => {
    const { host, popup, mocks } = browser();
    const display = createPublicDisplayWindow(host);
    expect(display.open()).toBe(true);
    expect(display.open()).toBe(true);
    expect(mocks.open).toHaveBeenCalledTimes(1);
    expect(popup.focus).toHaveBeenCalled();
    popup.closed = true;
    display.open();
    expect(mocks.open).toHaveBeenCalledTimes(2);
    expect(mocks.clearInterval).toHaveBeenCalledWith(1);
    display.close();
    expect(mocks.clearInterval).toHaveBeenCalledTimes(2);
  });

  it('shows reset and connection status without opening a window automatically', () => {
    const { host, mocks, elements } = browser();
    const display = createPublicDisplayWindow(host);
    display.update(null, false);
    expect(mocks.open).not.toHaveBeenCalled();
    display.open();
    expect(elements.get('connection')?.textContent).toContain('연결 끊김');
    expect(elements.get('heading')?.textContent).toContain('대기');
    display.update(null, true);
    expect(elements.get('connection')?.textContent).toBe('실시간 연결됨');
    expect(elements.get('script')?.innerHTML).toBe('');
  });

  it('fits the entire content into the window and recalculates when resized', () => {
    const { host, popup, elements } = browser();
    const canvas = elements.get('display-canvas');
    if (!canvas) throw new Error('missing canvas');
    createPublicDisplayWindow(host).open();
    expect(canvas.style.transform).toBe('scale(0.8)');
    expect(canvas.style.left).toBe('0px');
    expect(canvas.style.top).toBe('0px');
    // A long mixed script needs more height; all of it must still fit.
    canvas.scrollHeight = 1800;
    const resize = popup.addEventListener.mock.calls.find(
      ([event]) => event === 'resize',
    )?.[1];
    resize?.();
    expect(canvas.style.transform).toBe('scale(0.4)');
    expect(canvas.style.left).toBe('320px');
    expect(canvas.scrollHeight * 0.4).toBeLessThanOrEqual(popup.innerHeight);
    // Fullscreen must scale back up rather than retain the smaller size.
    popup.innerWidth = 1920;
    popup.innerHeight = 1080;
    canvas.scrollHeight = 900;
    resize?.();
    expect(canvas.style.transform).toBe('scale(1.2)');
  });
});
