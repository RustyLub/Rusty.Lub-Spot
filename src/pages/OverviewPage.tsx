import React, { useState } from 'react';
import {
  Server,
  Users,
  Bell,
  Zap,
  MapPin,
  Shield,
  Copy,
  Check,
  Flame,
  Radio,
  Eye,
  Lock,
  BatteryCharging,
  ChevronRight,
  AlertTriangle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';

export const OverviewPage: React.FC = () => {
  const {
    selectedServer,
    teamMembers,
    notifications,
    smartDevices,
    markers,
    setActiveTab,
    openCCTV,
    allCameras,
    applyPreset,
    sendTeamPing,
    isRustPlusConnected,
    inGameTime,
    unreadCount,
    toggleSmartDevice,
  } = useCompanion();

  const [copiedIp, setCopiedIp] = useState(false);
  const [copiedBaseCoords, setCopiedBaseCoords] = useState(false);
  const [teamPingInput, setTeamPingInput] = useState('');
  
  // Confirmation state for dangerous quick action
  const [confirmingRaidAlarm, setConfirmingRaidAlarm] = useState(false);
  const [confirmingLockdown, setConfirmingLockdown] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleCopyConnect = () => {
    navigator.clipboard.writeText(`connect ${selectedServer.ip}:${selectedServer.port}`);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleCopyBase = () => {
    const base = markers.find(m => m.type === 'base') || markers[0];
    if (base) {
      navigator.clipboard.writeText(`${base.name} - ${base.grid}`);
      setCopiedBaseCoords(true);
      setTimeout(() => setCopiedBaseCoords(false), 2000);
    }
  };

  const handleQuickPing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamPingInput.trim()) return;
    sendTeamPing(teamPingInput.trim());
    setTeamPingInput('');
    showFeedback('Сигнал передан команде');
  };

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const executeRaidAlarm = () => {
    applyPreset('raid_alarm');
    setConfirmingRaidAlarm(false);
    showFeedback('ТРЕВОГА РЕЙДА АКТИВИРОВАНА: все турели и сирены включены');
  };

  const executeLockdown = () => {
    applyPreset('base_lockdown');
    setConfirmingLockdown(false);
    showFeedback('РЕЖИМ БЛОКИРОВКИ: шлюзы и защитные контуры заблокированы');
  };

  const executeNightSaver = () => {
    applyPreset('night_saver');
    showFeedback('НОЧНОЙ РЕЖИМ: свет включен, второстепенные приборы отключены');
  };

  // Base devices state
  const activeTurrets = smartDevices.filter(d => d.type === 'turret');
  const mainBattery = smartDevices.find(d => d.type === 'battery');
  const sirenAlarm = smartDevices.find(d => d.name.includes('Сирена'));
  const onlineTeam = teamMembers.filter(m => m.isOnline);

  // Autonomous battery runtime calculation based on battery level & net power
  // Large Battery has 24,000 rWm max capacity (or level% of 24000). Net drain = (Output - Input).
  const batteryLevel = mainBattery?.batteryLevel || 94;
  const batteryInput = mainBattery?.batteryInput || 100;
  const batteryOutput = mainBattery?.batteryOutput || 85;
  const netWatts = batteryOutput - batteryInput;
  let estimatedRuntimeHours = 'Заряжается (+15W)';
  if (netWatts > 0) {
    const remainingWattHours = (batteryLevel / 100) * 24000;
    const hours = Math.round(remainingWattHours / netWatts);
    estimatedRuntimeHours = `~${hours} ч. при разряде`;
  } else {
    estimatedRuntimeHours = 'Автономно: 24/7 (Избыток +15W)';
  }

  return (
    <div className="p-3 space-y-3 max-w-[1600px] mx-auto select-none">
      {/* Action feedback toast */}
      {actionFeedback && (
        <div className="bg-[#171A21] border border-[#F97316] text-[#E6E8EC] px-3 py-1.5 rounded text-xs font-mono flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F97316] animate-ping" />
            {actionFeedback}
          </span>
          <button onClick={() => setActionFeedback(null)} className="text-[#9298A5] hover:text-white">✕</button>
        </div>
      )}

      {/* Верхняя сводка: Компактные показатели */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Metric 1: Server */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-2.5 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-[#9298A5] flex items-center justify-between">
            <span>СЕРВЕР</span>
            <span className="text-[#00C896]">ОНЛАЙН</span>
          </div>
          <div className="font-bold text-xs text-[#E6E8EC] truncate mt-1" title={selectedServer.name}>
            {selectedServer.name}
          </div>
          <div className="text-[10px] font-mono text-[#9298A5] mt-0.5">
            Пинг: <span className="text-[#00C896]">{selectedServer.ping}ms</span>
          </div>
        </div>

        {/* Metric 2: Online Pop */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-2.5 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-[#9298A5] flex items-center justify-between">
            <span>ИГРОКИ</span>
            <Users className="w-3 h-3 text-[#F97316]" />
          </div>
          <div className="font-bold font-mono text-base text-[#F97316] tabular-nums mt-0.5">
            {selectedServer.currentPlayers} / {selectedServer.maxPlayers}
          </div>
          <div className="text-[10px] font-mono text-[#9298A5]">
            {selectedServer.queue > 0 ? `Очередь: ${selectedServer.queue}` : 'Без очереди'}
          </div>
        </div>

        {/* Metric 3: Connection */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-2.5 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-[#9298A5] flex items-center justify-between">
            <span>RUST+ СВЯЗЬ</span>
            <Radio className="w-3 h-3 text-[#00C896]" />
          </div>
          <div className="font-bold font-mono text-xs text-[#00C896] mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse" />
            {isRustPlusConnected ? 'СИНХРОНИЗИРОВАНО' : 'ОФЛАЙН'}
          </div>
          <div className="text-[10px] font-mono text-[#9298A5] mt-0.5">
            Канал: 28082 TCP
          </div>
        </div>

        {/* Metric 4: Unread Events */}
        <div 
          onClick={() => setActiveTab('notifications')}
          className="bg-[#12141A] border border-[#262A36] hover:border-[#383E4E] rounded p-2.5 flex flex-col justify-between cursor-pointer transition-colors"
        >
          <div className="text-[10px] font-mono text-[#9298A5] flex items-center justify-between">
            <span>СОБЫТИЯ</span>
            <Bell className="w-3 h-3 text-[#F5B942]" />
          </div>
          <div className="font-bold font-mono text-base text-[#E6E8EC] tabular-nums mt-0.5 flex items-center gap-1.5">
            <span>{unreadCount} новых</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#F97316]" />
            )}
          </div>
          <div className="text-[10px] font-mono text-[#9298A5]">
            Всего: {notifications.length}
          </div>
        </div>

        {/* Metric 5: Team status */}
        <div 
          onClick={() => setActiveTab('team')}
          className="bg-[#12141A] border border-[#262A36] hover:border-[#383E4E] rounded p-2.5 flex flex-col justify-between cursor-pointer transition-colors"
        >
          <div className="text-[10px] font-mono text-[#9298A5] flex items-center justify-between">
            <span>КОМАНДА</span>
            <Shield className="w-3 h-3 text-[#00C896]" />
          </div>
          <div className="font-bold font-mono text-base text-[#00C896] tabular-nums mt-0.5">
            {onlineTeam.length} / {teamMembers.length} онлайн
          </div>
          <div className="text-[10px] font-mono text-[#9298A5]">
            Сбор: G11 Бункер
          </div>
        </div>

        {/* Metric 6: Base devices */}
        <div 
          onClick={() => setActiveTab('smart_electrical')}
          className="bg-[#12141A] border border-[#262A36] hover:border-[#383E4E] rounded p-2.5 flex flex-col justify-between cursor-pointer transition-colors"
        >
          <div className="text-[10px] font-mono text-[#9298A5] flex items-center justify-between">
            <span>БАЗА И ПИТАНИЕ</span>
            <Zap className="w-3 h-3 text-[#F97316]" />
          </div>
          <div className="font-bold font-mono text-base text-[#E6E8EC] tabular-nums mt-0.5">
            {batteryLevel}% батарея
          </div>
          <div className="text-[10px] font-mono text-[#00C896]">
            Турели: {activeTurrets.filter(t => t.state).length}/{activeTurrets.length} активны
          </div>
        </div>
      </div>

      {/* Рабочая область: Адаптивная сетка 6 блоков */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Блок 1: Быстрые команды базы (с подтверждением для опасных действий) */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#262A36]">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#E6E8EC]">
                <Flame className="w-3.5 h-3.5 text-[#F97316]" />
                <span>БЫСТРЫЕ КОМАНДЫ БАЗЫ</span>
              </div>
              <span className="text-[10px] font-mono text-[#00C896]">ОК</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Тревога рейда с подтверждением */}
              {confirmingRaidAlarm ? (
                <div className="col-span-2 p-2.5 rounded bg-[#261416] border border-[#F04444] text-xs space-y-1.5">
                  <div className="font-bold text-[#F04444] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> ВЗВЕСТИ СИРЕНУ РЕЙДА?
                  </div>
                  <div className="text-[11px] text-[#9298A5]">
                    Включит все боевые турели, ПВО и сирену 120дБ.
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={executeRaidAlarm}
                      className="px-2.5 py-1 rounded bg-[#F04444] hover:bg-red-700 text-white font-mono text-[11px] font-bold"
                    >
                      Подтвердить
                    </button>
                    <button
                      onClick={() => setConfirmingRaidAlarm(false)}
                      className="px-2.5 py-1 rounded bg-[#171A21] hover:bg-[#262A36] text-[#9298A5] font-mono text-[11px]"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingRaidAlarm(true)}
                  className="p-2 rounded bg-[#1F1517] hover:bg-[#2B171A] border border-[#F04444]/60 text-left transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#F04444] group-hover:text-red-300">
                      ТРЕВОГА РЕЙДА
                    </span>
                    <Flame className="w-3.5 h-3.5 text-[#F04444]" />
                  </div>
                  <div className="text-[10px] text-[#9298A5] mt-1">
                    Турели + сирена
                  </div>
                </button>
              )}

              {/* Блокировка базы */}
              {confirmingLockdown ? (
                <div className="col-span-2 p-2.5 rounded bg-[#181D2A] border border-blue-500 text-xs space-y-1.5">
                  <div className="font-bold text-blue-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> ЗАБЛОКИРОВАТЬ БАЗУ?
                  </div>
                  <div className="text-[11px] text-[#9298A5]">
                    Активирует бронешлюзы и запретит вход в бункер.
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={executeLockdown}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-mono text-[11px] font-bold"
                    >
                      Блокировать
                    </button>
                    <button
                      onClick={() => setConfirmingLockdown(false)}
                      className="px-2.5 py-1 rounded bg-[#171A21] hover:bg-[#262A36] text-[#9298A5] font-mono text-[11px]"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingLockdown(true)}
                  className="p-2 rounded bg-[#141A24] hover:bg-[#1A2333] border border-[#262A36] text-left transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-400 group-hover:text-blue-300">
                      БЛОКИРОВКА
                    </span>
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-[10px] text-[#9298A5] mt-1">
                    ПВО + гермошлюзы
                  </div>
                </button>
              )}

              {/* Ночной режим */}
              <button
                onClick={executeNightSaver}
                className="p-2 rounded bg-[#171A21] hover:bg-[#1E222D] border border-[#262A36] text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#F5B942] group-hover:text-amber-300">
                    НОЧНОЙ РЕЖИМ
                  </span>
                  <Zap className="w-3.5 h-3.5 text-[#F5B942]" />
                </div>
                <div className="text-[10px] text-[#9298A5] mt-1">
                  Свет ВКЛ, ферма ВЫКЛ
                </div>
              </button>

              {/* Управление сигнализацией / Координаты */}
              <button
                onClick={handleCopyBase}
                className="p-2 rounded bg-[#121E19] hover:bg-[#172B23] border border-[#00C896]/50 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#00C896] group-hover:text-emerald-300">
                    {copiedBaseCoords ? 'СКОПИРОВАНО!' : 'КООРДИНАТЫ'}
                  </span>
                  <MapPin className="w-3.5 h-3.5 text-[#00C896]" />
                </div>
                <div className="text-[10px] text-[#9298A5] mt-1">
                  База G11 (В буфер)
                </div>
              </button>
            </div>
          </div>

          {/* Быстрое сообщение по рации */}
          <form onSubmit={handleQuickPing} className="pt-2 border-t border-[#262A36] flex gap-1.5">
            <input
              type="text"
              value={teamPingInput}
              onChange={e => setTeamPingInput(e.target.value)}
              placeholder="Сигнал команде (напр. 'Враг на крыше G11')..."
              className="flex-1 bg-[#171A21] border border-[#262A36] rounded px-2.5 py-1 text-xs text-[#E6E8EC] placeholder-[#9298A5] focus:outline-none focus:border-[#F97316]"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-[#F97316] hover:bg-[#E05326] text-white font-medium text-xs rounded transition-colors shrink-0"
            >
              Отправить
            </button>
          </form>
        </div>

        {/* Блок 2: Состав команды (Аватар, ник, роль, HP, статус, квадрат) */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262A36]">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#E6E8EC]">
                <Users className="w-3.5 h-3.5 text-[#F97316]" />
                <span>СОСТАВ КОМАНДЫ ({onlineTeam.length}/{teamMembers.length})</span>
              </div>
              <button
                onClick={() => setActiveTab('team')}
                className="text-[10px] font-mono text-[#F97316] hover:underline flex items-center gap-0.5"
              >
                Все <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1.5">
              {teamMembers.map(member => (
                <div
                  key={member.id}
                  className="bg-[#171A21] border border-[#262A36] rounded p-2 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded overflow-hidden border border-[#262A36]">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#12141A] ${
                          member.isOnline ? 'bg-[#00C896]' : 'bg-[#9298A5]'
                        }`}
                      />
                    </div>

                    <div className="truncate">
                      <div className="font-medium text-[#E6E8EC] truncate flex items-center gap-1.5">
                        <span className="truncate">{member.name}</span>
                        {member.isLeader && (
                          <span className="text-[9px] font-mono text-[#F5B942] bg-amber-950/60 px-1 rounded">
                            ЛИДЕР
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-[#9298A5] truncate">
                        {member.role || 'Боец'} · {member.heldItem}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="w-12 h-1.5 bg-[#262A36] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            member.hp > 50
                              ? 'bg-[#00C896]'
                              : member.hp > 20
                              ? 'bg-[#F5B942]'
                              : 'bg-[#F04444]'
                          }`}
                          style={{ width: `${member.hp}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] tabular-nums font-bold text-[#E6E8EC]">
                        {member.hp} HP
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#9298A5]">
                      Квадрат: <span className="text-[#F97316] font-bold">{member.coords.grid}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-[#9298A5] font-mono flex justify-between border-t border-[#262A36] mt-2">
            <span>ГОЛОСОВАЯ СВЯЗЬ: АКТИВНА</span>
            <span>СПАВН: БАЗА G11</span>
          </div>
        </div>

        {/* Блок 3: Журнал событий (Время, тип, уровень, описание, переход) */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262A36]">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#E6E8EC]">
                <Bell className="w-3.5 h-3.5 text-[#F97316]" />
                <span>ЖУРНАЛ СОБЫТИЙ И ТРЕВОГ</span>
              </div>
              <button
                onClick={() => setActiveTab('notifications')}
                className="text-[10px] font-mono text-[#F97316] hover:underline flex items-center gap-0.5"
              >
                Все <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1.5">
              {notifications.slice(0, 4).map(notif => (
                <div
                  key={notif.id}
                  onClick={() => setActiveTab('notifications')}
                  className={`p-2 rounded border text-xs flex gap-2 cursor-pointer transition-colors ${
                    notif.severity === 'critical'
                      ? 'bg-[#1E1416] border-[#F04444]/50 text-[#F04444]'
                      : notif.severity === 'warning'
                      ? 'bg-[#221B12] border-[#F5B942]/50 text-[#F5B942]'
                      : 'bg-[#171A21] border-[#262A36] text-[#E6E8EC]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      notif.severity === 'critical'
                        ? 'bg-[#F04444]'
                        : notif.severity === 'warning'
                        ? 'bg-[#F5B942]'
                        : 'bg-blue-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate text-[#E6E8EC]">{notif.title}</span>
                      <span className="text-[10px] font-mono text-[#9298A5] ml-2 shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#9298A5] line-clamp-1 mt-0.5">
                      {notif.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-[#9298A5] font-mono flex justify-between border-t border-[#262A36] mt-2">
            <span>КАНАЛ: RUST+ EVENT FEED</span>
            <span className="text-[#00C896]">ОНЛАЙН СИНХРОНИЗАЦИЯ</span>
          </div>
        </div>

        {/* Блок 4: Электрика и питание (Батарея, мощность, статус, время работы) */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262A36]">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#E6E8EC]">
                <Zap className="w-3.5 h-3.5 text-[#F97316]" />
                <span>ЭЛЕКТРИКА И ПИТАНИЕ БАЗЫ</span>
              </div>
              <button
                onClick={() => setActiveTab('smart_electrical')}
                className="text-[10px] font-mono text-[#F97316] hover:underline flex items-center gap-0.5"
              >
                Панель <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Battery state */}
            {mainBattery && (
              <div className="bg-[#171A21] border border-[#262A36] rounded p-2.5 mb-2.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#E6E8EC]">Большая батарея (Large Battery)</span>
                  <span className="font-mono text-[#00C896] font-bold tabular-nums">
                    {batteryLevel}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#262A36] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00C896] rounded-full"
                    style={{ width: `${batteryLevel}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#9298A5] mt-1.5">
                  <span>Вход: <strong className="text-[#00C896]">+{batteryInput}W</strong> (Ветряки)</span>
                  <span>Расход: <strong className="text-[#F5B942]">-{batteryOutput}W</strong></span>
                </div>
              </div>
            )}

            {/* Devices summary grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#171A21] border border-[#262A36] rounded p-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#9298A5]">АКТИВНЫЕ ТУРЕЛИ</div>
                  <div className="font-mono font-bold text-[#E6E8EC]">
                    {activeTurrets.filter(t => t.state).length}/{activeTurrets.length} шт
                  </div>
                </div>
                <Shield className="w-4 h-4 text-[#00C896]" />
              </div>

              <div className="bg-[#171A21] border border-[#262A36] rounded p-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#9298A5]">СИРЕНА РЕЙДА</div>
                  <div className="font-mono font-bold text-[#E6E8EC]">
                    {sirenAlarm?.state ? (
                      <span className="text-[#F04444] animate-pulse">ВКЛЮЧЕНА</span>
                    ) : (
                      <span className="text-[#00C896]">В норме</span>
                    )}
                  </div>
                </div>
                {sirenAlarm?.state ? <Volume2 className="w-4 h-4 text-[#F04444]" /> : <VolumeX className="w-4 h-4 text-[#9298A5]" />}
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-[#9298A5] font-mono flex justify-between border-t border-[#262A36] mt-2">
            <span>АВТОНОМНОСТЬ:</span>
            <span className="text-[#00C896] font-semibold">{estimatedRuntimeHours}</span>
          </div>
        </div>

        {/* Блок 5: Сохранённые метки (Название, координаты, категория, быстрый переход) */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262A36]">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#E6E8EC]">
                <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                <span>СОХРАНЁННЫЕ МЕТКИ ({markers.length})</span>
              </div>
              <button
                onClick={() => setActiveTab('map')}
                className="text-[10px] font-mono text-[#F97316] hover:underline flex items-center gap-0.5"
              >
                Карта <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1.5">
              {markers.slice(0, 4).map(marker => (
                <div
                  key={marker.id}
                  onClick={() => setActiveTab('map')}
                  className="bg-[#171A21] border border-[#262A36] hover:border-[#383E4E] rounded p-2 flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: marker.color }}
                    />
                    <div className="truncate">
                      <span className="font-medium text-[#E6E8EC] truncate">{marker.name}</span>
                      <div className="text-[10px] font-mono text-[#9298A5] truncate">
                        {marker.note || 'Категория: ' + marker.type}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#12141A] border border-[#262A36] text-[11px] font-mono text-[#F97316] font-bold shrink-0 ml-2">
                    {marker.grid}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-[#9298A5] font-mono flex justify-between border-t border-[#262A36] mt-2">
            <span>КЛИК ДЛЯ ПЕРЕХОДА НА КАРТУ</span>
            <span>ГРИД: АКТИВЕН</span>
          </div>
        </div>

        {/* Блок 6: Быстрые камеры (Список, статус, переход к просмотру) */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262A36]">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#E6E8EC]">
                <Eye className="w-3.5 h-3.5 text-[#F97316]" />
                <span>БЫСТРЫЕ КАМЕРЫ НАБЛЮДЕНИЯ</span>
              </div>
              <button
                onClick={() => setActiveTab('camera_codes')}
                className="text-[10px] font-mono text-[#F97316] hover:underline flex items-center gap-0.5"
              >
                Все <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {allCameras.slice(0, 4).map(cam => (
                <button
                  key={cam.id}
                  onClick={() => openCCTV(cam)}
                  className="bg-[#171A21] border border-[#262A36] hover:border-[#F97316]/60 rounded p-2 text-left transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#E6E8EC] group-hover:text-[#F97316]">
                      {cam.code}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C896]" title="Камера доступна" />
                  </div>
                  <div className="text-[10px] text-[#9298A5] truncate mt-1">
                    {cam.ruMonument}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-[#9298A5] font-mono flex justify-between border-t border-[#262A36] mt-2">
            <span>CCTV СИСТЕМА: PTZ ОНЛАЙН</span>
            <span className="text-[#00C896]">СИГНАЛ 100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
