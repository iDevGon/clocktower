import type { PublicDisplayModel } from './model';
import {
  formatDisplayTimer,
  PUBLIC_DISPLAY_CSS,
  renderPublicDisplay,
} from './render';

export function createPublicDisplayWindow(host: Window) {
  let popup: Window | null = null;
  let interval: number | null = null;
  let model: PublicDisplayModel | null = null;
  let connected = false;

  function stopTimer() {
    if (interval !== null) host.clearInterval(interval);
    interval = null;
  }

  function initialize() {
    if (!popup) return;
    const doc = popup.document;
    doc.documentElement.lang = 'ko';
    doc.documentElement.innerHTML = `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Clocktower · 공용 화면</title><style>${PUBLIC_DISPLAY_CSS}</style></head><body><div id="display-canvas"><header><div><span class="eyebrow">모두가 함께 보는 마을</span><h1 id="heading"></h1></div><span id="connection" role="status"></span><strong id="timer" aria-label="남은 시간"></strong><button id="fullscreen" type="button">전체 화면</button></header><main id="display-root"><div class="overview"><section id="board" aria-label="좌석 현황"></section><section id="composition" aria-label="기본 인원 분배"></section><section id="activity" aria-label="지명과 투표"></section></div><section id="script" aria-label="등장 가능한 직업"></section></main></div></body>`;
    doc.getElementById('fullscreen')?.addEventListener('click', async () => {
      const button = doc.getElementById('fullscreen');
      try {
        if (doc.fullscreenElement) await doc.exitFullscreen();
        else await doc.documentElement.requestFullscreen();
      } catch {
        if (button) button.textContent = '브라우저 전체 화면 키를 사용하세요';
      }
    });
    popup.addEventListener('resize', fitToWindow);
    doc.addEventListener('fullscreenchange', () => {
      fitToWindow();
      const button = doc.getElementById('fullscreen');
      if (button)
        button.textContent = doc.fullscreenElement
          ? '전체 화면 종료'
          : '전체 화면';
    });
  }

  function fitToWindow() {
    if (!popup || popup.closed) return;
    const canvas = popup.document.getElementById('display-canvas');
    if (!canvas) return;
    const width = canvas.scrollWidth;
    const height = canvas.scrollHeight;
    const scale = Math.min(
      popup.innerWidth / width,
      popup.innerHeight / height,
    );
    canvas.style.transform = `scale(${scale})`;
    canvas.style.left = `${(popup.innerWidth - width * scale) / 2}px`;
    canvas.style.top = `${(popup.innerHeight - height * scale) / 2}px`;
  }

  function render() {
    if (!popup || popup.closed) {
      popup = null;
      stopTimer();
      return;
    }
    const doc = popup.document;
    if (!doc.getElementById('display-root')) initialize();
    const setText = (id: string, value: string) => {
      const element = doc.getElementById(id);
      if (element && element.textContent !== value) element.textContent = value;
    };
    const setHtml = (id: string, value: string) => {
      const element = doc.getElementById(id);
      if (element && element.innerHTML !== value) element.innerHTML = value;
    };
    setText(
      'connection',
      connected ? '실시간 연결됨' : '연결 끊김 · 마지막 수신 정보',
    );
    setText('timer', formatDisplayTimer(model?.timer ?? null));
    if (!model) {
      setText('heading', '게임 대기 중');
      setHtml(
        'board',
        '<p class="muted">이야기꾼이 게임을 준비하고 있습니다.</p>',
      );
      for (const id of ['composition', 'activity', 'script']) setHtml(id, '');
      fitToWindow();
      return;
    }
    const sections = renderPublicDisplay(model);
    setText('heading', sections.heading);
    for (const id of ['board', 'composition', 'activity', 'script'] as const)
      setHtml(id, sections[id]);
    fitToWindow();
  }

  return {
    open() {
      if (popup && !popup.closed) {
        popup.focus();
        return true;
      }
      stopTimer();
      popup = host.open('', '_blank', 'popup,width=1440,height=1000');
      if (!popup) return false;
      initialize();
      render();
      interval = host.setInterval(render, 1000);
      return true;
    },
    update(next: PublicDisplayModel | null, isConnected: boolean) {
      model = next;
      connected = isConnected;
      if (popup) render();
    },
    close() {
      stopTimer();
      if (popup && !popup.closed) popup.close();
      popup = null;
    },
  };
}
