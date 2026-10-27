import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  Server,
  Radio,
  Settings,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';

export const TopBar: React.FC = () => {
  const {
    selectedServer,
    setSelectedServer,
    servers,
    isRustPlusConnected,
    toggleRustPlusConnection,
    isSimulatedMode,
    setIsSimulatedMode,
    inGameTime,
    isNight,
    unreadCount,
    setActiveTab,
    teamMembers,
    steamUser,
    steamAuthState,
    setShowLoginModal,
    logoutSteam,
  } = useCompanion();

  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const myProfile = teamMembers[0] || {
    name: 'RustyOperator',
    steamId: '76561198012345678',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop&crop=faces',
  };

  return (
    <header className="h-11 bg-[#0D0F12] border-b border-[#262A36] flex items-center justify-between px-3 text-xs select-none z-30 shrink-0">
      {/* 1. Brand Mark R.L. and RUSTY.LUB SPOT + 2. Server Selector */}
      <div className="flex items-center gap-2.5">
        <div 
          onClick={() => setActiveTab('overview')} 
          className="flex items-center gap-2 cursor-pointer group pr-2.5 border-r border-[#262A36]"
          title="Rusty.Lub Spot — Главная"
        >
          <div className="w-6 h-6 rounded bg-[#F97316] flex items-center justify-center font-bold text-white tracking-tight text-xs font-['Chakra_Petch'] shadow-sm">
            R.L.
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#E6E8EC] tracking-wider text-xs font-['Chakra_Petch'] group-hover:text-[#F97316] transition-colors leading-tight">
              RUSTY.LUB SPOT
            </span>
            <span className="text-[9px] text-[#9298A5] font-mono tracking-tight leading-none">
              TACTICAL UTILITY
            </span>
          </div>
        </div>

        {/* 2. Server Picker & 3. Players Online */}
        <div className="relative">
          <button
            onClick={() => setServerDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#12141A] border border-[#262A36] hover:border-[#F97316]/50 text-[#E6E8EC] transition-colors"
          >
            <Server className="w-3.5 h-3.5 text-[#F97316]" />
            <span className="font-medium max-w-[200px] truncate text-left text-xs">
              {selectedServer.name}
            </span>
            <span className="text-[11px] font-mono text-[#00C896] tabular-nums font-semibold">
              {selectedServer.currentPlayers}/{selectedServer.maxPlayers}
            </span>
            <ChevronDown className="w-3 h-3 text-[#9298A5] ml-0.5" />
          </button>

          {serverDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-76 bg-[#12141A] border border-[#262A36] rounded shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 border-b border-[#262A36] text-[10px] text-[#9298A5] font-mono flex justify-between items-center">
                <span>ВЫБОР АКТИВНОГО СЕРВЕРА</span>
                <button
                  onClick={() => {
                    setServerDropdownOpen(false);
                    setActiveTab('servers');
                  }}
                  className="text-[#F97316] hover:underline"
                >
                  Все серверы
                </button>
              </div>
              {servers.map(server => (
                <button
                  key={server.id}
                  onClick={() => {
                    setSelectedServer(server);
                    setServerDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#171A21] transition-colors ${
                    selectedServer.id === server.id ? 'bg-[#171A21] text-[#F97316]' : 'text-[#E6E8EC]'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium truncate text-xs">{server.name}</div>
                    <div className="text-[10px] font-mono text-[#9298A5]">
                      {server.ip}:{server.port} · {server.ping}ms
                    </div>
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-[#00C896] shrink-0 font-semibold">
                    {server.currentPlayers}/{server.maxPlayers}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: 4. Simulation Mode + 5. In-game Clock */}
      <div className="flex items-center gap-2.5">
        {/* 4. Connection mode: Тест-симуляция */}
        <div 
          onClick={() => setIsSimulatedMode(!isSimulatedMode)}
          title="Кликните для переключения режима симуляции / реального подключения"
          className="cursor-pointer flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#12141A] border border-[#262A36] hover:border-[#F97316]/50 text-[10px] font-mono text-[#E6E8EC] transition-colors"
        >
          <Radio className={`w-3 h-3 ${isSimulatedMode ? 'text-[#F5B942] animate-pulse' : 'text-[#00C896]'}`} />
          <span>{isSimulatedMode ? 'ТЕСТ-СИМУЛЯЦИЯ' : 'LIVE КАНАЛ'}</span>
        </div>

        {/* 5. In-game Clock */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#12141A] border border-[#262A36] text-[#E6E8EC] font-mono text-xs tabular-nums">
          {isNight ? (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-[#F5B942]" />
          )}
          <span>{inGameTime}</span>
        </div>
      </div>

      {/* Right: 6. Rust+ status, 7. Notifications, 8. User profile & Settings */}
      <div className="flex items-center gap-2">
        {/* 6. Rust+ Connection State */}
        <button
          onClick={toggleRustPlusConnection}
          title={isRustPlusConnected ? 'Rust+ подключен (кликните для отключения)' : 'Rust+ отключен (кликните для подключения)'}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono transition-colors border ${
            isRustPlusConnected
              ? 'bg-[#10241B] border-[#00C896]/40 text-[#00C896] hover:bg-[#142F23]'
              : 'bg-[#261416] border-[#F04444]/40 text-[#F04444] hover:bg-[#341A1D]'
          }`}
        >
          {isRustPlusConnected ? (
            <>
              <Wifi className="w-3 h-3 text-[#00C896]" />
              <span className="hidden sm:inline">RUST+ СВЯЗЬ: OK</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-[#F04444]" />
              <span className="hidden sm:inline">RUST+ ОФЛАЙН</span>
            </>
          )}
        </button>

        {/* 7. Notifications Icon Button */}
        <button
          onClick={() => setActiveTab('notifications')}
          className="relative p-1.5 rounded bg-[#12141A] border border-[#262A36] hover:border-[#383E4E] text-[#9298A5] hover:text-[#E6E8EC] transition-colors"
          title="Уведомления"
        >
          <Bell className="w-3.5 h-3.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#F97316] text-white font-mono text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* 8. Steam Auth Profile / Sign-in */}
        <div className="relative pl-2 border-l border-[#262A36]">
          {steamAuthState === 'authenticated' && steamUser ? (
            <div>
              <button
                onClick={() => setUserMenuOpen(prev => !prev)}
                className="flex items-center gap-2 p-1 rounded hover:bg-[#12141A] border border-transparent hover:border-[#262A36] transition-colors"
              >
                <div className="w-6 h-6 rounded bg-[#171A21] overflow-hidden border border-[#00C896]/60">
                  <img 
                    src={steamUser.avatar} 
                    alt={steamUser.displayName}
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
                    }}
                  />
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#E6E8EC] leading-tight truncate max-w-[120px]">
                      {steamUser.displayName}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C896]" title="Steam Verified" />
                  </div>
                  <span className="text-[9px] font-mono text-[#9298A5] leading-tight">
                    {steamUser.steamId.substring(0, 8)}...
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-[#9298A5]" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#12141A] border border-[#262A36] rounded-md shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in duration-100">
                  <div className="px-3 py-2 border-b border-[#262A36] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#E6E8EC] text-xs truncate">
                        {steamUser.displayName}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#00C896]/20 text-[#00C896] border border-[#00C896]/40 font-bold">
                        VERIFIED
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#9298A5] select-all">
                      SteamID64: {steamUser.steamId}
                    </div>
                  </div>

                  <div className="py-1 text-xs font-mono">
                    <a
                      href={steamUser.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full px-3 py-1.5 flex items-center justify-between text-[#E6E8EC] hover:bg-[#171A21] transition-colors"
                    >
                      <span>Профиль Steam Community</span>
                      <span className="text-[#9298A5] text-[10px]">↗</span>
                    </a>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setActiveTab('settings');
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center justify-between text-[#E6E8EC] hover:bg-[#171A21] transition-colors"
                    >
                      <span>Параметры тактического хаба</span>
                      <Settings className="w-3.5 h-3.5 text-[#9298A5]" />
                    </button>

                    <div className="my-1 border-t border-[#262A36]" />

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logoutSteam();
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center justify-between text-[#F04444] hover:bg-[#261515] transition-colors"
                    >
                      <span>Выйти из Steam</span>
                      <span className="text-[10px] font-bold">LOGOUT</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#171A21] hover:bg-[#1E232F] text-[#E6E8EC] hover:text-white border border-[#262A36] hover:border-[#F97316] font-mono text-[11px] font-semibold transition-all shadow-sm"
              >
                {/* Steam icon */}
                <svg className="w-3.5 h-3.5 fill-current text-[#F97316]" viewBox="0 0 24 24">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12S18.605 0 11.979 0z" />
                </svg>
                <span>ВОЙТИ ЧЕРЕЗ STEAM</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
