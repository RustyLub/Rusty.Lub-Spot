import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const RustPlus = require('@liamcottle/rustplus.js') as new (
  ip: string,
  port: number,
  playerId: string,
  playerToken: number,
  useFacepunchProxy?: boolean,
) => RustPlusClient;

type RustPlusResponse = Record<string, any>;

interface RustPlusClient {
  connect(): void;
  disconnect(): void;
  isConnected(): boolean;
  sendRequestAsync(data: Record<string, unknown>, timeoutMilliseconds?: number): Promise<RustPlusResponse>;
  on(event: string, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string): this;
}

export interface RustPlusLiveData {
  connected: boolean;
  connectedAt?: number;
  lastSync?: number;
  serverInfo?: RustPlusResponse;
  gameTime?: RustPlusResponse;
  teamInfo?: RustPlusResponse;
  mapMarkers?: RustPlusResponse;
  map?: RustPlusResponse;
  lastError?: string;
}

interface ConnectionEntry {
  client: RustPlusClient;
  data: RustPlusLiveData;
  refreshTimer?: ReturnType<typeof setInterval>;
  connecting?: Promise<RustPlusLiveData>;
}

const connections = new Map<string, ConnectionEntry>();

function cleanError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Неизвестная ошибка Rust+ Companion.';
}

async function request(client: RustPlusClient, payload: Record<string, unknown>) {
  return client.sendRequestAsync(payload, 12000);
}

async function refreshData(entry: ConnectionEntry, includeMap = false) {
  const client = entry.client;
  if (!client.isConnected()) {
    entry.data.connected = false;
    throw new Error('WebSocket Rust+ отключён.');
  }

  const [serverInfo, gameTime, teamInfo, mapMarkers] = await Promise.all([
    request(client, { getInfo: {} }),
    request(client, { getTime: {} }),
    request(client, { getTeamInfo: {} }),
    request(client, { getMapMarkers: {} }),
  ]);

  entry.data.serverInfo = serverInfo;
  entry.data.gameTime = gameTime;
  entry.data.teamInfo = teamInfo;
  entry.data.mapMarkers = mapMarkers;

  if (includeMap) {
    entry.data.map = await request(client, { getMap: {} });
  }

  entry.data.connected = true;
  entry.data.lastSync = Date.now();
  entry.data.lastError = undefined;
  return entry.data;
}

export async function connectRustPlus(
  serverId: string,
  server: { ip: string; port: number; playerId: string; playerToken: number },
): Promise<RustPlusLiveData> {
  const existing = connections.get(serverId);
  if (existing?.connecting) return existing.connecting;
  if (existing?.client.isConnected()) {
    return refreshData(existing);
  }
  if (existing) disconnectRustPlus(serverId);

  const client = new RustPlus(server.ip, server.port, server.playerId, server.playerToken);
  const entry: ConnectionEntry = {
    client,
    data: { connected: false },
  };
  connections.set(serverId, entry);

  entry.connecting = new Promise<RustPlusLiveData>((resolve, reject) => {
    let settled = false;

    const finishError = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      entry.data.connected = false;
      entry.data.lastError = cleanError(error);
      reject(new Error(entry.data.lastError));
    };

    const timeout = setTimeout(() => {
      finishError(new Error('Истекло время ожидания ответа сервера Rust+. Проверь IP, app.port и доступность сервера.'));
      try { client.disconnect(); } catch { /* no-op */ }
    }, 15000);

    client.on('error', finishError);
    client.on('disconnected', () => {
      entry.data.connected = false;
      if (entry.data.lastSync) {
        entry.data.lastError = 'Соединение с сервером Rust+ было закрыто.';
      }
      if (entry.refreshTimer) clearInterval(entry.refreshTimer);
      entry.refreshTimer = undefined;
    });

    client.on('connected', async () => {
      try {
        // getInfo verifies the real Companion protocol session and the supplied player token.
        const initialInfo = await request(client, { getInfo: {} });
        entry.data.serverInfo = initialInfo;
        entry.data.connected = true;
        entry.data.connectedAt = Date.now();
        entry.data.lastError = undefined;
        const data = await refreshData(entry);
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        entry.refreshTimer = setInterval(() => {
          refreshData(entry).catch((error) => {
            entry.data.lastError = cleanError(error);
            if (!client.isConnected()) entry.data.connected = false;
          });
        }, 30000);
        resolve(data);
      } catch (error) {
        finishError(error);
        try { client.disconnect(); } catch { /* no-op */ }
      }
    });

    try {
      client.connect();
    } catch (error) {
      finishError(error);
    }
  }).finally(() => {
    entry.connecting = undefined;
  });

  try {
    return await entry.connecting;
  } catch (error) {
    entry.data.connected = false;
    entry.data.lastError = cleanError(error);
    throw error;
  }
}

export function getRustPlusLiveData(serverId: string): RustPlusLiveData | null {
  const entry = connections.get(serverId);
  if (!entry) return null;
  entry.data.connected = entry.client.isConnected() && entry.data.connected;
  return entry.data;
}

export function disconnectRustPlus(serverId: string): void {
  const entry = connections.get(serverId);
  if (!entry) return;
  if (entry.refreshTimer) clearInterval(entry.refreshTimer);
  entry.refreshTimer = undefined;
  try { entry.client.disconnect(); } catch { /* no-op */ }
  entry.client.removeAllListeners();
  entry.data.connected = false;
  connections.delete(serverId);
}

export async function refreshRustPlusData(serverId: string, includeMap = false): Promise<RustPlusLiveData> {
  const entry = connections.get(serverId);
  if (!entry) throw new Error('Нет активного подключения Rust+ к этому серверу.');
  return refreshData(entry, includeMap);
}
