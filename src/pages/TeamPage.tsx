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
      <div className="bg-[#17191E] border border-[#2B2F38] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#17191E] border border-[#2B2F38]">
            <Shield className="w-5 h-5 text-[#FF7417]" />
          </div>
          <div>
            <div className="font-mono font-bold text-[#F0F1F3] text-sm flex items-center gap-2">
              <span>СОСТАВ КОМАНДЫ (TEAM ROSTER)</span>
              <span className="text-[11px] font-mono text-[#28C995] bg-[#10251D] border border-[#28C995]/40 px-2 py-0.5 rounded">
                {teamMembers.filter(m => m.isOnline).length} ОНЛАЙН ИЗ {teamMembers.length}
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#9BA2AF]">
              Командная система Rust (Team UI) с авто-обновлением здоровья и координат
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#FF7417] hover:bg-[#E05326] text-white font-mono text-xs transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" /> Пригласить союзника
        </button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teamMembers.map(member => (
          <div
            key={member.id}
            className="bg-[#17191E] border border-[#2B2F38] rounded p-3 text-xs flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded bg-[#17191E] border border-[#2B2F38] overflow-hidden">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#17191E] ${
                      member.isOnline ? 'bg-[#28C995]' : 'bg-[#9BA2AF]'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#F0F1F3] text-sm">{member.name}</span>
                    {member.isLeader && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#221B12] text-[#F5B942] font-mono text-[9px] border border-[#F5B942]/40 font-bold">
                        <Crown className="w-2.5 h-2.5" /> ЛИДЕР
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-[#FF7417] mt-0.5">
                    Роль: <span className="text-[#F0F1F3] font-sans font-medium">{member.role}</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#9BA2AF]">
                    SteamID: {member.steamId}
                  </div>
                </div>
              </div>

              {/* Leader & Kick actions */}
              <div className="flex items-center gap-1">
                {!member.isLeader && (
                  <button
                    onClick={() => promoteLeader(member.id)}
                    className="p-1.5 rounded bg-[#17191E] hover:bg-[#2B2F38] text-[#9BA2AF] hover:text-[#F5B942] border border-[#2B2F38]"
                    title="Сделать лидером"
                  >
                    <Crown className="w-3.5 h-3.5" />
                  </button>
                )}
                {teamMembers.length > 1 && (
                  <button
                    onClick={() => kickTeamMember(member.id)}
                    className="p-1.5 rounded bg-[#281719] hover:bg-[#3A1D20] text-[#9BA2AF] hover:text-[#F04444] border border-[#F04444]/40"
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
                <span className="text-[#9BA2AF] flex items-center gap-1">
                  <Heart className="w-3 h-3 text-[#F04444]" /> ЗДОРОВЬЕ:
                </span>
                <span className="font-bold text-[#F0F1F3] tabular-nums">
                  {member.hp} / {member.maxHp} HP
                </span>
              </div>
              <div className="w-full h-2 bg-[#2B2F38] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    member.hp > 60
                      ? 'bg-[#28C995]'
                      : member.hp > 25
                      ? 'bg-[#F5B942]'
                      : 'bg-[#F04444]'
                  }`}
                  style={{ width: `${member.hp}%` }}
                />
              </div>
            </div>

            {/* Tactical Coords & Held Item */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#17191E] p-2 rounded border border-[#2B2F38]">
              <div>
                <span className="text-[#9BA2AF]">ПОЗИЦИЯ: </span>
                <span className="text-[#FF7417] font-bold">{member.coords.grid}</span>
                <span className="text-[#9BA2AF] text-[10px]"> ({member.distance})</span>
              </div>
              <div className="truncate">
                <span className="text-[#9BA2AF]">В РУКАХ: </span>
                <span className="text-[#F0F1F3]">{member.heldItem}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Radio Dispatcher & Quick Pings */}
      <div className="bg-[#17191E] border border-[#2B2F38] rounded p-3 space-y-3 text-xs">
        <div className="font-mono font-bold text-[#F0F1F3] flex items-center gap-2 pb-2 border-b border-[#2B2F38]">
          <Radio className="w-4 h-4 text-[#FF7417]" />
          <span>КОМАНДНАЯ РАЦИЯ И БЫСТРЫЕ ПИНГИ</span>
        </div>

        {/* Quick Ping Chips */}
        <div className="flex flex-wrap gap-1.5">
          {quickPings.map((ping, idx) => (
            <button
              key={idx}
              onClick={() => sendTeamPing(ping)}
              className="px-2.5 py-1 rounded bg-[#17191E] hover:bg-[#2B2F38] text-[#9BA2AF] hover:text-[#F0F1F3] border border-[#2B2F38] text-[11px] font-mono transition-colors"
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
            className="flex-1 bg-[#17191E] border border-[#2B2F38] rounded px-3 py-1.5 text-xs text-[#F0F1F3] placeholder-[#9BA2AF] focus:outline-none focus:border-[#FF7417]"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-[#FF7417] hover:bg-[#E05326] text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Передать по рации
          </button>
        </form>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#17191E] border border-[#2B2F38] rounded p-4 w-full max-w-sm text-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#2B2F38]">
              <span className="font-mono font-bold text-[#F0F1F3] text-sm">ПРИГЛАСИТЬ В КОМАНДУ</span>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-[#9BA2AF] hover:text-[#F0F1F3]">✕</button>
            </div>

            <form onSubmit={handleInvite} className="space-y-2.5">
              <div>
                <label className="block text-[#9BA2AF] mb-1">Никнейм в Rust</label>
                <input
                  type="text"
                  required
                  placeholder="напр. ToxicFarmer"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  className="w-full bg-[#17191E] border border-[#2B2F38] rounded p-2 text-[#F0F1F3] focus:outline-none focus:border-[#FF7417]"
                />
              </div>

              <div>
                <label className="block text-[#9BA2AF] mb-1">SteamID64 (опционально)</label>
                <input
                  type="text"
                  placeholder="76561198..."
                  value={inviteSteamId}
                  onChange={e => setInviteSteamId(e.target.value)}
                  className="w-full bg-[#17191E] border border-[#2B2F38] rounded p-2 text-[#F0F1F3] font-mono focus:outline-none focus:border-[#FF7417]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#17191E] text-[#9BA2AF] hover:bg-[#2B2F38] hover:text-[#F0F1F3]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#FF7417] hover:bg-[#E05326] text-white font-medium"
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
