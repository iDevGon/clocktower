interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound?: 'default';
  priority?: 'high' | 'normal';
}

const pushTokens = new Map<string, string>();

export function registerPushToken(playerId: string, token: string): void {
  pushTokens.set(playerId, token);
  console.log(`Push token registered: ${playerId}`);
}

export function removePushToken(playerId: string): void {
  pushTokens.delete(playerId);
}

export function clearPushTokens(): void {
  pushTokens.clear();
}

export async function sendPushNotification(
  playerId: string,
  title: string,
  body: string,
): Promise<void> {
  const token = pushTokens.get(playerId);
  if (!token) return;

  const message: ExpoPushMessage = {
    to: token,
    title,
    body,
    sound: 'default',
    priority: 'high',
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.error(`Push notification failed for ${playerId}:`, err);
  }
}

export async function sendPushToAll(
  playerIds: string[],
  title: string,
  body: string,
): Promise<void> {
  const messages = playerIds
    .map((id) => {
      const token = pushTokens.get(id);
      if (!token) return null;
      return {
        to: token,
        title,
        body,
        sound: 'default' as const,
        priority: 'high' as const,
      };
    })
    .filter((msg): msg is NonNullable<typeof msg> => msg !== null);
  if (messages.length === 0) return;

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('Push notification batch failed:', err);
  }
}
