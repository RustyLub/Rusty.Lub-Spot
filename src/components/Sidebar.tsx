import React, { useState } from 'react';
import {
  LayoutDashboard,
  Home,
  Map,
  Users,
  Zap,
  Bell,
  Shield,
  Server,
  Video,
  Sprout,
  Bomb,
  Hourglass,
  RefreshCw,
  BookOpen,
  Keyboard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavPageId } from '../types';
import { useCompanion } from '../context/CompanionContext';

interface SidebarItemDef {
  id: NavPageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
  badge?: number | string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, unreadCount } = useCompanion();
  const [collapsed, setCollapsed] = useState(false);

  const items: SidebarItemDef[] = [
    // 1. Основное
    { id: 'home', label: 'Главная', icon: Home, section: 'ОСНОВНОЕ' },
    { id: 'overview', label: 'Оперативный обзор', icon: LayoutDashboard },
    { id: 'map', label: 'Карта', icon: Map },
    { id: 'player_tracker', label: 'Трекер игроков', icon: Users },
    { id: 'smart_electrical', label: 'Умная электрика', icon: Zap },
    { id: 'notifications', label: 'Уведомления', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'team', label: 'Команда', icon: Shield },
    { id: 'servers', label: 'Серверы', icon: Server },

    // 2. Инструменты
    { id: 'camera_codes', label: 'Коды камер', icon: Video, section: 'ИНСТРУМЕНТЫ' },
    { id: 'plant_genetics', label: 'Генетика растений', icon: Sprout },
    { id: 'raid_calculator', label: 'Калькулятор рейдов', icon: Bomb },
    { id: 'decay_calculator', label: 'Калькулятор гниения', icon: Hourglass },
    { id: 'recycler', label: 'Переработчик', icon: RefreshCw },
    { id: 'item_database', label: 'Справочник предметов', icon: BookOpen },
    { id: 'hotkeys', label: 'Горячие клавиши', icon: Keyboard },

    // 3. Система
    { id: 'settings', label: 'Настройки', icon: Settings, section: 'СИСТЕМА' },
  ];

  return (
    <aside
      className={`h-[calc(100vh-3.5rem)] bg-[#101114]/95 border-r border-[#2B2F38] flex flex-col justify-between transition-all duration-200 select-none shrink-0 backdrop-blur-xl ${
        collapsed ? 'w-14' : 'w-60'
      }`}
    >
      {/* Navigation List */}
      <div className="py-3 overflow-y-auto overflow-x-hidden flex-1 px-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showSection = item.section && !collapsed;

          return (
            <React.Fragment key={item.id}>
              {showSection && (
                <div className="px-2 pt-5 pb-2 text-[9px] font-mono tracking-[0.18em] text-[#747c8a] font-semibold">
                  {item.section}
                </div>
              )}
              <button
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-[#FF7417]/10 text-[#FF8A3D] font-semibold shadow-[inset_2px_0_0_#FF7417]'
                    : 'text-[#9BA2AF] hover:text-[#F0F1F3] hover:bg-white/[0.045]'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#FF7417]' : 'text-[#737B89] group-hover:text-[#F0F1F3]'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate text-left flex-1 tracking-tight">
                    {item.label}
                  </span>
                )}
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      isActive
                        ? 'bg-[#F97316] text-white'
                        : 'bg-[#262A36] text-[#E6E8EC] group-hover:bg-[#383E4E]'
                    } ${collapsed ? 'absolute top-1 right-1 w-2 h-2 p-0 rounded-full bg-[#F97316]' : ''}`}
                  >
                    {!collapsed && item.badge}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Collapse/Expand Toggle Footer */}
      <div className="p-3 border-t border-[#2B2F38] bg-[#101114]/95">
        <button
          onClick={() => setCollapsed(prev => !prev)}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded hover:bg-white/[0.045] text-[#9BA2AF] hover:text-[#F0F1F3] text-xs transition-colors"
          title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px] font-mono text-[#9298A5]">Свернуть меню</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
