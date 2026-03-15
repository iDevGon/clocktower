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
  console.log(`\nStoryteller 앱에서 아래 QR을 스캔하세요:\n`);
  qrcode.generate(serverUrl, { small: true });
});

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
