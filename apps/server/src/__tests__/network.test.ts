import { describe, expect, it } from 'vitest';
import { getLocalIP } from '../network.js';

describe('getLocalIP', () => {
  it('prefers a LAN address over a virtual tunnel address', () => {
    expect(
      getLocalIP({
        utun0: [
          {
            address: '100.78.13.80',
            netmask: '255.255.255.255',
            family: 'IPv4',
            mac: '00:00:00:00:00:00',
            internal: false,
            cidr: '100.78.13.80/32',
          },
        ],
        en0: [
          {
            address: '192.168.0.25',
            netmask: '255.255.255.0',
            family: 'IPv4',
            mac: 'ba:13:fa:12:db:35',
            internal: false,
            cidr: '192.168.0.25/24',
          },
        ],
      }),
    ).toBe('192.168.0.25');
  });

  it('falls back to localhost when no external IPv4 address exists', () => {
    expect(
      getLocalIP({
        lo0: [
          {
            address: '127.0.0.1',
            netmask: '255.0.0.0',
            family: 'IPv4',
            mac: '00:00:00:00:00:00',
            internal: true,
            cidr: '127.0.0.1/8',
          },
        ],
      }),
    ).toBe('localhost');
  });
});
