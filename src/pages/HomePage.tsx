import React from 'react';
import { ArrowDownRight, ArrowRight, Bell, BookOpen, Bomb, Clock3, Cpu, Map, Server, Shield, Sprout, Users, Video, Wifi, WifiOff, Zap } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { NavPageId } from '../types';

const tools: { id: NavPageId; title: string; description: string; icon: React.ComponentType<{ className?: string }>; tag: string }[] = [
  { id: 'map', title: 'Карта Rust', description: 'Метки, координаты и ориентиры команды.', icon: Map, tag: 'НАВИГАЦИЯ' },
  { id: 'player_tracker', title: 'Трекер игроков', description: 'Контакты, заметки и история встреч.', icon: Users, tag: 'РАЗВЕДКА' },
  { id: 'smart_electrical', title: 'Умная электрика', description: 'Устройства базы и готовые сценарии.', icon: Zap, tag: 'АВТОМАТИЗАЦИЯ' },
  { id: 'notifications', title: 'Уведомления', description: 'События и предупреждения в одном месте.', icon: Bell, tag: 'СОБЫТИЯ' },
  { id: 'team', title: 'Команда', description: 'Состав, роли и быстрые сигналы.', icon: Shield, tag: 'СОТРУДНИЧЕСТВО' },
  { id: 'camera_codes', title: 'Коды камер', description: 'Справочник камер монументов.', icon: Video, tag: 'НАБЛЮДЕНИЕ' },
  { id: 'plant_genetics', title: 'Генетика растений', description: 'Работа с генами и подбором растений.', icon: Sprout, tag: 'ФЕРМЕРСТВО' },
  { id: 'raid_calculator', title: 'Калькулятор рейдов', description: 'Сравнение способов разрушения.', icon: Bomb, tag: 'РАСЧЁТЫ' },
  { id: 'decay_calculator', title: 'Калькулятор гниения', description: 'Оценка расхода ресурсов на upkeep.', icon: Clock3, tag: 'РАСЧЁТЫ' },
  { id: 'recycler', title: 'Переработчик', description: 'Посмотри выход ресурсов с компонентов.', icon: Cpu, tag: 'РЕСУРСЫ' },
  { id: 'item_database', title: 'Справочник предметов', description: 'Информация о предметах и крафте.', icon: BookOpen, tag: 'БАЗА ЗНАНИЙ' },
  { id: 'servers', title: 'Серверы', description: 'Выбор и управление списком серверов.', icon: Server, tag: 'ПОДКЛЮЧЕНИЕ' },
];

