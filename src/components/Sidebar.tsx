import React, { useState } from 'react';
import {
  LayoutDashboard,
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
    { id: 'overview', label: 'Обзор', icon: LayoutDashboard, section: 'ОСНОВНОЕ' },
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
      className={`h-[calc(100vh-2.75rem)] bg-[#0D0F12] border-r border-[#262A36] flex flex-col justify-between transition-all duration-200 select-none shrink-0 ${
        collapsed ? 'w-13' : 'w-56'
      }`}
    >
      {/* Navigation List */}
      <div className="py-2 overflow-y-auto overflow-x-hidden flex-1 px-1.5 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showSection = item.section && !collapsed;

          return (
            <React.Fragment key={item.id}>
              {showSection && (
                <div className="px-2 pt-3 pb-1 text-[9px] font-mono tracking-wider text-[#9298A5] font-semibold">
                  {item.section}
                </div>
              )}
              <button
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors relative group ${
                  isActive
                    ? 'bg-[#171A21] text-[#F97316] font-medium border-l-2 border-[#F97316]'
                    : 'text-[#9298A5] hover:text-[#E6E8EC] hover:bg-[#12141A]'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#F97316]' : 'text-[#9298A5] group-hover:text-[#E6E8EC]'
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
      <div className="p-2 border-t border-[#262A36] bg-[#0D0F12]">
        <button
          onClick={() => setCollapsed(prev => !prev)}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded hover:bg-[#12141A] text-[#9298A5] hover:text-[#E6E8EC] text-xs transition-colors"
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
