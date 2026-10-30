import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PushReceiverClient = require('@liamcottle/push-receiver/src/client') as new (
  androidId: string,
  securityToken: string,
  persistentIds?: string[],
) => PushReceiver;

interface PushReceiver {
  connect(): Promise<void>;
  destroy(): void;
  on(event: string, listener: (...args: any[]) => void): this;
}

export interface RustPlusPairingNotification {
  title: string;
  message: string;
  ip: string;
  port: number;
  playerId: string;
  playerToken: number;
  name?: string;
}

interface ListenerEntry {
  client: PushReceiver;
  startedAt: number;
  lastNotificationAt?: number;
  lastError?: string;
}

const listeners = new Map<string, ListenerEntry>();

function parseNotification(data: any): RustPlusPairingNotification | null {
  const appData = data?.appData;
  if (!Array.isArray(appData)) return null;

  const getValue = (key: string) => appData.find((item: any) => item?.key === key)?.value;
  if (getValue('channelId') !== 'pairing') return null;

  const bodyValue = getValue('body');
  if (typeof bodyValue !== 'string') return null;

  let body: any;
  try {
    body = JSON.parse(bodyValue);
  } catch {
    return null;
  }

  if (body?.type !== 'server') return null;

  const ip = String(body.ip || '').trim();
  const port = Number(body.port);
  const playerId = String(body.playerId || '').trim();
  const playerToken = Number(body.playerToken);
  if (!ip || !Number.isInteger(port) || port < 1 || port > 65535 ||
      !/^\d{17}$/.test(playerId) || !Number.isInteger(playerToken) ||
      playerToken < 0 || playerToken > 0xffffffff) {
    return null;
  }

  return {
    title: String(getValue('title') || 'Rust+ server paired'),
    message: String(getValue('message') || ''),
    ip,
    port,
    playerId,
    playerToken,
    name: String(body.name || getValue('title') || '').trim() || undefined,
  };
}

export async function startRustPlusPushListener(
  userId: string,
  androidId: string,
  securityToken: string,
  onPairing: (notification: RustPlusPairingNotification) => Promise<void> | void,
): Promise<{ started: boolean; alreadyRunning: boolean }> {
  if (listeners.has(userId)) {
    return { started: false, alreadyRunning: true };
  }

  const client = new PushReceiverClient(androidId, securityToken, []);
  const entry: ListenerEntry = { client, startedAt: Date.now() };
  listeners.set(userId, entry);

  client.on('ON_DATA_RECEIVED', (data: any) => {
    const notification = parseNotification(data);
    if (!notification) return;

    entry.lastNotificationAt = Date.now();
    Promise.resolve(onPairing(notification)).catch((error: unknown) => {
      entry.lastError =
        error instanceof Error
          ? error.message
          : 'Не удалось обработать уведомление Rust+.';
      console.error('[Rust+ FCM] Ошибка обработки уведомления:', entry.lastError);
    });
  });

  client.on('error', (error: unknown) => {
    entry.lastError =
      error instanceof Error ? error.message : 'Ошибка соединения с FCM.';
    console.error('[Rust+ FCM] Ошибка слушателя:', entry.lastError);
  });

  try {
    await client.connect();
    return { started: true, alreadyRunning: false };
  } catch (error) {
    if (listeners.get(userId) === entry) {
      listeners.delete(userId);
    }

    try {
      client.destroy();
    } catch {
      // Соединение уже могло закрыться.
    }

    throw error;
  }
}

export function stopRustPlusPushListener(userId: string): boolean {
  const entry = listeners.get(userId);
  if (!entry) return false;
  listeners.delete(userId);
  try {
    entry.client.destroy();
  } catch {
    // Listener is already disconnected.
  }
  return true;
}

export function getRustPlusPushListenerStatus(userId: string) {
  const entry = listeners.get(userId);
  if (!entry) return { running: false };
  return {
    running: true,
    startedAt: entry.startedAt,
    lastNotificationAt: entry.lastNotificationAt,
    lastError: entry.lastError,
  };
}
