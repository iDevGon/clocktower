import os from 'node:os';

type NetworkInterfaces = ReturnType<typeof os.networkInterfaces>;

const LAN_INTERFACE_PATTERN = /^(en|eth|wlan|wi-fi|wifi)/i;
const VIRTUAL_INTERFACE_PATTERN =
  /^(utun|tun|tap|bridge|docker|vboxnet|vmnet|awdl|llw)/i;

export function getLocalIP(
  interfaces: NetworkInterfaces = os.networkInterfaces(),
): string {
  const candidates = Object.entries(interfaces).flatMap(([name, addresses]) =>
    (addresses ?? [])
      .filter((iface) => iface.family === 'IPv4' && !iface.internal)
      .map((iface) => ({ name, address: iface.address })),
  );

  candidates.sort((a, b) => scoreInterface(b) - scoreInterface(a));

  return candidates[0]?.address ?? 'localhost';
}

function scoreInterface(candidate: { name: string; address: string }): number {
  let score = 0;

  if (isPrivateLanAddress(candidate.address)) {
    score += 100;
  }

  if (LAN_INTERFACE_PATTERN.test(candidate.name)) {
    score += 20;
  }

  if (VIRTUAL_INTERFACE_PATTERN.test(candidate.name)) {
    score -= 20;
  }

  return score;
}

function isPrivateLanAddress(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;

  return (
    a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
  );
}
