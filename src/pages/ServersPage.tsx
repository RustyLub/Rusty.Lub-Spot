import React, { useEffect, useState } from 'react';
import {
  Server,
  Star,
  Copy,
  Check,
  Plus,
  Play,
  Signal,
  Users,
  Calendar,
  Compass,
  Link,
  Shield,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Power,
  ExternalLink,
  Info,
  CheckCircle2,
  X,
  Radio,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { RustServer, PairedRustServer, RustPairingStatus } from '../types';

export const ServersPage: React.FC = () => {
  const {
    servers,
    selectedServer,
    setSelectedServer,
    addServer,
    toggleFavoriteServer,
    steamUser,
    steamAuthState,
    setShowLoginModal,
    pairedServers,
    pairServer,
    unpairServer,
    reconnectServer,
  } = useCompanion();

  // Active view tab: 'paired' (Rust+ Pairing Rack) or 'browser' (Server Catalog)
  const [activeTab, setActiveTab] = useState<'paired' | 'browser'>('paired');

  // Browser filter
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'official' | 'modded' | 'community' | 'fav'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [liveDataByServer, setLiveDataByServer] = useState<Record<string, any>>({});

  // Poll only servers whose real Rust+ handshake succeeded.
  useEffect(() => {
    let cancelled = false;
    const syncLiveData = async () => {
      const connected = pairedServers.filter(server => server.status === 'connected');
      await Promise.all(connected.map(async server => {
        try {
          const response = await fetch(`/api/rustplus/servers/${encodeURIComponent(server.id)}/data`, {
            credentials: 'include',
          });
          if (!response.ok) return;
          const result = await response.json();
          if (!cancelled && result.liveData) {
            setLiveDataByServer(prev => ({ ...prev, [server.id]: result.liveData }));
          }
        } catch {
          // Keep the last confirmed snapshot during transient network failures.
        }
      }));
    };
    syncLiveData();
    const timer = window.setInterval(syncLiveData, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pairedServers]);

  // Modals
  const [isAddBrowserModalOpen, setIsAddBrowserModalOpen] = useState(false);
  const [isPairingWizardOpen, setIsPairingWizardOpen] = useState(false);

  // New catalog server form
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(28015);
  const [type, setType] = useState<RustServer['type']>('modded');
  const [mapSize, setMapSize] = useState(4000);
  const [wipeSchedule, setWipeSchedule] = useState('Четверг 21:00 МСК');

  // Rust+ Pairing Wizard form state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [pairingMethod, setPairingMethod] = useState<'url' | 'manual'>('url');
  const [rawPairingInput, setRawPairingInput] = useState('');
  const [pairServerName, setPairServerName] = useState('');
  const [pairIp, setPairIp] = useState('');
  const [pairPort, setPairPort] = useState(28082);
  const [pairPlayerId, setPairPlayerId] = useState(steamUser?.steamId || '');
  const [pairToken, setPairToken] = useState<number | ''>('');
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [pairingSubmitting, setPairingSubmitting] = useState(false);

  // Sync SteamID into wizard if user logs in
  React.useEffect(() => {
    if (steamUser?.steamId) {
      setPairPlayerId(steamUser.steamId);
    }
  }, [steamUser]);

  const handleCopyConnect = (server: RustServer) => {
    navigator.clipboard.writeText(`connect ${server.ip}:${server.port}`);
    setCopiedId(server.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateBrowserServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ip.trim()) return;

    addServer({
      name: name.trim(),
      ip: ip.trim(),
      port: Number(port) || 28015,
      type,
      mapSize: Number(mapSize) || 4000,
      currentPlayers: Math.floor(80 + Math.random() * 150),
      maxPlayers: 300,
      queue: 0,
      ping: Math.floor(20 + Math.random() * 30),
      wipeSchedule: wipeSchedule.trim(),
      lastWipe: '24.10.2026',
      nextWipe: '31.10.2026',
      seed: Math.floor(100000 + Math.random() * 900000),
      isFavorite: true,
    });

    setIsAddBrowserModalOpen(false);
    setName('');
    setIp('');
  };

  // Parse Rust+ pairing string (rustplus:pair?ip=... or JSON)
  const handleParsePairingInput = () => {
    setPairingError(null);
    const input = rawPairingInput.trim();
    if (!input) {
      setPairingError('Введите ссылку сопряжения или JSON-объект.');
      return;
    }

    try {
      if (input.startsWith('rustplus:pair?') || input.startsWith('http://') || input.startsWith('https://')) {
        const urlObj = new URL(input.replace('rustplus:pair?', 'https://dummy/?'));
        const parsedIp = urlObj.searchParams.get('ip') || '';
        const parsedPort = Number(urlObj.searchParams.get('port')) || 28082;
        const parsedPlayerId = urlObj.searchParams.get('playerId') || '';
        const parsedToken = Number(urlObj.searchParams.get('playerToken'));
        const parsedName = urlObj.searchParams.get('name') || '';

        if (!parsedIp || isNaN(parsedToken)) {
          throw new Error('В ссылке отсутствуют обязательные параметры ip или playerToken');
        }

        setPairIp(parsedIp);
        setPairPort(parsedPort);
        setPairPlayerId(parsedPlayerId || steamUser?.steamId || '');
        setPairToken(parsedToken);
        if (parsedName) setPairServerName(parsedName);
        setWizardStep(2);
      } else if (input.startsWith('{')) {
        const json = JSON.parse(input);
        const parsedIp = json.ip || json.serverIp || '';
        const parsedPort = Number(json.port || json.appPort) || 28082;
        const parsedPlayerId = json.playerId || json.steamId || '';
        const parsedToken = Number(json.playerToken);
        const parsedName = json.name || json.serverName || '';

        if (!parsedIp || isNaN(parsedToken)) {
          throw new Error('В JSON отсутствуют обязательные поля ip или playerToken');
        }

        setPairIp(parsedIp);
        setPairPort(parsedPort);
        setPairPlayerId(parsedPlayerId || steamUser?.steamId || '');
        setPairToken(parsedToken);
        if (parsedName) setPairServerName(parsedName);
        setWizardStep(2);
      } else {
        throw new Error('Формат не распознан. Используйте rustplus:pair?... или JSON из пуш-уведомления.');
      }
    } catch (err: any) {
      setPairingError(err?.message || 'Не удалось распознать формат сопряжения.');
    }
  };

  const handleFinishPairing = async (e: React.FormEvent) => {
    e.preventDefault();
    setPairingError(null);

    if (!pairIp.trim()) {
      setPairingError('Укажите IP-адрес или хост сервера.');
      return;
    }
    if (pairToken === '' || isNaN(Number(pairToken))) {
      setPairingError('Укажите числовой Player Token.');
      return;
    }
    if (!steamUser?.steamId) {
      setPairingError('Вы должны быть авторизованы через Steam для привязки.');
      return;
    }

    setPairingSubmitting(true);
    const result = await pairServer({
      name: pairServerName.trim() || `Rust Server [${pairIp}:${pairPort}]`,
      ip: pairIp.trim(),
      port: Number(pairPort) || 28082,
      playerId: steamUser.steamId,
      playerToken: Number(pairToken),
      pairingSource: pairingMethod === 'url' ? 'pairing_url' : 'manual_entry',
    });
    setPairingSubmitting(false);

    if (result.success) {
      setIsPairingWizardOpen(false);
      setWizardStep(1);
      setRawPairingInput('');
      setPairServerName('');
      setPairIp('');
      setPairToken('');
    } else {
      setPairingError(result.message);
    }
  };

  const getStatusBadge = (status: RustPairingStatus) => {
    switch (status) {
      case 'connected':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#00C896]/15 text-[#00C896] border border-[#00C896]/40 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C896]" />
            ПОДКЛЮЧЁН
          </span>
        );
      case 'connecting':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40 font-bold">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
            ПОДКЛЮЧЕНИЕ
          </span>
        );
      case 'pending_pair':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5B942]/15 text-[#F5B942] border border-[#F5B942]/40 font-bold">
            ОЖИДАЕТСЯ СОПРЯЖЕНИЕ
          </span>
        );
      case 'reauth_required':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/40 font-bold">
            ТРЕБУЕТСЯ ПОВТОРНАЯ АВТОРИЗАЦИЯ
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#F04444]/15 text-[#F04444] border border-[#F04444]/40 font-bold">
            ОШИБКА ПОДКЛЮЧЕНИЯ
          </span>
        );
      case 'unpaired':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#171A21] text-[#9298A5] border border-[#262A36] font-bold">
            НЕ ПРИВЯЗАН
          </span>
        );
    }
  };

  const filteredBrowserServers = servers.filter(s => {
    if (categoryFilter === 'fav') return s.isFavorite;
    if (categoryFilter === 'official') return s.type === 'official';
    if (categoryFilter === 'modded') return s.type === 'modded';
    if (categoryFilter === 'community') return s.type === 'community';
    return true;
  });

  return (
    <div className="p-3 space-y-3 max-w-[1400px] mx-auto select-none">
      {/* Header with Dual Tab Switcher */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#171A21] border border-[#262A36]">
            <Server className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <div className="font-mono font-bold text-[#E6E8EC] text-sm flex items-center gap-2">
              <span>СЕРВЕРЫ И СОПРЯЖЕНИЕ RUST+</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#171A21] text-[#9298A5] border border-[#262A36]">
                COMPANION PROTOCOL
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#9298A5]">
              Управление реальным сопряжением через Rust+ Companion и каталогом серверов
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-[#0D0F12] border border-[#262A36] rounded font-mono text-xs">
            <button
              onClick={() => setActiveTab('paired')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'paired'
                  ? 'bg-[#171A21] text-[#F97316] font-bold shadow-sm'
                  : 'text-[#9298A5] hover:text-[#E6E8EC]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Привязанные Rust+ ({pairedServers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('browser')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'browser'
                  ? 'bg-[#171A21] text-[#F97316] font-bold shadow-sm'
                  : 'text-[#9298A5] hover:text-[#E6E8EC]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Каталог серверов ({servers.length})</span>
            </button>
          </div>

          {activeTab === 'paired' ? (
            <button
              onClick={() => {
                if (steamAuthState !== 'authenticated') {
                  setShowLoginModal(true);
                } else {
                  setIsPairingWizardOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Привязать сервер Rust+
            </button>
          ) : (
            <button
              onClick={() => setIsAddBrowserModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Добавить в каталог
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: RUST+ PAIRED SERVERS RACK */}
      {activeTab === 'paired' && (
        <div className="space-y-3">
          {/* Steam Auth Requirement Banner if not logged in */}
          {steamAuthState !== 'authenticated' && (
            <div className="p-3.5 rounded bg-[#171A21] border border-[#F97316]/50 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-[#F97316] shrink-0" />
                <div>
                  <div className="font-bold text-[#E6E8EC] font-mono">
                    ДЛЯ СОПРЯЖЕНИЯ RUST+ ТРЕБУЕТСЯ АВТОРИЗАЦИЯ STEAM
                  </div>
                  <div className="text-[#9298A5] text-[11px] font-sans mt-0.5">
                    Каждый сервер Rust+ генерирует Player Token, привязанный к вашему личному SteamID64. Войдите через Steam, чтобы токены хранились на сервере изолированно под вашей учетной записью.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3.5 py-1.5 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-xs font-bold transition-colors shrink-0 shadow-sm"
              >
                Войти через Steam
              </button>
            </div>
          )}

          {/* Paired Server Cards List */}
          {pairedServers.length === 0 ? (
            <div className="bg-[#12141A] border border-[#262A36] rounded p-8 text-center space-y-3 text-xs">
              <div className="w-12 h-12 rounded-full bg-[#171A21] border border-[#262A36] flex items-center justify-center mx-auto text-[#9298A5]">
                <Radio className="w-6 h-6 text-[#F97316]" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <div className="font-mono font-bold text-sm text-[#E6E8EC]">
                  НЕТ ПРИВЯЗАННЫХ СЕРВЕРОВ RUST+
                </div>
                <div className="text-[11px] text-[#9298A5] leading-relaxed">
                  Привяжите свой игровой сервер, чтобы получать телеметрию отряда, карту монументов, управлять турелями и сигнализациями базы.
                </div>
              </div>
              <button
                onClick={() => {
                  if (steamAuthState !== 'authenticated') {
                    setShowLoginModal(true);
                  } else {
                    setIsPairingWizardOpen(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#171A21] hover:bg-[#1E232F] text-[#E6E8EC] border border-[#262A36] hover:border-[#F97316] font-mono text-xs font-bold transition-colors"
              >
                <Plus className="w-4 h-4 text-[#F97316]" /> Начать сопряжение сервера
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pairedServers.map(server => (
                <div
                  key={server.id}
                  className="bg-[#12141A] border border-[#262A36] rounded p-3.5 text-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-[#E6E8EC] text-sm tracking-tight truncate">
                          {server.name}
                        </div>
                        <div className="text-[11px] font-mono text-[#9298A5] mt-0.5">
                          {server.ip}:{server.port}
                        </div>
                      </div>
                      {getStatusBadge(server.status)}
                    </div>

                    {/* Metadata & Status Grid */}
                    <div className="p-2.5 rounded bg-[#171A21] border border-[#262A36] font-mono text-[11px] space-y-1">
                      <div className="flex justify-between text-[#9298A5]">
                        <span>Привязанный SteamID64:</span>
                        <span className="text-[#E6E8EC] font-semibold">{server.playerId}</span>
                      </div>
                      <div className="flex justify-between text-[#9298A5]">
                        <span>Синхронизация:</span>
                        <span className="text-[#E6E8EC]">{server.lastSync || 'Только что'}</span>
                      </div>
                      <div className="flex justify-between text-[#9298A5]">
                        <span>Источник сопряжения:</span>
                        <span className="text-[#E6E8EC]">
                          {server.pairingSource === 'pairing_url' ? 'Rust+ Notification URL' : 'Ручной ввод токена'}
                        </span>
                      </div>
                      {server.lastError && (
                        <div className="pt-1 text-[#F04444] text-[10px] leading-tight">
                          Ошибка: {server.lastError}
                        </div>
                      )}
                    </div>
                  </div>

                  {server.status === 'connected' && liveDataByServer[server.id] && (() => {
                    const live = liveDataByServer[server.id];
                    const info = live.serverInfo?.info || live.serverInfo?.response?.info || {};
                    const gameTime = live.gameTime?.time || live.gameTime?.response?.time || {};
                    const team = live.teamInfo?.teamInfo || live.teamInfo?.response?.teamInfo || {};
                    const members = Array.isArray(team.members) ? team.members : [];
                    const playerCount = info.players ?? info.playerCount;
                    const maxPlayers = info.maxPlayers;
                    const gameClock = gameTime.time || gameTime.gameTime || gameTime.hour;
                    return (
                      <div className="p-2.5 rounded bg-[#0D0F12] border border-[#00C896]/30 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#00C896] font-mono font-bold text-[10px]">LIVE RUST+ DATA</span>
                          <span className="text-[#9298A5] text-[10px]">Обновление каждые 10 сек.</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-[#9298A5] text-[10px]">Игроки на сервере</div>
                            <div className="text-[#E6E8EC] font-mono font-bold">{playerCount !== undefined ? `${playerCount}${maxPlayers !== undefined ? ` / ${maxPlayers}` : ''}` : 'Нет данных'}</div>
                          </div>
                          <div>
                            <div className="text-[#9298A5] text-[10px]">Отряд Rust+</div>
                            <div className="text-[#E6E8EC] font-mono font-bold">{team.members ? members.length : 'Нет данных'}</div>
                          </div>
                          <div>
                            <div className="text-[#9298A5] text-[10px]">Карта</div>
                            <div className="text-[#E6E8EC] font-mono font-bold">{info.map || info.mapName || 'Нет данных'}</div>
                          </div>
                          <div>
                            <div className="text-[#9298A5] text-[10px]">Игровое время</div>
                            <div className="text-[#E6E8EC] font-mono font-bold">{gameClock !== undefined ? String(gameClock) : 'Нет данных'}</div>
                          </div>
                        </div>
                        {live.lastSync && <div className="text-[10px] text-[#9298A5]">Последний ответ сервера: {new Date(live.lastSync).toLocaleTimeString('ru-RU')}</div>}
                        {live.lastError && <div className="text-[10px] text-[#F04444]">{live.lastError}</div>}
                      </div>
                    );
                  })()}

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-[#262A36] flex items-center justify-between gap-2 font-mono text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => reconnectServer(server.id)}
                        className="px-2.5 py-1 rounded bg-[#171A21] hover:bg-[#262A36] text-[#E6E8EC] border border-[#262A36] hover:border-[#F97316] text-[11px] flex items-center gap-1 transition-colors"
                        title="Проверить соединение и обновить статус"
                      >
                        <RefreshCw className="w-3 h-3 text-[#F97316]" />
                        <span>Связаться</span>
                      </button>
                    </div>

                    <button
                      onClick={() => unpairServer(server.id)}
                      className="px-2 py-1 rounded bg-[#171A21] hover:bg-[#261515] text-[#9298A5] hover:text-[#F04444] border border-[#262A36] hover:border-[#F04444]/40 text-[11px] flex items-center gap-1 transition-colors"
                      title="Удалить привязку сервера"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Отвязать</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Technical Info Footnote */}
          <div className="p-3 bg-[#12141A] border border-[#262A36] rounded font-mono text-[10px] text-[#9298A5] space-y-1">
            <div className="text-[#E6E8EC] font-bold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Архитектура безопасности протокола Rust+:</span>
            </div>
            <div>• Player Token и сопряжение хранятся на сервере в изоляции по вашему SteamID64 и не передаются в браузер открытым текстом.</div>
            <div>• Повторные попытки подключения используют экспоненциальную задержку (cooldown) во избежание блокировки файрволом игрового сервера.</div>
          </div>
        </div>
      )}

      {/* VIEW 2: SERVER BROWSER & CATALOG */}
      {activeTab === 'browser' && (
        <div className="space-y-3">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {[
              { id: 'all', label: 'Все серверы' },
              { id: 'fav', label: '★ Избранные' },
              { id: 'modded', label: 'Модифицированные (2x/5x)' },
              { id: 'official', label: 'Официальные (Vanilla)' },
              { id: 'community', label: 'Сообщество' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded border transition-colors ${
                  categoryFilter === tab.id
                    ? 'bg-[#171A21] border-[#F97316] text-[#F97316] font-semibold'
                    : 'bg-[#12141A] border-[#262A36] text-[#9298A5] hover:text-[#E6E8EC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Servers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBrowserServers.map(server => {
              const isSelected = selectedServer.id === server.id;

              return (
                <div
                  key={server.id}
                  className={`bg-[#12141A] border rounded p-3 text-xs flex flex-col justify-between space-y-3 transition-colors ${
                    isSelected
                      ? 'border-[#F97316] shadow-sm'
                      : 'border-[#262A36] hover:border-[#383E4E]'
                  }`}
                >
                  <div>
                    {/* Title & Favorite */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="truncate">
                        <div className="font-bold text-[#E6E8EC] text-sm truncate flex items-center gap-1.5">
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00C896] shrink-0" title="Текущий рабочий сервер" />
                          )}
                          <span className="truncate">{server.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#9298A5] mt-0.5">
                          {server.ip}:{server.port}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFavoriteServer(server.id)}
                        className={`p-1 rounded text-sm transition-colors ${
                          server.isFavorite ? 'text-[#F5B942]' : 'text-[#9298A5] hover:text-white'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-3 gap-1.5 my-2 p-2 rounded bg-[#171A21] border border-[#262A36] text-center font-mono">
                      <div>
                        <div className="text-[9px] text-[#9298A5]">ОНЛАЙН</div>
                        <div className="font-bold text-[#00C896] tabular-nums text-xs">
                          {server.currentPlayers}/{server.maxPlayers}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#9298A5]">ОЧЕРЕДЬ</div>
                        <div className="font-bold text-[#E6E8EC] tabular-nums text-xs">
                          {server.queue > 0 ? server.queue : '0'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#9298A5]">ПИНГ</div>
                        <div className="font-bold text-[#F5B942] tabular-nums text-xs">
                          {server.ping} ms
                        </div>
                      </div>
                    </div>

                    {/* Wipe info */}
                    <div className="space-y-1 text-[10px] font-mono text-[#9298A5]">
                      <div className="flex justify-between">
                        <span>Расписание вайпов:</span>
                        <span className="text-[#E6E8EC]">{server.wipeSchedule}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Размер карты:</span>
                        <span className="text-[#E6E8EC]">{server.mapSize} м</span>
                      </div>
                    </div>
                  </div>

                  {/* Connect and Select controls */}
                  <div className="pt-2 border-t border-[#262A36] flex items-center justify-between gap-2 font-mono text-xs">
                    <button
                      onClick={() => setSelectedServer(server)}
                      className={`px-3 py-1.5 rounded transition-colors flex-1 ${
                        isSelected
                          ? 'bg-[#171A21] text-[#F97316] font-bold border border-[#F97316]'
                          : 'bg-[#171A21] hover:bg-[#262A36] text-[#E6E8EC] border border-[#262A36]'
                      }`}
                    >
                      {isSelected ? '✓ Активный' : 'Выбрать'}
                    </button>

                    <button
                      onClick={() => handleCopyConnect(server)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#171A21] hover:bg-[#262A36] text-[#E6E8EC] border border-[#262A36] transition-colors"
                      title="Копировать F1 connect команду"
                    >
                      {copiedId === server.id ? (
                        <Check className="w-3.5 h-3.5 text-[#00C896]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[#9298A5]" />
                      )}
                      <span>{copiedId === server.id ? 'Скопировано' : 'F1 connect'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RUST+ PAIRING WIZARD MODAL */}
      {isPairingWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
          <div className="relative w-full max-w-lg bg-[#12141A] border border-[#262A36] rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#262A36] bg-[#0D0F12] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#F97316]" />
                <div>
                  <div className="font-bold text-[#E6E8EC] text-sm font-mono">
                    МАСТЕР СОПРЯЖЕНИЯ RUST+ COMPANION
                  </div>
                  <div className="text-[10px] text-[#9298A5] font-mono">
                    ШАГ {wizardStep} ИЗ 2 // ПОДКЛЮЧЕНИЕ СЕРВЕРА
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsPairingWizardOpen(false)}
                className="p-1.5 text-[#9298A5] hover:text-[#E6E8EC] hover:bg-[#171A21] rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 text-xs space-y-4">
              {pairingError && (
                <div className="p-3 rounded bg-[#261515] border border-[#F04444]/60 text-xs text-[#E6E8EC] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#F04444] shrink-0 mt-0.5" />
                  <div className="text-[#F04444] font-mono text-[11px] leading-relaxed">
                    {pairingError}
                  </div>
                </div>
              )}

              {/* Step 1: Input method choice & paste */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  {/* Instructions */}
                  <div className="p-3 rounded bg-[#171A21] border border-[#262A36] text-[11px] text-[#9298A5] space-y-1.5 leading-relaxed">
                    <div className="text-[#E6E8EC] font-bold font-mono">Инструкция по сопряжению в игре Rust:</div>
                    <div>1. Зайдите на игровой сервер в клиенте Rust.</div>
                    <div>2. Нажмите клавишу <strong>Esc</strong> и перейдите в меню <strong>Rust+</strong>.</div>
                    <div>3. Нажмите кнопку <strong>«Привязать сервер»</strong> (Pair with Server).</div>
                    <div>4. Скопируйте ссылку сопряжения или введите параметры ниже.</div>
                  </div>

                  {/* Method tabs */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setPairingMethod('url')}
                      className={`flex-1 py-2 px-3 rounded border text-center transition-colors ${
                        pairingMethod === 'url'
                          ? 'bg-[#171A21] border-[#F97316] text-[#F97316] font-bold'
                          : 'bg-[#0D0F12] border-[#262A36] text-[#9298A5]'
                      }`}
                    >
                      Импорт ссылки / JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPairingMethod('manual');
                        setWizardStep(2);
                      }}
                      className={`flex-1 py-2 px-3 rounded border text-center transition-colors ${
                        pairingMethod === 'manual'
                          ? 'bg-[#171A21] border-[#F97316] text-[#F97316] font-bold'
                          : 'bg-[#0D0F12] border-[#262A36] text-[#9298A5]'
                      }`}
                    >
                      Ручной ввод параметров
                    </button>
                  </div>

                  {pairingMethod === 'url' && (
                    <div className="space-y-2">
                      <label className="block text-[#9298A5] font-mono text-[11px]">
                        Вставьте ссылку сопряжения (rustplus:pair?...) или JSON-уведомление:
                      </label>
                      <textarea
                        rows={3}
                        value={rawPairingInput}
                        onChange={e => setRawPairingInput(e.target.value)}
                        placeholder="rustplus:pair?ip=123.45.67.89&port=28082&playerId=76561198...&playerToken=-12345678"
                        className="w-full bg-[#171A21] border border-[#262A36] rounded p-2.5 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleParsePairingInput}
                        className="w-full py-2.5 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-xs font-bold transition-colors shadow-sm"
                      >
                        Распознать и перейти к подтверждению →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Confirmation & Manual Fields */}
              {wizardStep === 2 && (
                <form onSubmit={handleFinishPairing} className="space-y-3">
                  <div>
                    <label className="block text-[#9298A5] font-mono text-[11px] mb-1">
                      Название сервера (для отображения в хабе):
                    </label>
                    <input
                      type="text"
                      value={pairServerName}
                      onChange={e => setPairServerName(e.target.value)}
                      placeholder="Например: Rustafied EU Main"
                      className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] text-xs focus:outline-none focus:border-[#F97316] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[#9298A5] font-mono text-[11px] mb-1">
                        IP или хост сервера:
                      </label>
                      <input
                        type="text"
                        value={pairIp}
                        onChange={e => setPairIp(e.target.value)}
                        placeholder="123.45.67.89"
                        required
                        className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[#9298A5] font-mono text-[11px] mb-1">
                        Порт Rust+:
                      </label>
                      <input
                        type="number"
                        value={pairPort}
                        onChange={e => setPairPort(Number(e.target.value))}
                        required
                        className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[#9298A5] font-mono text-[11px] mb-1">
                        Ваш подтвержденный SteamID64:
                      </label>
                      <input
                        type="text"
                        value={steamUser?.steamId || pairPlayerId}
                        disabled
                        className="w-full bg-[#0D0F12] border border-[#262A36] rounded p-2 text-[#00C896] font-mono text-xs cursor-not-allowed font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[#9298A5] font-mono text-[11px] mb-1">
                        Player Token (секретный токен):
                      </label>
                      <input
                        type="number"
                        value={pairToken}
                        onChange={e => setPairToken(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="-1987654321"
                        required
                        className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#262A36] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-3 py-1.5 rounded bg-[#171A21] hover:bg-[#262A36] text-[#9298A5] font-mono text-xs transition-colors"
                    >
                      ← Назад
                    </button>
                    <button
                      type="submit"
                      disabled={pairingSubmitting}
                      className="px-4 py-2 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-xs font-bold transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
                    >
                      {pairingSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>{pairingSubmitting ? 'Сохранение...' : 'Завершить сопряжение'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD BROWSER SERVER MODAL */}
      {isAddBrowserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
          <div className="relative w-full max-w-md bg-[#12141A] border border-[#262A36] rounded-md shadow-2xl p-4 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#262A36]">
              <div className="font-mono font-bold text-[#E6E8EC]">ДОБАВИТЬ СЕРВЕР В КАТАЛОГ</div>
              <button
                onClick={() => setIsAddBrowserModalOpen(false)}
                className="text-[#9298A5] hover:text-[#E6E8EC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBrowserServer} className="space-y-3">
              <div>
                <label className="block text-[#9298A5] font-mono text-[11px] mb-1">Название сервера:</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Rustafied EU Medium"
                  required
                  className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[#9298A5] font-mono text-[11px] mb-1">IP сервера:</label>
                  <input
                    type="text"
                    value={ip}
                    onChange={e => setIp(e.target.value)}
                    placeholder="185.120.55.10"
                    required
                    className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div>
                  <label className="block text-[#9298A5] font-mono text-[11px] mb-1">Game Port:</label>
                  <input
                    type="number"
                    value={port}
                    onChange={e => setPort(Number(e.target.value))}
                    required
                    className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#9298A5] font-mono text-[11px] mb-1">Тип сервера:</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316]"
                  >
                    <option value="official">Официальный (Vanilla)</option>
                    <option value="modded">Модифицированный (2x/5x)</option>
                    <option value="community">Сообщество</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#9298A5] font-mono text-[11px] mb-1">Размер карты (м):</label>
                  <input
                    type="number"
                    value={mapSize}
                    onChange={e => setMapSize(Number(e.target.value))}
                    className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#262A36]">
                <button
                  type="button"
                  onClick={() => setIsAddBrowserModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#171A21] text-[#9298A5] font-mono text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-xs font-bold"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