export const HomePage: React.FC = () => {
  const { setActiveTab, selectedServer, pairedServers, steamUser, steamAuthState, setShowLoginModal, setIsGuestMode } = useCompanion();
  const liveRustPlusServer = pairedServers.find(server => server.status === 'connected');
  const openPage = (page: NavPageId) => setActiveTab(page);

  return (
    <div className="min-h-full bg-[#0D0F12] text-[#E6E8EC]">
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-10">
        <section className="relative overflow-hidden rounded-xl border border-[#34303A] bg-gradient-to-br from-[#1A1B20] via-[#12141A] to-[#17120F] p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-[#F97316]/15" />
          <div className="pointer-events-none absolute -right-2 -top-6 h-44 w-44 rounded-full border border-[#F97316]/10" />
          <div className="relative max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded border border-[#F97316]/30 bg-[#F97316]/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-[#F97316]"><span className="h-1.5 w-1.5 rounded-full bg-[#F97316]" />TACTICAL UTILITY PLATFORM</div>
            <h1 className="font-['Chakra_Petch'] text-3xl font-bold tracking-tight sm:text-5xl">RUSTY<span className="text-[#F97316]">.LUB</span> SPOT</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#B5BAC5] sm:text-base">Тактический центр для Rust: инструменты, информация о сервере и управление игровыми задачами — в одном интерфейсе.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => openPage('map')} className="inline-flex items-center gap-2 rounded bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E7650D]">Открыть карту <ArrowRight className="h-4 w-4" /></button>
              <button onClick={() => openPage('servers')} className="inline-flex items-center gap-2 rounded border border-[#45414A] bg-[#171A21] px-4 py-2.5 text-sm font-semibold text-[#E6E8EC] transition hover:border-[#F97316]/60">Выбрать сервер <Server className="h-4 w-4 text-[#F97316]" /></button>
            </div>
          </div>
          <div className="relative mt-8 grid gap-3 border-t border-[#34303A] pt-5 sm:grid-cols-3 lg:max-w-4xl">
            <div className="flex items-center gap-3 rounded border border-[#2C303A] bg-[#0D0F12]/70 p-3"><Server className="h-4 w-4 shrink-0 text-[#F97316]" /><div className="min-w-0"><div className="text-[9px] font-mono tracking-wider text-[#9298A5]">СЕРВЕР RUST+</div><div className="truncate text-xs font-semibold">{liveRustPlusServer?.name || selectedServer.name}</div></div></div>
            <div className="flex items-center gap-3 rounded border border-[#2C303A] bg-[#0D0F12]/70 p-3">
              {liveRustPlusServer ? <Wifi className="h-4 w-4 shrink-0 text-[#00C896]" /> : <WifiOff className="h-4 w-4 shrink-0 text-[#F04444]" />}
              <div><div className="text-[9px] font-mono tracking-wider text-[#9298A5]">РЕЖИМ RUST+</div><div className={liveRustPlusServer ? 'text-xs font-semibold text-[#00C896]' : 'text-xs font-semibold text-[#F04444]'}>{liveRustPlusServer ? 'РЕАЛЬНОЕ СОЕДИНЕНИЕ' : 'НЕТ СОЕДИНЕНИЯ'}</div></div>
            </div>
            <div className="flex items-center gap-3 rounded border border-[#2C303A] bg-[#0D0F12]/70 p-3"><div className={steamAuthState === 'authenticated' && steamUser ? 'h-2 w-2 shrink-0 rounded-full bg-[#00C896]' : 'h-2 w-2 shrink-0 rounded-full bg-[#9298A5]'} /><div className="min-w-0 flex-1"><div className="text-[9px] font-mono tracking-wider text-[#9298A5]">STEAM</div><div className="truncate text-xs font-semibold">{steamAuthState === 'authenticated' && steamUser ? steamUser.displayName : 'Не авторизован'}</div></div>{!(steamAuthState === 'authenticated' && steamUser) && <button onClick={() => { setIsGuestMode(false); setShowLoginModal(true); }} className="text-[10px] font-semibold text-[#F97316] hover:underline">Войти</button>}</div>
          </div>
        </section>

        <div className="mb-4 mt-9 flex flex-wrap items-end justify-between gap-3">
          <div><div className="font-mono text-[10px] tracking-[0.2em] text-[#F97316]">АРСЕНАЛ ИНСТРУМЕНТОВ</div><h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Быстрый доступ</h2><p className="mt-1 text-xs text-[#9298A5]">Выбери нужный модуль и продолжай работу.</p></div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9298A5]"><ArrowDownRight className="h-3.5 w-3.5 text-[#F97316]" />{String(tools.length).padStart(2, '0')} МОДУЛЕЙ</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool, index) => { const Icon = tool.icon; return (
            <button key={tool.id} onClick={() => openPage(tool.id)} className="group relative flex min-h-[142px] flex-col rounded-lg border border-[#292D36] bg-[#12141A] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#F97316]/60 hover:bg-[#171A21] focus:outline-none focus:ring-2 focus:ring-[#F97316]/50">
              <div className="flex w-full items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded border border-[#34303A] bg-[#1A1B20] text-[#F97316] transition group-hover:border-[#F97316]/40 group-hover:bg-[#F97316]/10"><Icon className="h-5 w-5" /></div><span className="font-mono text-[9px] tracking-wider text-[#707785]">{String(index + 1).padStart(2, '0')}</span></div>
              <div className="mt-4 flex w-full items-center justify-between gap-2"><h3 className="text-sm font-semibold text-[#E6E8EC] group-hover:text-white">{tool.title}</h3><ArrowRight className="h-4 w-4 shrink-0 text-[#626977] transition group-hover:translate-x-1 group-hover:text-[#F97316]" /></div>
              <p className="mt-1 text-xs leading-5 text-[#9298A5]">{tool.description}</p><span className="mt-3 font-mono text-[9px] tracking-[0.12em] text-[#737B89]">{tool.tag}</span>
            </button>
          ); })}
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#262A36] py-4 text-[10px] font-mono text-[#707785]"><span>RUSTY.LUB SPOT <span className="text-[#F97316]">/</span> TACTICAL UTILITY</span><button onClick={() => openPage('settings')} className="text-[#9298A5] transition hover:text-[#F97316]">НАСТРОЙКИ СИСТЕМЫ →</button></div>
      </div>
    </div>
  );
};
