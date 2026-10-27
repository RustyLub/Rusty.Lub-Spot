import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Flame,
  Volume2,
  VolumeX,
  Send,
  Sliders,
  Check,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    addNotification,
    unreadCount,
    settings,
    updateSettings,
  } = useCompanion();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://discord.com/api/webhooks/12345/rust-raid-alerts');
  const [webhookSaved, setWebhookSaved] = useState(false);

  const categories = [
    { id: 'all', label: 'Все' },
    { id: 'raid', label: 'Рейды' },
    { id: 'device', label: 'Устройства' },
    { id: 'event', label: 'Ивенты игры' },
    { id: 'team', label: 'Команда' },
  ];

  const filteredNotifications = notifications.filter(n => {
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    if (onlyUnread && n.isRead) return false;
    return true;
  });

  const handleTestRaidAlert = () => {
    addNotification({
      title: 'ВНИМАНИЕ: СРАБОТАЛА СИРЕНА РЕЙДА!',
      message: 'Взрыв C4/Ракет зафиксирован в районе Главного Бункера (G11).',
      severity: 'critical',
      category: 'raid',
      grid: 'G11',
    });
  };

  const handleSaveWebhook = () => {
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2000);
  };

  return (
    <div className="p-3 space-y-3 max-w-[1400px] mx-auto select-none">
      {/* Top Bar with Stats & Quick Actions */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#171A21] border border-[#262A36]">
            <Bell className="w-4 h-4 text-[#F97316]" />
          </div>
          <div>
            <div className="font-mono font-bold text-[#E6E8EC] text-sm flex items-center gap-2">
              <span>ЦЕНТР УВЕДОМЛЕНИЙ И ОПОВЕЩЕНИЙ</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-[#F97316] text-white font-mono text-[10px] font-bold">
                  {unreadCount} новых
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-[#9298A5]">
              Мгновенные оповещения через протокол Rust+ Companion
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestRaidAlert}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#261416] hover:bg-[#341A1D] text-[#F04444] border border-[#F04444]/40 font-mono text-xs transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-[#F04444]" />
            Тест сирены рейда
          </button>

          <button
            onClick={markAllNotificationsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#171A21] hover:bg-[#262A36] text-[#E6E8EC] border border-[#262A36] font-mono text-xs disabled:opacity-40 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#00C896]" />
            Прочитать все
          </button>

          <button
            onClick={clearNotifications}
            disabled={notifications.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#171A21] hover:bg-[#262A36] text-[#9298A5] hover:text-[#F04444] border border-[#262A36] font-mono text-xs disabled:opacity-40 transition-colors"
            title="Очистить историю"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Container: Feed + Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left 2 Cols: Feed */}
        <div className="lg:col-span-2 space-y-2.5">
          {/* Filters Bar */}
          <div className="bg-[#12141A] border border-[#262A36] rounded p-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-[#171A21] text-[#F97316] font-bold border border-[#F97316]'
                      : 'text-[#9298A5] hover:text-[#E6E8EC]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-[#9298A5] font-mono text-[11px] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={e => setOnlyUnread(e.target.checked)}
                className="rounded border-[#262A36] text-[#F97316] focus:ring-0"
              />
              <span>Только непрочитанные</span>
            </label>
          </div>

          {/* Notifications Feed */}
          <div className="space-y-1.5">
            {filteredNotifications.length === 0 ? (
              <div className="bg-[#12141A] border border-[#262A36] rounded p-8 text-center text-[#9298A5] font-mono text-xs">
                Нет оповещений по выбранному фильтру
              </div>
            ) : (
              filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`p-3 rounded border text-xs cursor-pointer transition-colors relative flex items-start gap-3 ${
                    notif.severity === 'critical'
                      ? 'bg-[#1E1416] border-[#F04444]/60 text-[#F04444]'
                      : notif.severity === 'warning'
                      ? 'bg-[#221B12] border-[#F5B942]/60 text-[#F5B942]'
                      : 'bg-[#171A21] border-[#262A36] text-[#E6E8EC]'
                  } ${!notif.isRead ? 'ring-1 ring-[#F97316]/50' : 'opacity-85'}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      notif.severity === 'critical'
                        ? 'bg-[#F04444] animate-pulse'
                        : notif.severity === 'warning'
                        ? 'bg-[#F5B942]'
                        : 'bg-blue-400'
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#E6E8EC] text-[13px]">
                          {notif.title}
                        </span>
                        {notif.grid && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#12141A] text-[#F97316] font-bold border border-[#262A36]">
                            {notif.grid}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-[#9298A5] tabular-nums">
                        {notif.timestamp}
                      </span>
                    </div>

                    <div className="text-xs text-[#9298A5] leading-relaxed">
                      {notif.message}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Webhook & Audio Preferences */}
        <div className="space-y-3">
          <div className="bg-[#12141A] border border-[#262A36] rounded p-3 text-xs space-y-3">
            <div className="font-mono text-[#E6E8EC] font-bold flex items-center gap-2 pb-2 border-b border-[#262A36]">
              <Sliders className="w-4 h-4 text-[#F97316]" />
              <span>НАСТРОЙКИ КАНАЛОВ ОПОВЕЩЕНИЯ</span>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <div className="font-medium text-[#E6E8EC]">Звуковая сирена рейда</div>
                <div className="text-[10px] text-[#9298A5]">Громкий сигнал при критической тревоге</div>
              </div>
              <button
                onClick={() => updateSettings({ soundAlerts: !settings.soundAlerts })}
                className={`p-1.5 rounded transition-colors ${
                  settings.soundAlerts
                    ? 'bg-[#10241B] text-[#00C896] border border-[#00C896]/40'
                    : 'bg-[#171A21] text-[#9298A5] border border-[#262A36]'
                }`}
              >
                {settings.soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Discord/Telegram Webhook Integration */}
            <div className="pt-2 border-t border-[#262A36] space-y-2">
              <div className="font-medium text-[#E6E8EC]">Discord / Telegram Webhook</div>
              <div className="text-[10px] text-[#9298A5]">
                Пересылка оповещений в клановый чат Discord
              </div>
              <input
                type="text"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-xs text-[#E6E8EC] font-mono focus:outline-none focus:border-[#F97316]"
              />
              <button
                onClick={handleSaveWebhook}
                className="w-full py-1.5 rounded bg-[#171A21] hover:bg-[#262A36] text-[#E6E8EC] border border-[#262A36] font-mono text-xs flex items-center justify-center gap-1.5"
              >
                {webhookSaved ? <Check className="w-3.5 h-3.5 text-[#00C896]" /> : <Send className="w-3.5 h-3.5" />}
                {webhookSaved ? 'Вебхук сохранен!' : 'Сохранить Webhook'}
              </button>
            </div>

            {/* Rust+ pairing notice */}
            <div className="pt-2 border-t border-[#262A36] text-[10px] font-mono text-[#9298A5] leading-relaxed">
              <span className="text-[#F97316] font-bold">INFO:</span> Оповещения Rust+ доставляются в реальном времени при включенном сервере и настроенном сопряжении в Rusty.Lub Spot.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
