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
  --base:#0d0906;--apparatus:#120d09;--panel:#211911;--ink:#10182f;--blue:#2f4f8f;
  --lens:#88aaf5;--brass:#8e7758;--brass-dim:#5f503d;--blood:#8d3529;
  --text:#d8c8b2;--strong:#e6d7c0;--muted:#a99a86;--dead:#746b60;
  --display:SchoolSafeStarrySky,serif;--body:IBMPlexSansKR,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
}
*{box-sizing:border-box}
html,body{height:100%;margin:0;overflow:hidden;background:var(--base);color:var(--text);font-family:var(--body)}
body{
  background:
    radial-gradient(circle at 16% 8%,rgba(47,79,143,.24),transparent 28%),
    radial-gradient(circle at 88% 18%,rgba(142,119,88,.1),transparent 25%),
    linear-gradient(135deg,#080b14 0%,#10182f 36%,#17100b 72%,#0d0906 100%);
}
a{color:inherit;text-decoration:none}
.dashboard{height:100vh;width:min(1480px,calc(100vw - 32px));margin:0 auto;padding:18px 0 12px;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:12px}
.top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:end;border-bottom:1px solid rgba(142,119,88,.32);padding-bottom:12px}
.eyebrow{color:var(--brass);font-size:12px;font-weight:700;margin-bottom:5px}
h1{font-family:var(--display);font-size:clamp(40px,5.7vw,72px);line-height:.9;margin:0;color:var(--strong);text-shadow:0 10px 30px rgba(0,0,0,.52);letter-spacing:0}
.note{margin:9px 0 0;color:var(--muted);font-size:13px;line-height:1.45;max-width:780px}
.server-pill{display:grid;gap:6px;justify-items:end;color:var(--muted);font-size:12px}
.server-pill code{color:var(--strong);background:rgba(18,13,9,.82);border:1px solid var(--brass-dim);border-radius:4px;padding:6px 9px;font-size:14px}
.panels{min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:14px}
.panel{min-width:0;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:12px;position:relative;overflow:hidden;border:1px solid var(--brass-dim);border-radius:6px;padding:16px;background:linear-gradient(180deg,rgba(33,25,17,.92),rgba(18,13,9,.95));box-shadow:0 18px 58px rgba(0,0,0,.28)}
.panel::before{content:"";position:absolute;inset:6px;border:1px solid rgba(142,119,88,.15);pointer-events:none}
.panel.player{border-color:rgba(141,53,41,.9)}
.panel.storyteller{border-color:rgba(47,79,143,.95);background:linear-gradient(180deg,rgba(16,24,47,.9),rgba(18,13,9,.95))}
.panel-head{position:relative;z-index:1;display:grid;gap:6px}
.panel-kicker{color:var(--brass);font-size:12px;font-weight:700}
.panel h2{margin:0;color:var(--strong);font-size:clamp(24px,2vw,34px);line-height:1.08}
.panel p{margin:0;color:var(--muted);font-size:13px;line-height:1.45}
.qr-set{position:relative;z-index:1;min-height:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:0;border-top:1px solid rgba(142,119,88,.24);padding-top:10px}
.player .qr-set{grid-template-columns:minmax(220px,340px) minmax(0,1fr)}
.storyteller .qr-set{grid-template-columns:minmax(220px,340px) minmax(0,1fr)}
.qr-card{min-width:0;min-height:0;display:grid;grid-template-rows:auto auto auto auto auto;align-content:start;gap:7px;position:relative;overflow:hidden;padding:2px 12px 0;cursor:pointer;transition:opacity .14s ease,filter .14s ease,background-color .14s ease}
.qr-card + .qr-card{border-left:1px solid rgba(142,119,88,.22)}
.qr-card:hover{background:rgba(230,215,192,.045)}
.qr-card.is-dim{opacity:.24;filter:saturate(.55)}
.qr-card.is-dim .qr-frame::after{content:"숨김";position:absolute;inset:0;display:grid;place-items:center;background:rgba(13,9,6,.76);color:var(--strong);font-weight:700;font-size:22px}
.qr-title{color:var(--strong);font-weight:700;font-size:clamp(16px,1.22vw,21px);line-height:1.15}
.qr-subtitle{color:var(--muted);font-size:12px;line-height:1.25;min-height:30px}
.qr-frame{position:relative;align-self:start;justify-self:center;margin-top:4px;background:#f8f1df;border:1px solid #fff4d0;border-radius:4px;padding:9px;box-shadow:0 0 0 1px rgba(0,0,0,.34)}
.qr-frame img{display:block;width:min(22vh,190px);height:min(22vh,190px)}
.qr-url{color:var(--dead);font-size:10px;line-height:1.25;text-align:center;word-break:break-all;min-height:24px;display:grid;place-items:center}
.link-button,.scan-only{display:grid;place-items:center;min-height:34px;border-radius:5px;border:1px solid var(--brass);font-weight:700;font-size:13px}
.link-button{background:linear-gradient(135deg,var(--ink),var(--blue),#4d5f86);color:var(--strong)}
.player .link-button{background:linear-gradient(135deg,#5e1d18,var(--blood),#8e5f58)}
.scan-only{color:var(--muted);background:rgba(13,9,6,.48);border-color:rgba(142,119,88,.22)}
.flow{min-width:0;display:grid;align-content:start;gap:10px;padding:4px 12px 0;border-left:1px solid rgba(142,119,88,.22)}
.flow-step{display:grid;grid-template-columns:28px minmax(0,1fr);gap:10px;align-items:start;color:var(--text);font-size:14px;line-height:1.45}
.flow-step span{display:grid;place-items:center;width:28px;height:28px;border:1px solid var(--brass);border-radius:50%;color:var(--strong);font-weight:700;background:rgba(13,9,6,.48)}
.flow-step b{color:var(--strong)}
.help{position:relative;z-index:1;margin-top:2px;border-top:1px solid rgba(142,119,88,.28);padding-top:10px;color:var(--muted);font-size:12px;line-height:1.45}
.help b{color:var(--brass)}
.foot{display:flex;justify-content:space-between;gap:12px;color:var(--dead);font-size:12px;line-height:1.2}
@media(max-width:1180px){html,body{overflow:auto}.dashboard{height:auto;min-height:100vh}.panels{grid-template-columns:1fr}.qr-frame img{width:170px;height:170px}}
@media(max-width:720px){.top{grid-template-columns:1fr}.server-pill{justify-items:start}.qr-set,.player .qr-set{grid-template-columns:1fr}.flow{border-left:0;border-top:1px solid rgba(142,119,88,.22);padding-top:12px}.foot{display:grid}.dashboard{width:min(100vw - 24px,560px)}}
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
        <p>Expo Go는 앱스토어 또는 플레이스토어에서 설치한 뒤, 아래 게임 앱 QR만 스캔합니다.</p>
      </div>
      <div class="qr-set">
        ${qrCard({
          title: '게임 앱 QR',
          subtitle: 'Expo Go 설치 후 이 QR을 스캔',
          qrData: playerExpUrl,
          alt: '게임 앱 QR',
        })}
        <div class="flow" aria-label="플레이어 접속 순서">
          <div class="flow-step"><span>1</span><div><b>Expo Go는 앱스토어 또는 플레이스토어에서 설치</b>합니다.</div></div>
          <div class="flow-step"><span>2</span><div><b>게임 앱 QR을 스캔해 앱을 연 뒤</b> 참가자 화면으로 들어갑니다.</div></div>
          <div class="flow-step"><span>3</span><div>앱 내부 QR 기능으로 진행자의 <b>서버 접속 QR</b>을 스캔합니다.</div></div>
        </div>
      </div>
    </article>

    <article class="panel storyteller">
      <div class="panel-head">
        <div class="panel-kicker">진행자</div>
        <h2>이야기꾼 준비</h2>
        <p>진행자는 PC 웹 콘솔을 열고, 참가자 앱 연결용 서버 접속 QR만 필요할 때 보여줍니다.</p>
      </div>
      <div class="qr-set">
        ${qrCard({
          title: '서버 접속 QR',
          subtitle: '앱 내부 QR 기능으로 스캔',
          qrData: serverUrl,
          alt: '서버 접속 QR',
          buttonHref: serverUrl,
          buttonText: '서버 상태 열기',
        })}
        <div class="flow" aria-label="이야기꾼 접속 순서">
          <div class="flow-step"><span>1</span><div><b>PC 진행 콘솔</b>을 브라우저에서 엽니다.</div></div>
          <div class="flow-step"><span>2</span><div>플레이어가 앱을 연 뒤 요청하면 <b>서버 접속 QR</b>을 보여줍니다.</div></div>
        </div>
      </div>
      <div class="help">
        <b>PC 진행 콘솔:</b> <a href="${storytellerUrl}" target="_blank" rel="noreferrer">${storytellerUrl}</a>
        <a class="link-button" href="${storytellerUrl}" target="_blank" rel="noreferrer">이야기꾼 웹 열기</a>
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
