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
      <div className="bg-[#17191E] border border-[#2B2F38] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#17191E] border border-[#2B2F38]">
            <Bell className="w-4 h-4 text-[#FF7417]" />
          </div>
          <div>
            <div className="font-mono font-bold text-[#F0F1F3] text-sm flex items-center gap-2">
              <span>ЦЕНТР УВЕДОМЛЕНИЙ И ОПОВЕЩЕНИЙ</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-[#FF7417] text-white font-mono text-[10px] font-bold">
                  {unreadCount} новых
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-[#9BA2AF]">
              Мгновенные оповещения через протокол Rust+ Companion
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestRaidAlert}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#281719] hover:bg-[#3A1D20] text-[#F04444] border border-[#F04444]/40 font-mono text-xs transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-[#F04444]" />
            Тест сирены рейда
          </button>

          <button
            onClick={markAllNotificationsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#17191E] hover:bg-[#2B2F38] text-[#F0F1F3] border border-[#2B2F38] font-mono text-xs disabled:opacity-40 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#28C995]" />
            Прочитать все
          </button>

          <button
            onClick={clearNotifications}
            disabled={notifications.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#17191E] hover:bg-[#2B2F38] text-[#9BA2AF] hover:text-[#F04444] border border-[#2B2F38] font-mono text-xs disabled:opacity-40 transition-colors"
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
          <div className="bg-[#17191E] border border-[#2B2F38] rounded p-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-[#17191E] text-[#FF7417] font-bold border border-[#FF7417]'
                      : 'text-[#9BA2AF] hover:text-[#F0F1F3]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-[#9BA2AF] font-mono text-[11px] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={e => setOnlyUnread(e.target.checked)}
                className="rounded border-[#2B2F38] text-[#FF7417] focus:ring-0"
              />
              <span>Только непрочитанные</span>
            </label>
          </div>

          {/* Notifications Feed */}
          <div className="space-y-1.5">
            {filteredNotifications.length === 0 ? (
              <div className="bg-[#17191E] border border-[#2B2F38] rounded p-8 text-center text-[#9BA2AF] font-mono text-xs">
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
                      : 'bg-[#17191E] border-[#2B2F38] text-[#F0F1F3]'
                  } ${!notif.isRead ? 'ring-1 ring-[#FF7417]/50' : 'opacity-85'}`}
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
                        <span className="font-bold text-[#F0F1F3] text-[13px]">
                          {notif.title}
                        </span>
                        {notif.grid && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#17191E] text-[#FF7417] font-bold border border-[#2B2F38]">
                            {notif.grid}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-[#9BA2AF] tabular-nums">
                        {notif.timestamp}
                      </span>
                    </div>

                    <div className="text-xs text-[#9BA2AF] leading-relaxed">
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
          <div className="bg-[#17191E] border border-[#2B2F38] rounded p-3 text-xs space-y-3">
            <div className="font-mono text-[#F0F1F3] font-bold flex items-center gap-2 pb-2 border-b border-[#2B2F38]">
              <Sliders className="w-4 h-4 text-[#FF7417]" />
              <span>НАСТРОЙКИ КАНАЛОВ ОПОВЕЩЕНИЯ</span>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <div className="font-medium text-[#F0F1F3]">Звуковая сирена рейда</div>
                <div className="text-[10px] text-[#9BA2AF]">Громкий сигнал при критической тревоге</div>
              </div>
              <button
                onClick={() => updateSettings({ soundAlerts: !settings.soundAlerts })}
                className={`p-1.5 rounded transition-colors ${
                  settings.soundAlerts
                    ? 'bg-[#10251D] text-[#28C995] border border-[#28C995]/40'
                    : 'bg-[#17191E] text-[#9BA2AF] border border-[#2B2F38]'
                }`}
              >
                {settings.soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Discord/Telegram Webhook Integration */}
            <div className="pt-2 border-t border-[#2B2F38] space-y-2">
              <div className="font-medium text-[#F0F1F3]">Discord / Telegram Webhook</div>
              <div className="text-[10px] text-[#9BA2AF]">
                Пересылка оповещений в клановый чат Discord
              </div>
              <input
                type="text"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                className="w-full bg-[#17191E] border border-[#2B2F38] rounded p-2 text-xs text-[#F0F1F3] font-mono focus:outline-none focus:border-[#FF7417]"
              />
              <button
                onClick={handleSaveWebhook}
                className="w-full py-1.5 rounded bg-[#17191E] hover:bg-[#2B2F38] text-[#F0F1F3] border border-[#2B2F38] font-mono text-xs flex items-center justify-center gap-1.5"
              >
                {webhookSaved ? <Check className="w-3.5 h-3.5 text-[#28C995]" /> : <Send className="w-3.5 h-3.5" />}
                {webhookSaved ? 'Вебхук сохранен!' : 'Сохранить Webhook'}
              </button>
            </div>

            {/* Rust+ pairing notice */}
            <div className="pt-2 border-t border-[#2B2F38] text-[10px] font-mono text-[#9BA2AF] leading-relaxed">
              <span className="text-[#FF7417] font-bold">INFO:</span> Оповещения Rust+ доставляются в реальном времени при включенном сервере и настроенном сопряжении в Rusty.Lub Spot.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
