import { exec } from 'node:child_process';
import os from 'node:os';
// @ts-expect-error no types
import qrcode from 'qrcode-terminal';
import { createApp } from './createApp.js';

const { httpServer } = createApp();

const PORT = 3000;
httpServer.listen(PORT, () => {
  const localIP = getLocalIP();
  const serverUrl = `http://${localIP}:${PORT}`;
  console.log(`\nServer running on:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: ${serverUrl}`);
  console.log(`\n  Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`             ${serverUrl}/dashboard\n`);
  console.log(`Storyteller 앱에서 아래 QR을 스캔하세요:\n`);
  qrcode.generate(serverUrl, { small: true });

  // 대시보드 자동 오픈
  const dashboardUrl = `http://localhost:${PORT}/dashboard`;
  const openCmd =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';
  exec(`${openCmd} ${dashboardUrl}`);
});

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  const match = Object.values(interfaces)
    .flat()
    .find((iface) => iface?.family === 'IPv4' && !iface.internal);
  return match?.address ?? 'localhost';
}
