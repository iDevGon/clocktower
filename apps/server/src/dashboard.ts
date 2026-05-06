const IOS_EXPO_GO_URL = 'https://apps.apple.com/app/expo-go/id982107779';
const ANDROID_EXPO_GO_URL =
  'https://play.google.com/store/apps/details?id=host.exp.exponent';

function qrImgUrl(data: string, size = 280): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

function qrCard({
  title,
  subtitle,
  qrData,
  alt,
  buttonHref,
  buttonText,
}: {
  title: string;
  subtitle: string;
  qrData: string;
  alt: string;
  buttonHref?: string;
  buttonText?: string;
}): string {
  return `<div class="qr-card" role="button" tabindex="0" aria-pressed="false" aria-label="${title} 딤 처리">
    <div class="qr-title">${title}</div>
    <div class="qr-subtitle">${subtitle}</div>
    <div class="qr-frame"><img src="${qrImgUrl(qrData)}" alt="${alt}"></div>
    <div class="qr-url">${qrData}</div>
    ${
      buttonHref && buttonText
        ? `<a class="link-button" href="${buttonHref}" target="_blank" rel="noreferrer">${buttonText}</a>`
        : '<div class="scan-only">QR 스캔 전용</div>'
    }
  </div>`;
}

export function getDashboardHtml(
  serverUrl: string,
  playerUrl: string,
  storytellerUrl: string,
  playerExpUrl: string,
  storytellerExpUrl: string,
): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>시계탑 진행 대시보드</title>
<style>
@font-face{font-family:SchoolSafeStarrySky;src:url('/dashboard-fonts/SchoolSafeStarrySky-Bold.ttf') format('truetype');font-display:swap}
@font-face{font-family:IBMPlexSansKR;src:url('/dashboard-fonts/IBMPlexSansKR-Regular.ttf') format('truetype');font-display:swap}
@font-face{font-family:IBMPlexSansKR;font-weight:700;src:url('/dashboard-fonts/IBMPlexSansKR-Bold.ttf') format('truetype');font-display:swap}
:root{
  --base:#0d0703;--apparatus:#140b05;--panel:#261606;--ink:#10182f;--blue:#2f4f8f;
  --lens:#88aaf5;--brass:#b78642;--brass-dim:#76542a;--blood:#8d3529;
  --text:#f0d8b3;--strong:#ffe8bf;--muted:#c8ae86;--dead:#7d7160;
  --display:SchoolSafeStarrySky,serif;--body:IBMPlexSansKR,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
}
*{box-sizing:border-box}
html,body{height:100%;margin:0;overflow:hidden;background:var(--base);color:var(--text);font-family:var(--body)}
body{
  background:
    radial-gradient(circle at 16% 8%,rgba(47,79,143,.24),transparent 28%),
    radial-gradient(circle at 88% 18%,rgba(183,134,66,.16),transparent 25%),
    linear-gradient(135deg,#080b14 0%,#10182f 36%,#1b0e08 72%,#0d0703 100%);
}
a{color:inherit;text-decoration:none}
.dashboard{height:100vh;width:min(1480px,calc(100vw - 32px));margin:0 auto;padding:18px 0 12px;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:12px}
.top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:end;border-bottom:1px solid rgba(183,134,66,.4);padding-bottom:12px}
.eyebrow{color:var(--brass);font-size:12px;font-weight:700;margin-bottom:5px}
h1{font-family:var(--display);font-size:clamp(40px,5.7vw,72px);line-height:.9;margin:0;color:var(--strong);text-shadow:0 10px 30px rgba(0,0,0,.52);letter-spacing:0}
.note{margin:9px 0 0;color:var(--muted);font-size:13px;line-height:1.45;max-width:780px}
.server-pill{display:grid;gap:6px;justify-items:end;color:var(--muted);font-size:12px}
.server-pill code{color:var(--strong);background:rgba(20,11,5,.82);border:1px solid var(--brass-dim);border-radius:4px;padding:6px 9px;font-size:14px}
.panels{min-height:0;display:grid;grid-template-columns:1.05fr 1.05fr .9fr;gap:14px}
.panel{min-width:0;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:12px;position:relative;overflow:hidden;border:1px solid var(--brass-dim);border-radius:6px;padding:16px;background:linear-gradient(180deg,rgba(38,22,6,.9),rgba(20,11,5,.95));box-shadow:0 18px 58px rgba(0,0,0,.28)}
.panel::before{content:"";position:absolute;inset:6px;border:1px solid rgba(183,134,66,.18);pointer-events:none}
.panel.player{border-color:rgba(141,53,41,.9)}
.panel.storyteller{border-color:rgba(47,79,143,.95);background:linear-gradient(180deg,rgba(16,24,47,.9),rgba(20,11,5,.95))}
.panel.install{background:linear-gradient(180deg,rgba(13,7,3,.86),rgba(20,11,5,.96))}
.panel-head{position:relative;z-index:1;display:grid;gap:6px}
.panel-kicker{color:var(--brass);font-size:12px;font-weight:700}
.panel h2{margin:0;color:var(--strong);font-size:clamp(24px,2vw,34px);line-height:1.08}
.panel p{margin:0;color:var(--muted);font-size:13px;line-height:1.45}
.qr-set{position:relative;z-index:1;min-height:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:0;border-top:1px solid rgba(183,134,66,.28);padding-top:10px}
.install .qr-set{grid-template-columns:1fr;grid-template-rows:repeat(2,minmax(0,1fr))}
.qr-card{min-width:0;min-height:0;display:grid;grid-template-rows:auto auto auto auto auto;align-content:start;gap:7px;position:relative;overflow:hidden;padding:2px 12px 0;cursor:pointer;transition:opacity .14s ease,filter .14s ease,background-color .14s ease}
.qr-card + .qr-card{border-left:1px solid rgba(183,134,66,.24)}
.install .qr-card + .qr-card{border-left:0;border-top:1px solid rgba(183,134,66,.24);padding-top:12px}
.qr-card:hover{background:rgba(255,232,191,.05)}
.qr-card.is-dim{opacity:.24;filter:saturate(.55)}
.qr-card.is-dim .qr-frame::after{content:"숨김";position:absolute;inset:0;display:grid;place-items:center;background:rgba(13,7,3,.76);color:var(--strong);font-weight:700;font-size:22px}
.qr-title{color:var(--strong);font-weight:700;font-size:clamp(16px,1.22vw,21px);line-height:1.15}
.qr-subtitle{color:var(--muted);font-size:12px;line-height:1.25;min-height:30px}
.qr-frame{position:relative;align-self:start;justify-self:center;margin-top:4px;background:#f8f1df;border:1px solid #fff4d0;border-radius:4px;padding:9px;box-shadow:0 0 0 1px rgba(0,0,0,.34)}
.qr-frame img{display:block;width:min(22vh,190px);height:min(22vh,190px)}
.install .qr-frame img{width:min(17vh,150px);height:min(17vh,150px)}
.qr-url{color:var(--dead);font-size:10px;line-height:1.25;text-align:center;word-break:break-all;min-height:24px;display:grid;place-items:center}
.install .qr-url{display:none}
.link-button,.scan-only{display:grid;place-items:center;min-height:34px;border-radius:5px;border:1px solid var(--brass);font-weight:700;font-size:13px}
.link-button{background:linear-gradient(135deg,var(--ink),var(--blue),var(--brass));color:var(--strong)}
.player .link-button{background:linear-gradient(135deg,#5e1d18,var(--blood),var(--brass))}
.scan-only{color:var(--muted);background:rgba(13,7,3,.48);border-color:rgba(183,134,66,.24)}
.help{position:relative;z-index:1;margin-top:2px;border-top:1px solid rgba(183,134,66,.32);padding-top:10px;color:var(--muted);font-size:12px;line-height:1.45}
.help b{color:var(--brass)}
.foot{display:flex;justify-content:space-between;gap:12px;color:var(--dead);font-size:12px;line-height:1.2}
@media(max-width:1180px){html,body{overflow:auto}.dashboard{height:auto;min-height:100vh}.panels{grid-template-columns:1fr}.install .qr-set{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:none}.qr-frame img,.install .qr-frame img{width:170px;height:170px}}
@media(max-width:720px){.top{grid-template-columns:1fr}.server-pill{justify-items:start}.qr-set,.install .qr-set{grid-template-columns:1fr}.foot{display:grid}.dashboard{width:min(100vw - 24px,560px)}}
</style>
</head>
<body>
<main class="dashboard">
  <header class="top">
    <div>
      <div class="eyebrow">Blood on the Clocktower</div>
      <h1>시계탑 진행 대시보드</h1>
      <p class="note">카메라에 여러 QR이 같이 잡히면 해당 QR을 클릭해 딤 처리하세요. 카드를 클릭하면 QR을 어둡게 숨깁니다.</p>
    </div>
    <div class="server-pill">
      <span>서버 연결 주소</span>
      <code>${serverUrl}</code>
    </div>
  </header>

  <section class="panels" aria-label="접속 패널">
    <article class="panel player">
      <div class="panel-head">
        <div class="panel-kicker">참가자</div>
        <h2>플레이어 입장</h2>
        <p>참가자는 웹 또는 Expo Go 중 하나만 스캔합니다.</p>
      </div>
      <div class="qr-set">
        ${qrCard({
          title: '플레이어 웹 QR',
          subtitle: '설치 없이 브라우저에서 참가',
          qrData: playerUrl,
          alt: '플레이어 웹 QR',
          buttonHref: playerUrl,
          buttonText: '플레이어 웹 열기',
        })}
        ${qrCard({
          title: '플레이어 Expo Go QR',
          subtitle: 'Expo Go 앱으로 참가',
          qrData: playerExpUrl,
          alt: '플레이어 Expo Go QR',
        })}
      </div>
    </article>

    <article class="panel storyteller">
      <div class="panel-head">
        <div class="panel-kicker">진행자</div>
        <h2>이야기꾼 준비</h2>
        <p>먼저 서버를 연결하고, PC 진행 콘솔은 버튼으로 엽니다.</p>
      </div>
      <div class="qr-set">
        ${qrCard({
          title: '서버 연결 QR',
          subtitle: '이야기꾼 앱 첫 화면에서 스캔',
          qrData: serverUrl,
          alt: '서버 연결 QR',
          buttonHref: serverUrl,
          buttonText: '서버 상태 열기',
        })}
        ${qrCard({
          title: '이야기꾼 Expo Go QR',
          subtitle: '태블릿/모바일 기록지',
          qrData: storytellerExpUrl,
          alt: '이야기꾼 Expo Go QR',
        })}
      </div>
      <div class="help">
        <b>PC 진행 콘솔:</b> <a href="${storytellerUrl}" target="_blank" rel="noreferrer">${storytellerUrl}</a>
        <a class="link-button" href="${storytellerUrl}" target="_blank" rel="noreferrer">이야기꾼 웹 열기</a>
      </div>
    </article>

    <article class="panel install">
      <div class="panel-head">
        <div class="panel-kicker">설치</div>
        <h2>Expo Go 설치</h2>
        <p>Expo QR이 열리지 않을 때만 OS에 맞는 설치 QR을 스캔합니다.</p>
      </div>
      <div class="qr-set">
        ${qrCard({
          title: 'Expo Go iOS 설치 QR',
          subtitle: 'iPhone / iPad',
          qrData: IOS_EXPO_GO_URL,
          alt: 'Expo Go iOS 설치 QR',
          buttonHref: IOS_EXPO_GO_URL,
          buttonText: 'iOS 설치 열기',
        })}
        ${qrCard({
          title: 'Expo Go Android 설치 QR',
          subtitle: 'Android 기기',
          qrData: ANDROID_EXPO_GO_URL,
          alt: 'Expo Go Android 설치 QR',
          buttonHref: ANDROID_EXPO_GO_URL,
          buttonText: 'Android 설치 열기',
        })}
      </div>
    </article>
  </section>

  <footer class="foot">
    <span>player ${playerUrl} · storyteller ${storytellerUrl} · server ${serverUrl}</span>
    <span>© DevGon</span>
  </footer>
</main>
<script>
  document.querySelectorAll('.qr-card').forEach((card) => {
    const toggle = () => {
      const dimmed = !card.classList.contains('is-dim');
      card.classList.toggle('is-dim', dimmed);
      card.setAttribute('aria-pressed', dimmed ? 'true' : 'false');
    };
    card.addEventListener('click', (event) => {
      if (event.target.closest('a')) return;
      toggle();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle();
    });
  });
</script>
</body>
</html>`;
}
