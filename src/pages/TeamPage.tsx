import React, { useState } from 'react';
import {
  Shield,
  Crown,
  UserX,
  UserPlus,
  Send,
  Heart,
  Radio,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';

export const TeamPage: React.FC = () => {
  const {
    teamMembers,
    kickTeamMember,
    promoteLeader,
    inviteTeamMember,
    sendTeamPing,
  } = useCompanion();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteSteamId, setInviteSteamId] = useState('');
  const [radioMessage, setRadioMessage] = useState('');

  const quickPings = [
    'Враг на крыше базы G11!',
    'Нужна помощь / меня зажали!',
    'Сбор на Космодроме (Launch Site)',
    'Поставил метку на карте - лутаем',
    'Ящик на Нефтянке разблокирован!',
  ];

  const handleSendRadio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!radioMessage.trim()) return;
    sendTeamPing(radioMessage.trim());
    setRadioMessage('');
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;
    inviteTeamMember(
      inviteName.trim(),
      inviteSteamId.trim() || `76561198${Math.floor(100000000 + Math.random() * 900000000)}`
    );
    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteSteamId('');
  };

  return (
    <div className="p-3 space-y-3 max-w-[1400px] mx-auto select-none">
      {/* Top Header */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#171A21] border border-[#262A36]">
            <Shield className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <div className="font-mono font-bold text-[#E6E8EC] text-sm flex items-center gap-2">
              <span>СОСТАВ КОМАНДЫ (TEAM ROSTER)</span>
              <span className="text-[11px] font-mono text-[#00C896] bg-[#10241B] border border-[#00C896]/40 px-2 py-0.5 rounded">
                {teamMembers.filter(m => m.isOnline).length} ОНЛАЙН ИЗ {teamMembers.length}
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#9298A5]">
              Командная система Rust (Team UI) с авто-обновлением здоровья и координат
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-xs transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" /> Пригласить союзника
        </button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teamMembers.map(member => (
          <div
            key={member.id}
            className="bg-[#12141A] border border-[#262A36] rounded p-3 text-xs flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded bg-[#171A21] border border-[#262A36] overflow-hidden">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#12141A] ${
                      member.isOnline ? 'bg-[#00C896]' : 'bg-[#9298A5]'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#E6E8EC] text-sm">{member.name}</span>
                    {member.isLeader && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#221B12] text-[#F5B942] font-mono text-[9px] border border-[#F5B942]/40 font-bold">
                        <Crown className="w-2.5 h-2.5" /> ЛИДЕР
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-[#F97316] mt-0.5">
                    Роль: <span className="text-[#E6E8EC] font-sans font-medium">{member.role}</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#9298A5]">
                    SteamID: {member.steamId}
                  </div>
                </div>
              </div>

              {/* Leader & Kick actions */}
              <div className="flex items-center gap-1">
                {!member.isLeader && (
                  <button
                    onClick={() => promoteLeader(member.id)}
                    className="p-1.5 rounded bg-[#171A21] hover:bg-[#262A36] text-[#9298A5] hover:text-[#F5B942] border border-[#262A36]"
                    title="Сделать лидером"
                  >
                    <Crown className="w-3.5 h-3.5" />
                  </button>
                )}
                {teamMembers.length > 1 && (
                  <button
                    onClick={() => kickTeamMember(member.id)}
                    className="p-1.5 rounded bg-[#261416] hover:bg-[#341A1D] text-[#9298A5] hover:text-[#F04444] border border-[#F04444]/40"
                    title="Исключить из команды"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Vitals: HP bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                <span className="text-[#9298A5] flex items-center gap-1">
                  <Heart className="w-3 h-3 text-[#F04444]" /> ЗДОРОВЬЕ:
                </span>
                <span className="font-bold text-[#E6E8EC] tabular-nums">
                  {member.hp} / {member.maxHp} HP
                </span>
              </div>
              <div className="w-full h-2 bg-[#262A36] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    member.hp > 60
                      ? 'bg-[#00C896]'
                      : member.hp > 25
                      ? 'bg-[#F5B942]'
                      : 'bg-[#F04444]'
                  }`}
                  style={{ width: `${member.hp}%` }}
                />
              </div>
            </div>

            {/* Tactical Coords & Held Item */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#171A21] p-2 rounded border border-[#262A36]">
              <div>
                <span className="text-[#9298A5]">ПОЗИЦИЯ: </span>
                <span className="text-[#F97316] font-bold">{member.coords.grid}</span>
                <span className="text-[#9298A5] text-[10px]"> ({member.distance})</span>
              </div>
              <div className="truncate">
                <span className="text-[#9298A5]">В РУКАХ: </span>
                <span className="text-[#E6E8EC]">{member.heldItem}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Radio Dispatcher & Quick Pings */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 space-y-3 text-xs">
        <div className="font-mono font-bold text-[#E6E8EC] flex items-center gap-2 pb-2 border-b border-[#262A36]">
          <Radio className="w-4 h-4 text-[#F97316]" />
          <span>КОМАНДНАЯ РАЦИЯ И БЫСТРЫЕ ПИНГИ</span>
        </div>

        {/* Quick Ping Chips */}
        <div className="flex flex-wrap gap-1.5">
          {quickPings.map((ping, idx) => (
            <button
              key={idx}
              onClick={() => sendTeamPing(ping)}
              className="px-2.5 py-1 rounded bg-[#171A21] hover:bg-[#262A36] text-[#9298A5] hover:text-[#E6E8EC] border border-[#262A36] text-[11px] font-mono transition-colors"
            >
              + {ping}
            </button>
          ))}
        </div>

        {/* Custom text dispatch */}
        <form onSubmit={handleSendRadio} className="flex gap-2">
          <input
            type="text"
            value={radioMessage}
            onChange={e => setRadioMessage(e.target.value)}
            placeholder="Введите оперативное сообщение в чат команды..."
            className="flex-1 bg-[#171A21] border border-[#262A36] rounded px-3 py-1.5 text-xs text-[#E6E8EC] placeholder-[#9298A5] focus:outline-none focus:border-[#F97316]"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Передать по рации
          </button>
        </form>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#12141A] border border-[#262A36] rounded p-4 w-full max-w-sm text-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#262A36]">
              <span className="font-mono font-bold text-[#E6E8EC] text-sm">ПРИГЛАСИТЬ В КОМАНДУ</span>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-[#9298A5] hover:text-[#E6E8EC]">✕</button>
            </div>

            <form onSubmit={handleInvite} className="space-y-2.5">
              <div>
                <label className="block text-[#9298A5] mb-1">Никнейм в Rust</label>
                <input
                  type="text"
                  required
                  placeholder="напр. ToxicFarmer"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-[#9298A5] mb-1">SteamID64 (опционально)</label>
                <input
                  type="text"
                  placeholder="76561198..."
                  value={inviteSteamId}
                  onChange={e => setInviteSteamId(e.target.value)}
                  className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#171A21] text-[#9298A5] hover:bg-[#262A36] hover:text-[#E6E8EC]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-medium"
                >
                  Отправить инвайт
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
