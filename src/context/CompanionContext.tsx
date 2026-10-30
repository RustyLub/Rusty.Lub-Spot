import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  NavPageId,
  RustServer,
  TeamMember,
  PlayerContact,
  SmartDevice,
  AppNotification,
  MapMarker,
  CameraCode,
  SteamUser,
  SteamAuthState,
  PairedRustServer,
} from '../types';
import {
  INITIAL_SERVERS,
  INITIAL_TEAM,
  INITIAL_SMART_DEVICES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PLAYERS,
  INITIAL_MARKERS,
  CAMERA_CODES,
} from '../data/rustData';

export interface CompanionSettings {
  theme: 'charcoal' | 'rust' | 'black';
  density: 'compact' | 'normal';
  soundAlerts: boolean;
  autoRefreshMap: boolean;
  streamerMode: boolean;
  rustPlusPort: number;
  playerToken: string;
}

interface CompanionContextType {
  // Steam Authentication
  steamUser: SteamUser | null;
  steamAuthState: SteamAuthState;
  steamAuthError: string | null;
  showLoginModal: boolean;
  setShowLoginModal: (v: boolean) => void;
  isGuestMode: boolean;
  setIsGuestMode: (v: boolean) => void;
  loginWithSteam: () => Promise<void>;
  logoutSteam: () => Promise<void>;
  checkSteamSession: () => Promise<boolean>;
  csrfToken: string;

  // Rust+ Paired Servers
  pairedServers: PairedRustServer[];
  fetchPairedServers: () => Promise<void>;
  pairServer: (params: { name?: string; ip: string; port: number; playerId: string; playerToken: number; pairingSource?: any }) => Promise<{ success: boolean; message: string }>;
  unpairServer: (serverId: string) => Promise<boolean>;
  reconnectServer: (serverId: string) => Promise<boolean>;

  activeTab: NavPageId;
  setActiveTab: (tab: NavPageId) => void;
  selectedServer: RustServer;
  setSelectedServer: (server: RustServer) => void;
  servers: RustServer[];
  addServer: (server: Omit<RustServer, 'id'>) => void;
  toggleFavoriteServer: (serverId: string) => void;
  isSimulatedMode: boolean;
  setIsSimulatedMode: (v: boolean) => void;
  isRustPlusConnected: boolean;
  toggleRustPlusConnection: () => void;
  inGameTime: string;
  isNight: boolean;
  teamMembers: TeamMember[];
  kickTeamMember: (id: string) => void;
  promoteLeader: (id: string) => void;
  inviteTeamMember: (name: string, steamId: string) => void;
  sendTeamPing: (text: string) => void;
  smartDevices: SmartDevice[];
  toggleSmartDevice: (id: string) => void;
  setGroupState: (group: string, state: boolean) => void;
  applyPreset: (presetName: 'raid_alarm' | 'night_saver' | 'base_lockdown' | 'farming') => void;
  addSmartDevice: (dev: Omit<SmartDevice, 'id'>) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  unreadCount: number;
  markers: MapMarker[];
  addMarker: (marker: Omit<MapMarker, 'id' | 'createdAt'>) => void;
  removeMarker: (id: string) => void;
  players: PlayerContact[];
  updatePlayerNote: (id: string, notes: string) => void;
  addPlayerSighting: (playerId: string, grid: string, note: string) => void;
  addPlayerTag: (playerId: string, tag: string) => void;
  removePlayerTag: (playerId: string, tag: string) => void;
  addNewPlayer: (p: Omit<PlayerContact, 'id' | 'sightings'>) => void;
  activeCCTV: CameraCode | null;
  openCCTV: (camera: CameraCode) => void;
  closeCCTV: () => void;
  allCameras: CameraCode[];
  addCustomCamera: (camera: Omit<CameraCode, 'id'>) => void;
  settings: CompanionSettings;
  updateSettings: (newSettings: Partial<CompanionSettings>) => void;
  resetAllData: () => void;
}

const CompanionContext = createContext<CompanionContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'rusty_lub_';

