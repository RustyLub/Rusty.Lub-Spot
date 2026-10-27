import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  Upload,
  Radio,
  Eye,
  EyeOff,
  Check,
  Server,
  ShieldCheck,
  ExternalLink,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllData,
    isSimulatedMode,
    setIsSimulatedMode,
    isRustPlusConnected,
    toggleRustPlusConnection,
    steamUser,
    steamAuthState,
    setShowLoginModal,
    logoutSteam,
    loginWithSteam,
  } = useCompanion();

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleExportData = () => {
    const data = {
      settings,
      timestamp: new Date().toISOString(),
      appName: 'Rusty.Lub Spot',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rustylub_spot_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="p-3 space-y-3 max-w-[1200px] mx-auto select-none">
      {/* Header */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#171A21] border border-[#262A36]">
            <Settings className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <div className="font-mono font-bold text-[#E6E8EC] text-sm flex items-center gap-2">
              <span>НАСТРОЙКИ RUSTY.LUB SPOT</span>
              <span className="text-[10px] font-mono text-[#9298A5] bg-[#171A21] px-2 py-0.5 rounded border border-[#262A36]">
                ВЕРСИЯ 2.4.0 (DESKTOP)
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#9298A5]">
              Конфигурация параметров интерфейса, протокола Rust+ и локального хранилища
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3 text-xs">
        {/* Section 0: Steam OpenID 2.0 Account Status */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-3.5 space-y-3">
          <div className="font-mono font-bold text-[#E6E8EC] pb-2 border-b border-[#262A36] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F97316]" />
              <span>АВТОРИЗАЦИЯ STEAM (VALVE OPENID 2.0)</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              steamAuthState === 'authenticated'
                ? 'bg-[#00C896]/15 text-[#00C896] border border-[#00C896]/30'
                : 'bg-[#171A21] text-[#9298A5] border border-[#262A36]'
            }`}>
              {steamAuthState === 'authenticated' ? 'АККАУНТ ВЕРИФИЦИРОВАН' : 'ГОСТЕВОЙ РЕЖИМ (НЕ АВТОРИЗОВАН)'}
            </span>
          </div>

          {steamAuthState === 'authenticated' && steamUser ? (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#171A21] p-3 rounded border border-[#262A36]">
              <div className="flex items-center gap-3">
                <img
                  src={steamUser.avatar}
                  alt={steamUser.displayName}
                  className="w-10 h-10 rounded border border-[#262A36]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
                  }}
                />
                <div>
                  <div className="font-bold text-[#E6E8EC] text-sm flex items-center gap-2">
                    <span>{steamUser.displayName}</span>
                    <a
                      href={steamUser.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#F97316] text-[10px] hover:underline flex items-center gap-0.5 font-mono"
                    >
                      Steam Profile <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="text-[11px] font-mono text-[#9298A5]">
                    SteamID64: <span className="text-[#E6E8EC] font-semibold">{steamUser.steamId}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => logoutSteam()}
                className="px-3 py-1.5 rounded bg-[#261515] hover:bg-[#381a1a] text-[#F04444] border border-[#F04444]/40 font-mono text-xs flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Выйти из Steam
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#171A21] p-3 rounded border border-[#262A36]">
              <div>
                <div className="font-bold text-[#E6E8EC] text-xs">
                  Вход не выполнен. Используется гостевой режим.
                </div>
                <div className="text-[11px] text-[#9298A5] mt-0.5">
                  Подтвердите свой аккаунт через Valve Steam OpenID 2.0 для привязки SteamID64 к журналу и отряду.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 rounded bg-[#171A21] hover:bg-[#1E232F] text-white border border-[#262A36] hover:border-[#F97316] font-mono text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-[#F97316]" /> Войти через Steam
              </button>
            </div>
          )}

          <div className="text-[10px] font-mono text-[#9298A5] pt-1">
            * Сервер выполняет прямую валидацию цифровой подписи (check_authentication) с серверами Valve. Steam API Key не требуется для OpenID аутентификации.
          </div>
        </div>

        {/* Section 1: Appearance & UI Density */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-3.5 space-y-3">
          <div className="font-mono font-bold text-[#E6E8EC] pb-2 border-b border-[#262A36]">
            ВНЕШНИЙ ВИД И ИНТЕРФЕЙС (UI PREFERENCES)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#9298A5] mb-1 font-medium font-mono text-[11px]">Тема оформления</label>
              <select
                value={settings.theme}
                onChange={e => updateSettings({ theme: e.target.value as any })}
                className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316] transition-colors"
              >
                <option value="charcoal">Dark Charcoal (Стальной темно-серый #0D0F12)</option>
                <option value="rust">Rust Industrial (Индустриальный с акцентом #F97316)</option>
                <option value="black">Pitch Black (Глубокий черный)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#9298A5] mb-1 font-medium font-mono text-[11px]">Плотность информации (Density)</label>
              <select
                value={settings.density}
                onChange={e => updateSettings({ density: e.target.value as any })}
                className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316] transition-colors"
              >
                <option value="compact">Ультракомпактный (Высокая плотность виджетов)</option>
                <option value="normal">Стандартный (Сбалансированные отступы)</option>
              </select>
            </div>
          </div>

          {/* Streamer Mode Toggle */}
          <div className="pt-2 border-t border-[#262A36] flex items-center justify-between">
            <div>
              <div className="font-medium text-[#E6E8EC] flex items-center gap-1.5">
                {settings.streamerMode ? <EyeOff className="w-3.5 h-3.5 text-[#F5B942]" /> : <Eye className="w-3.5 h-3.5 text-[#9298A5]" />}
                <span>Режим стримера (Streamer Mode)</span>
              </div>
              <div className="text-[10px] text-[#9298A5] font-mono">
                Скрывает SteamID64, IP серверов и точные координаты базы на экране
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ streamerMode: !settings.streamerMode })}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                settings.streamerMode ? 'bg-[#F97316]' : 'bg-[#262A36]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.streamerMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 2: Rust+ Connectivity & Protocol */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-3.5 space-y-3">
          <div className="font-mono font-bold text-[#E6E8EC] pb-2 border-b border-[#262A36] flex items-center justify-between">
            <span>СОПРЯЖЕНИЕ RUST+ PROTOCOL (SERVER & TOKEN)</span>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-[#9298A5]">Режим:</span>
              <button
                type="button"
                onClick={() => setIsSimulatedMode(!isSimulatedMode)}
                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                  isSimulatedMode
                    ? 'bg-[#F5B942]/10 text-[#F5B942] border border-[#F5B942]/30'
                    : 'bg-[#00C896]/10 text-[#00C896] border border-[#00C896]/30'
                }`}
              >
                {isSimulatedMode ? 'СИМУЛЯЦИЯ' : 'LIVE КАНАЛ'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#9298A5] mb-1 font-medium font-mono text-[11px]">Rust+ Порт прослушивания</label>
              <input
                type="number"
                value={settings.rustPlusPort}
                onChange={e => updateSettings({ rustPlusPort: Number(e.target.value) })}
                className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#9298A5] mb-1 font-medium font-mono text-[11px]">Токен игрока (Player Token)</label>
              <input
                type="text"
                value={settings.playerToken}
                onChange={e => updateSettings({ playerToken: e.target.value })}
                className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316] transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#262A36] flex items-center justify-between">
            <div>
              <div className="font-medium text-[#E6E8EC]">Авто-обновление позиций команды на карте</div>
              <div className="text-[10px] text-[#9298A5] font-mono">Частота опроса GPS координат: 1 раз в 4 секунды</div>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ autoRefreshMap: !settings.autoRefreshMap })}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                settings.autoRefreshMap ? 'bg-[#F97316]' : 'bg-[#262A36]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.autoRefreshMap ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 3: Data Management & Backup */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-3.5 space-y-3">
          <div className="font-mono font-bold text-[#E6E8EC] pb-2 border-b border-[#262A36]">
            УПРАВЛЕНИЕ ЛОКАЛЬНЫМИ ДАННЫМИ (BACKUP & RESET)
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#171A21] hover:bg-[#262A36] text-[#E6E8EC] border border-[#262A36] font-mono text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#F97316]" /> Экспорт бэкапа (JSON)
              </button>
            </div>

            <div>
              {resetConfirmOpen ? (
                <div className="flex items-center gap-2">
                  <span className="text-[#F04444] text-xs font-mono">Точно сбросить всё?</span>
                  <button
                    type="button"
                    onClick={() => {
                      resetAllData();
                      setResetConfirmOpen(false);
                    }}
                    className="px-2.5 py-1 rounded bg-[#F04444] hover:bg-red-700 text-white font-mono text-xs font-bold transition-colors"
                  >
                    Да, сбросить
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetConfirmOpen(false)}
                    className="px-2.5 py-1 rounded bg-[#171A21] text-[#9298A5] hover:text-[#E6E8EC] font-mono text-xs border border-[#262A36] transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#171A21] hover:bg-[#262A36] text-[#F04444] border border-[#F04444]/40 font-mono text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#F04444]" /> Сбросить настройки к заводским
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Save button footer */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            {savedFeedback ? <Check className="w-4 h-4 text-white" /> : null}
            {savedFeedback ? 'НАСТРОЙКИ СОХРАНЕНЫ' : 'СОХРАНИТЬ ИЗМЕНЕНИЯ'}
          </button>
        </div>
      </form>
    </div>
  );
};