export const CompanionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Steam OpenID 2.0 Auth State ---
  const [steamUser, setSteamUser] = useState<SteamUser | null>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}steam_user`);
    return saved ? JSON.parse(saved) : null;
  });
  const [steamAuthState, setSteamAuthState] = useState<SteamAuthState>('unauthenticated');
  const [steamAuthError, setSteamAuthError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem(`${LOCAL_STORAGE_PREFIX}guest_mode`) === 'true';
  });

  const [activeTab, setActiveTab] = useState<NavPageId>(() => {
    return (localStorage.getItem(`${LOCAL_STORAGE_PREFIX}tab`) as NavPageId) || 'home';
  });

  const [servers, setServers] = useState<RustServer[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}servers`);
    return saved ? JSON.parse(saved) : INITIAL_SERVERS;
  });

  const [selectedServer, setSelectedServer] = useState<RustServer>(() => {
    return servers[0] || INITIAL_SERVERS[0];
  });

  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(true);
  const [isRustPlusConnected, setIsRustPlusConnected] = useState<boolean>(true);

  // In-game day/night simulation timer
  const [inGameMinutes, setInGameMinutes] = useState<number>(875); // 14:35

  useEffect(() => {
    const timer = setInterval(() => {
      setInGameMinutes(prev => (prev + 1) % 1440);
    }, 4000); // 4 sec = 1 in-game minute
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(inGameMinutes / 60);
  const minutes = inGameMinutes % 60;
  const isNight = hours < 6 || hours >= 21;
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMins = minutes.toString().padStart(2, '0');
  const inGameTime = `${formattedHours}:${formattedMins} ${isNight ? 'НОЧЬ' : 'ДЕНЬ'}`;

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}team`);
    return saved ? JSON.parse(saved) : INITIAL_TEAM;
  });

  const [smartDevices, setSmartDevices] = useState<SmartDevice[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}devices`);
    return saved ? JSON.parse(saved) : INITIAL_SMART_DEVICES;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}notifications`);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [markers, setMarkers] = useState<MapMarker[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}markers`);
    return saved ? JSON.parse(saved) : INITIAL_MARKERS;
  });

  const [players, setPlayers] = useState<PlayerContact[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}players`);
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });

  const [allCameras, setAllCameras] = useState<CameraCode[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}cameras`);
    return saved ? JSON.parse(saved) : CAMERA_CODES;
  });

  const [activeCCTV, setActiveCCTV] = useState<CameraCode | null>(null);

  const [settings, setSettings] = useState<CompanionSettings>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}settings`);
    return saved
      ? JSON.parse(saved)
      : {
          theme: 'charcoal',
          density: 'compact',
          soundAlerts: true,
          autoRefreshMap: true,
          streamerMode: false,
          rustPlusPort: 28082,
          playerToken: 'f83a09e-77b2-4d51-92b1-998ca4e819b0',
        };
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}tab`, activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}servers`, JSON.stringify(servers));
  }, [servers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}team`, JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}devices`, JSON.stringify(smartDevices));
  }, [smartDevices]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}notifications`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}markers`, JSON.stringify(markers));
  }, [markers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}players`, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}cameras`, JSON.stringify(allCameras));
  }, [allCameras]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  const toggleRustPlusConnection = () => {
    setIsRustPlusConnected(prev => !prev);
  };

  const addServer = (newServer: Omit<RustServer, 'id'>) => {
    const serverWithId: RustServer = {
      ...newServer,
      id: `server-${Date.now()}`,
    };
    setServers(prev => [serverWithId, ...prev]);
  };

  const toggleFavoriteServer = (serverId: string) => {
    setServers(prev =>
      prev.map(s => (s.id === serverId ? { ...s, isFavorite: !s.isFavorite } : s))
    );
  };

  const kickTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const promoteLeader = (id: string) => {
    setTeamMembers(prev =>
      prev.map(m => ({
        ...m,
        isLeader: m.id === id,
      }))
    );
  };

  const inviteTeamMember = (name: string, steamId: string) => {
    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name,
      steamId,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      role: 'Новобранец / Рейдер',
      isLeader: false,
      isOnline: true,
      hp: 100,
      maxHp: 100,
      coords: { grid: 'G11', x: 45, y: 68 },
      distance: '20м',
      heldItem: 'Каменный топор',
      lastActive: 'Только что',
      voiceActive: false,
    };
    setTeamMembers(prev => [...prev, newMember]);
  };

  const sendTeamPing = (text: string) => {
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Сигнал команды',
      message: `${teamMembers[0]?.name || 'RustyOperator'}: "${text}"`,
      severity: 'info',
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      category: 'team',
      isRead: false,
      grid: teamMembers[0]?.coords.grid || 'G11',
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const toggleSmartDevice = (id: string) => {
    setSmartDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, state: !d.state } : d))
    );
  };

  const setGroupState = (group: string, state: boolean) => {
    setSmartDevices(prev =>
      prev.map(d => (d.group === group ? { ...d, state } : d))
    );
  };

  const applyPreset = (presetName: 'raid_alarm' | 'night_saver' | 'base_lockdown' | 'farming') => {
    setSmartDevices(prev => {
      switch (presetName) {
        case 'raid_alarm':
          return prev.map(d => {
            if (d.type === 'turret' || d.type === 'alarm') return { ...d, state: true };
            if (d.name.includes('ПВО')) return { ...d, state: true };
            return d;
          });
        case 'night_saver':
          return prev.map(d => {
            if (d.name.includes('Авто-свет')) return { ...d, state: true };
            if (d.name.includes('Ферма')) return { ...d, state: false };
            return d;
          });
        case 'base_lockdown':
          return prev.map(d => ({ ...d, state: true }));
        case 'farming':
          return prev.map(d => {
            if (d.group === 'Ферма') return { ...d, state: true };
            return d;
          });
        default:
          return prev;
      }
    });

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Применен пресет электрики',
      message: `Активирован пресет: ${presetName.toUpperCase()}`,
      severity: 'info',
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      category: 'device',
      isRead: false,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const addSmartDevice = (dev: Omit<SmartDevice, 'id'>) => {
    const newDev: SmartDevice = {
      ...dev,
      id: `dev-${Date.now()}`,
    };
    setSmartDevices(prev => [...prev, newDev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // --- Steam OpenID Session & Handlers ---
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [pairedServers, setPairedServers] = useState<PairedRustServer[]>([]);

  // Fetch user's paired servers from server
  const fetchPairedServers = useCallback(async () => {
    try {
      const res = await fetch('/api/rustplus/servers', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.servers) {
          setPairedServers(data.servers);
        }
      }
    } catch (err) {
      console.warn('[Rusty.Lub Spot] Ошибка синхронизации серверов Rust+:', err);
    }
  }, []);

  const checkSteamSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setSteamUser(data.user);
          setSteamAuthState('authenticated');
          setSteamAuthError(null);
          if (data.csrfToken) {
            setCsrfToken(data.csrfToken);
          }
          localStorage.setItem(`${LOCAL_STORAGE_PREFIX}steam_user`, JSON.stringify(data.user));
          return true;
        }
      }

      // If server session is not authenticated
      setSteamUser(null);
      setSteamAuthState('unauthenticated');
      setCsrfToken('');
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}steam_user`);
      return false;
    } catch (err) {
      console.warn('[Rusty.Lub Spot] Ошибка проверки сессии Steam:', err);
      return false;
    }
  }, []);

  // Initial session check on mount and cross-tab / focus synchronization
  useEffect(() => {
    checkSteamSession();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'rusty_lub_auth_success') {
        console.info('[Rusty.Lub Spot Auth] Обнаружен успешный вход из другой вкладки через storage event.');
        checkSteamSession();
      }
    };

    const handleFocus = () => {
      checkSteamSession();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkSteamSession]);

  // Sync paired servers periodically so FCM-discovered in-game pairings appear without a reload.
  useEffect(() => {
    if (steamAuthState !== 'authenticated') {
      setPairedServers([]);
      return;
    }

    fetchPairedServers();
    const timer = window.setInterval(fetchPairedServers, 5000);
    return () => window.clearInterval(timer);
  }, [steamAuthState, fetchPairedServers]);

  // Synchronize team leader profile with authenticated Steam profile
  useEffect(() => {
    if (steamUser) {
      setTeamMembers(prev => {
        const copy = [...prev];
        if (copy[0]) {
          copy[0] = {
            ...copy[0],
            name: steamUser.displayName,
            steamId: steamUser.steamId,
            avatar: steamUser.avatar,
          };
        }
        return copy;
      });
    }
  }, [steamUser]);

  // Listen for popup messages from Steam callback window (NO LONG-LIVED TOKENS IN LOCALSTORAGE)
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'STEAM_AUTH_SUCCESS') {
        const { user, csrfToken: newCsrf } = data;
        if (user && user.steamId) {
          setSteamUser(user);
          setSteamAuthState('authenticated');
          setSteamAuthError(null);
          setShowLoginModal(false);
          setIsGuestMode(false);
          if (newCsrf) {
            setCsrfToken(newCsrf);
          }
          localStorage.setItem(`${LOCAL_STORAGE_PREFIX}steam_user`, JSON.stringify(user));

          // Fetch user's servers immediately
          fetchPairedServers();

          // Notify operator
          addNotification({
            title: 'АВТОРИЗАЦИЯ STEAM УСПЕШНА',
            message: `Подтвержден SteamID64: ${user.steamId} (${user.displayName}). Доступ к защищенному тактическому терминалу разблокирован.`,
            severity: 'info',
            category: 'system',
          });
        }
      } else if (data.type === 'STEAM_AUTH_ERROR') {
        setSteamAuthState('error');
        setSteamAuthError(data.error || 'Ошибка проверки подлинности OpenID 2.0');
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [fetchPairedServers]);

  const loginWithSteam = async () => {
    try {
      setSteamAuthState('logging_in');
      setSteamAuthError(null);

      // Open /api/auth/steam/login in a new browser tab to avoid iframe embedding restrictions from steamcommunity.com
      const authWindow = window.open('/api/auth/steam/login', '_blank');

      if (!authWindow || authWindow.closed || typeof authWindow.closed === 'undefined') {
        setSteamAuthState('error');
        setSteamAuthError('Браузер заблокировал открытие новой вкладки (Popup Blocker). Пожалуйста, воспользуйтесь прямой ссылкой ниже.');
        return;
      }

      // Periodically check session and listen to window focus when user completes auth in new tab
      const pollTimer = setInterval(async () => {
        const authed = await checkSteamSession();
        if (authed) {
          clearInterval(pollTimer);
          setShowLoginModal(false);
          setIsGuestMode(false);
        }
      }, 2000);

      const handleFocus = async () => {
        const authed = await checkSteamSession();
        if (authed) {
          window.removeEventListener('focus', handleFocus);
          clearInterval(pollTimer);
          setShowLoginModal(false);
          setIsGuestMode(false);
        }
      };
      window.addEventListener('focus', handleFocus);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollTimer);
        window.removeEventListener('focus', handleFocus);
        setSteamAuthState(prev => (prev === 'logging_in' ? 'unauthenticated' : prev));
      }, 5 * 60 * 1000);

    } catch (err: any) {
      console.error('Ошибка вызова Steam OpenID:', err);
      setSteamAuthState('error');
      setSteamAuthError(
        err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')
          ? 'Сетевой сбой: не удалось подключиться к серверу аутентификации.'
          : err?.message || 'Не удалось открыть вкладку авторизации Steam. Проверьте настройки всплывающих окон.'
      );
    }
  };

  const logoutSteam = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
      });
    } catch (e) {
      console.warn('Ошибка при завершении сессии на сервере:', e);
    } finally {
      setSteamUser(null);
      setSteamAuthState('unauthenticated');
      setCsrfToken('');
      setPairedServers([]);
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}steam_user`);
      setIsGuestMode(true);
      addNotification({
        title: 'ВЫХОД ИЗ STEAM ВЫПОЛНЕН',
        message: 'Сессия Steam завершена. Приложение переведено в гостевой режим.',
        severity: 'warning',
        category: 'system',
      });
    }
  };

  // Rust+ Server Pairing Methods
  const pairServer = async (params: {
    name?: string;
    ip: string;
    port: number;
    playerId: string;
    playerToken: number;
    pairingSource?: any;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/rustplus/pair', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Ошибка сопряжения сервера' };
      }

      // Pairing and connecting are one user action: start the live Rust+ session immediately.
      const serverId = data.server?.id as string | undefined;
      let connectionMessage = 'Сервер привязан.';

      if (serverId) {
        try {
          const connectRes = await fetch(`/api/rustplus/servers/${encodeURIComponent(serverId)}/connect`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken,
            },
          });
          const connectData = await connectRes.json();
          if (connectRes.ok && connectData.success) {
            connectionMessage = 'Сервер привязан, Rust+ подключён. Реальные данные получены.';
            addNotification({
              title: 'RUST+ ПОДКЛЮЧЁН',
              message: `"${params.name || params.ip}": соединение установлено, получены реальные данные.`,
              severity: 'success',
              category: 'system',
            });
          } else {
            connectionMessage = `Сервер привязан, но подключение не удалось: ${connectData.message || 'проверьте доступность сервера и данные сопряжения'}`;
            addNotification({
              title: 'СЕРВЕР ПРИВЯЗАН — НЕТ СОЕДИНЕНИЯ',
              message: connectionMessage,
              severity: 'warning',
              category: 'system',
            });
          }
        } catch {
          connectionMessage = 'Сервер привязан, но соединение не удалось проверить из-за сетевой ошибки.';
          addNotification({
            title: 'RUST+ НЕ ПОДКЛЮЧЁН',
            message: connectionMessage,
            severity: 'warning',
            category: 'system',
          });
        }
      }

      await fetchPairedServers();
      return { success: true, message: connectionMessage };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Сетевой сбой при сопряжении сервера' };
    }
  };

  const unpairServer = async (serverId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/rustplus/servers/${serverId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
      });

      if (res.ok) {
        await fetchPairedServers();
        addNotification({
          title: 'СЕРВЕР RUST+ УДАЛЕН',
          message: 'Сервер удален из защищенного реестра сопряжения.',
          severity: 'warning',
          category: 'system',
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Ошибка отвязки сервера:', err);
      return false;
    }
  };

  const reconnectServer = async (serverId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/rustplus/servers/${serverId}/connect`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
      });

      if (res.ok) {
        await fetchPairedServers();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Ошибка повторного подключения:', err);
      return false;
    }
  };

  const addMarker = (marker: Omit<MapMarker, 'id' | 'createdAt'>) => {
    const newMarker: MapMarker = {
      ...marker,
      id: `marker-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('ru-RU'),
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  const removeMarker = (id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
  };

  const updatePlayerNote = (id: string, notes: string) => {
    setPlayers(prev => prev.map(p => (p.id === id ? { ...p, notes } : p)));
  };

  const addPlayerSighting = (playerId: string, grid: string, note: string) => {
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === playerId) {
          const newSighting = {
            id: `s-${Date.now()}`,
            date: `${new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
            grid,
            note,
          };
          return {
            ...p,
            lastSeenGrid: grid,
            lastSeenDate: 'Только что',
            sightings: [newSighting, ...p.sightings],
          };
        }
        return p;
      })
    );
  };

  const addPlayerTag = (playerId: string, tag: string) => {
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === playerId && !p.tags.includes(tag)) {
          return { ...p, tags: [...p.tags, tag] };
        }
        return p;
      })
    );
  };

  const removePlayerTag = (playerId: string, tag: string) => {
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === playerId) {
          return { ...p, tags: p.tags.filter(t => t !== tag) };
        }
        return p;
      })
    );
  };

  const addNewPlayer = (p: Omit<PlayerContact, 'id' | 'sightings'>) => {
    const newContact: PlayerContact = {
      ...p,
      id: `p-${Date.now()}`,
      sightings: [
        {
          id: `s-${Date.now()}`,
          date: 'Только что',
          grid: p.lastSeenGrid,
          note: 'Добавлен вручную в трекер',
        },
      ],
    };
    setPlayers(prev => [newContact, ...prev]);
  };

  const openCCTV = (camera: CameraCode) => {
    setActiveCCTV(camera);
  };

  const closeCCTV = () => {
    setActiveCCTV(null);
  };

  const addCustomCamera = (camera: Omit<CameraCode, 'id'>) => {
    const newCam: CameraCode = {
      ...camera,
      id: `cam-${Date.now()}`,
      isCustom: true,
      status: 'active',
    };
    setAllCameras(prev => [...prev, newCam]);
  };

  const updateSettings = (newSettings: Partial<CompanionSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetAllData = () => {
    localStorage.clear();
    setServers(INITIAL_SERVERS);
    setSelectedServer(INITIAL_SERVERS[0]);
    setTeamMembers(INITIAL_TEAM);
    setSmartDevices(INITIAL_SMART_DEVICES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setMarkers(INITIAL_MARKERS);
    setPlayers(INITIAL_PLAYERS);
    setAllCameras(CAMERA_CODES);
  };

  return (
    <CompanionContext.Provider
      value={{
        steamUser,
        steamAuthState,
        steamAuthError,
        showLoginModal,
        setShowLoginModal,
        isGuestMode,
        setIsGuestMode,
        loginWithSteam,
        logoutSteam,
        checkSteamSession,
        csrfToken,
        pairedServers,
        fetchPairedServers,
        pairServer,
        unpairServer,
        reconnectServer,
        activeTab,
        setActiveTab,
        selectedServer,
        setSelectedServer,
        servers,
        addServer,
        toggleFavoriteServer,
        isSimulatedMode,
        setIsSimulatedMode,
        isRustPlusConnected,
        toggleRustPlusConnection,
        inGameTime,
        isNight,
        teamMembers,
        kickTeamMember,
        promoteLeader,
        inviteTeamMember,
        sendTeamPing,
        smartDevices,
        toggleSmartDevice,
        setGroupState,
        applyPreset,
        addSmartDevice,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        addNotification,
        unreadCount,
        markers,
        addMarker,
        removeMarker,
        players,
        updatePlayerNote,
        addPlayerSighting,
        addPlayerTag,
        removePlayerTag,
        addNewPlayer,
        activeCCTV,
        openCCTV,
        closeCCTV,
        allCameras,
        addCustomCamera,
        settings,
        updateSettings,
        resetAllData,
      }}
    >
      {children}
    </CompanionContext.Provider>
  );
};

export const useCompanion = () => {
  const context = useContext(CompanionContext);
  if (!context) {
    throw new Error('useCompanion must be used within a CompanionProvider');
  }
  return context;
};
