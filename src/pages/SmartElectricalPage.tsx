import React, { useState } from 'react';
import {
  Zap,
  Power,
  Shield,
  Bell,
  Battery,
  Sliders,
  Plus,
  Lightbulb,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { SmartDevice } from '../types';

export const SmartElectricalPage: React.FC = () => {
  const {
    smartDevices,
    toggleSmartDevice,
    setGroupState,
    applyPreset,
    addSmartDevice,
    isSimulatedMode,
  } = useCompanion();

  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('Все');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activePresetNotice, setActivePresetNotice] = useState<string | null>(null);

  // Form states for new device
  const [newDevName, setNewDevName] = useState('');
  const [newDevType, setNewDevType] = useState<SmartDevice['type']>('switch');
  const [newDevGroup, setNewDevGroup] = useState<SmartDevice['group']>('Главная база');
  const [newDevPower, setNewDevPower] = useState(5);

  const groups: SmartDevice['group'][] = [
    'Главная база',
    'Внешний периметр',
    'ПВО / Крыша',
    'Ферма',
    'Ловушки',
  ];

  const handleApplyPreset = (preset: 'raid_alarm' | 'night_saver' | 'base_lockdown' | 'farming', title: string) => {
    applyPreset(preset);
    setActivePresetNotice(`Пресет "${title}" успешно активирован`);
    setTimeout(() => setActivePresetNotice(null), 3000);
  };

  const handleCreateDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName.trim()) return;

    addSmartDevice({
      name: newDevName.trim(),
      type: newDevType,
      group: newDevGroup,
      state: false,
      powerUsage: Number(newDevPower) || 5,
      batteryLevel: newDevType === 'battery' ? 100 : undefined,
      batteryInput: newDevType === 'battery' ? 100 : undefined,
      batteryOutput: newDevType === 'battery' ? 50 : undefined,
      ammoCount: newDevType === 'turret' ? 450 : undefined,
    });

    setIsAddModalOpen(false);
    setNewDevName('');
  };

  const filteredDevices = smartDevices.filter(d => {
    if (selectedGroupFilter === 'Все') return true;
    return d.group === selectedGroupFilter;
  });

  const totalPowerConsumption = smartDevices
    .filter(d => d.state && d.type !== 'battery')
    .reduce((sum, d) => sum + d.powerUsage, 0);

  const mainBattery = smartDevices.find(d => d.type === 'battery');

  return (
    <div className="p-3 space-y-3 max-w-[1600px] mx-auto select-none">
      {/* Toast notice */}
      {activePresetNotice && (
        <div className="bg-[#1D2026] border border-[#FF7417] text-[#F0F1F3] px-3 py-1.5 rounded text-xs font-mono flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#28C995]" />
            {activePresetNotice}
          </span>
          <button onClick={() => setActivePresetNotice(null)} className="text-[#9BA2AF] hover:text-white">✕</button>
        </div>
      )}

      {/* Top Telemetry & Rust+ Protocol Bar */}
      <div className="bg-[#17191E] border border-[#2B2F38] rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-[#1D2026] border border-[#2B2F38]">
            <Zap className="w-5 h-5 text-[#FF7417]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#F0F1F3] text-sm">
                УМНАЯ ЭЛЕКТРИКА БАЗЫ (RUST+ SMART DEVICES)
              </span>
              <span className="text-[10px] font-mono text-[#28C995] bg-[#10241B] border border-[#28C995]/40 px-2 py-0.5 rounded">
                СЕТЬ 240V АКТИВНА
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#9BA2AF] mt-0.5">
              Канал сопряжения устройств: <span className="text-[#F0F1F3]">28082 TCP/WEBSOCKET</span> ·{' '}
              {isSimulatedMode ? (
                <span className="text-[#F5B942]">РЕЖИМ ТЕСТОВОЙ СИМУЛЯЦИИ RUST+</span>
              ) : (
                <span className="text-[#28C995]">LIVE RUST+ FEED</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="bg-[#1D2026] px-3 py-1.5 rounded border border-[#2B2F38]">
            <span className="text-[#9BA2AF]">ОБЩАЯ НАГРУЗКА: </span>
            <span className="text-[#FF7417] font-bold tabular-nums">{totalPowerConsumption} W</span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#FF7417] hover:bg-[#E85D12] text-white font-mono text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Подключить устройство
          </button>
        </div>
      </div>

      {/* Main Grid: Battery Monitor + Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Battery Power Bank */}
        {mainBattery && (
          <div className="bg-[#17191E] border border-[#2B2F38] rounded p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2B2F38]">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#F0F1F3]">
                  <Battery className="w-4 h-4 text-[#28C995]" />
                  <span>ГЛАВНЫЙ АККУМУЛЯТОР (LARGE BATTERY)</span>
                </div>
                <span className="font-mono text-[#28C995] font-bold text-xs">
                  {mainBattery.batteryLevel}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-[#1D2026] rounded-full overflow-hidden mb-3 border border-[#2B2F38]">
                <div
                  className="h-full bg-[#28C995] rounded-full transition-all duration-300"
                  style={{ width: `${mainBattery.batteryLevel}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-[#1D2026] p-2 rounded border border-[#2B2F38]">
                  <div className="text-[10px] text-[#9BA2AF]">ГЕНЕРАЦИЯ (ВХОД)</div>
                  <div className="text-[#28C995] font-bold">+{mainBattery.batteryInput} W (Wind)</div>
                </div>
                <div className="bg-[#1D2026] p-2 rounded border border-[#2B2F38]">
                  <div className="text-[10px] text-[#9BA2AF]">НАГРУЗКА (ВЫХОД)</div>
                  <div className="text-[#F5B942] font-bold">-{mainBattery.batteryOutput} W</div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10px] font-mono text-[#9BA2AF] flex justify-between border-t border-[#2B2F38] mt-3">
              <span>РЕЗЕРВ АВТОНОМНОСТИ: ~18 ЧАСОВ</span>
              <span className="text-[#28C995]">ЗАРЯДКА: ПОЛНАЯ</span>
            </div>
          </div>
        )}

        {/* Tactical Presets */}
        <div className="lg:col-span-2 bg-[#17191E] border border-[#2B2F38] rounded p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#2B2F38]">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#F0F1F3]">
                <Sliders className="w-4 h-4 text-[#FF7417]" />
                <span>ТАКТИЧЕСКИЕ ПРЕСЕТЫ ЭЛЕКТРИКИ (1-CLICK)</span>
              </div>
              <span className="text-[10px] font-mono text-[#9BA2AF]">АВТО-ПЕРЕКЛЮЧЕНИЕ</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleApplyPreset('raid_alarm', 'Тревога рейда')}
                className="p-2.5 rounded bg-[#1F1517] hover:bg-[#2B171A] border border-[#F04444]/60 text-left transition-colors group"
              >
                <div className="font-bold font-mono text-xs text-[#F04444] group-hover:text-red-300">
                  ТРЕВОГА РЕЙДА
                </div>
                <div className="text-[10px] text-[#9BA2AF] mt-1">
                  Турели + ПВО + сирена
                </div>
              </button>

              <button
                onClick={() => handleApplyPreset('night_saver', 'Ночной свет')}
                className="p-2.5 rounded bg-[#221B12] hover:bg-[#2D2316] border border-[#F5B942]/60 text-left transition-colors group"
              >
                <div className="font-bold font-mono text-xs text-[#F5B942] group-hover:text-amber-300">
                  НОЧНОЙ СВЕТ
                </div>
                <div className="text-[10px] text-[#9BA2AF] mt-1">
                  Свет ВКЛ, ферма ВЫКЛ
                </div>
              </button>

              <button
                onClick={() => handleApplyPreset('base_lockdown', 'Локдаун')}
                className="p-2.5 rounded bg-[#141A24] hover:bg-[#1A2333] border border-blue-900/60 text-left transition-colors group"
              >
                <div className="font-bold font-mono text-xs text-blue-400 group-hover:text-blue-300">
                  ЛОКДАУН
                </div>
                <div className="text-[10px] text-[#9BA2AF] mt-1">
                  Все выключатели ВКЛ
                </div>
              </button>

              <button
                onClick={() => handleApplyPreset('farming', 'Ферма ягод')}
                className="p-2.5 rounded bg-[#10241B] hover:bg-[#153124] border border-[#28C995]/60 text-left transition-colors group"
              >
                <div className="font-bold font-mono text-xs text-[#28C995] group-hover:text-emerald-300">
                  ФЕРМА ЯГОД
                </div>
                <div className="text-[10px] text-[#9BA2AF] mt-1">
                  Насосы + фитолампы ВКЛ
                </div>
              </button>
            </div>
          </div>

          <div className="pt-2 text-[10px] font-mono text-[#9BA2AF] flex justify-between border-t border-[#2B2F38] mt-3">
            <span>СИНХРОНИЗАЦИЯ RUST+: МГНОВЕННО</span>
            <span className="text-[#28C995]">СТАТУС ПЕРЕДАТЧИКА: АКТИВЕН</span>
          </div>
        </div>
      </div>

      {/* Group Filter Tabs & Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          <span className="text-[#9BA2AF] text-[11px] mr-1">ГРУППА:</span>
          {['Все', ...groups].map(grp => (
            <button
              key={grp}
              onClick={() => setSelectedGroupFilter(grp)}
              className={`px-2.5 py-1 rounded border transition-colors ${
                selectedGroupFilter === grp
                  ? 'bg-[#1D2026] border-[#FF7417] text-[#FF7417] font-medium'
                  : 'bg-[#17191E] border-[#2B2F38] text-[#9BA2AF] hover:text-[#F0F1F3]'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>

        {selectedGroupFilter !== 'Все' && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setGroupState(selectedGroupFilter, true)}
              className="px-2.5 py-1 rounded bg-[#10241B] hover:bg-[#153124] text-[#28C995] border border-[#28C995]/40"
            >
              Включить группу
            </button>
            <button
              onClick={() => setGroupState(selectedGroupFilter, false)}
              className="px-2.5 py-1 rounded bg-[#261416] hover:bg-[#341A1D] text-[#F04444] border border-[#F04444]/40"
            >
              Выключить группу
            </button>
          </div>
        )}
      </div>

      {/* Interactive Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredDevices.map(dev => {
          const isTurret = dev.type === 'turret';
          const isAlarm = dev.type === 'alarm';
          const isCounter = dev.type === 'counter';

          return (
            <div
              key={dev.id}
              className={`p-3 rounded border transition-all ${
                dev.state
                  ? 'bg-[#1D2026] border-[#2B2F38]'
                  : 'bg-[#17191E] border-[#2B2F38] opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 truncate">
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center ${
                      dev.state
                        ? 'bg-[#FF7417]/20 text-[#FF7417]'
                        : 'bg-[#1D2026] text-[#9BA2AF]'
                    }`}
                  >
                    {isTurret ? (
                      <Shield className="w-4 h-4" />
                    ) : isAlarm ? (
                      <Bell className="w-4 h-4" />
                    ) : isCounter ? (
                      <Cpu className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-xs text-[#F0F1F3] truncate">
                      {dev.name}
                    </div>
                    <div className="text-[10px] font-mono text-[#9BA2AF]">
                      {dev.group} · {dev.powerUsage}W
                    </div>
                  </div>
                </div>

                {/* Main Toggle Switch */}
                <button
                  onClick={() => toggleSmartDevice(dev.id)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                    dev.state ? 'bg-[#FF7417]' : 'bg-[#2B2F38]'
                  }`}
                  title={dev.state ? 'Выключить' : 'Включить'}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      dev.state ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Status Details */}
              <div className="pt-2 border-t border-[#2B2F38] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#9BA2AF]">
                  СТАТУС:{' '}
                  <strong className={dev.state ? 'text-[#28C995]' : 'text-[#9BA2AF]'}>
                    {dev.state ? 'ВКЛЮЧЕНО' : 'ОТКЛЮЧЕНО'}
                  </strong>
                </span>

                {isTurret && dev.ammoCount !== undefined && (
                  <span className="text-[#F0F1F3]">Патроны: {dev.ammoCount} шт</span>
                )}
                {isCounter && dev.counterValue !== undefined && (
                  <span className="text-[#F5B942]">Счет: {dev.counterValue}</span>
                )}
                {dev.lastTriggered && (
                  <span className="text-[#9BA2AF]">{dev.lastTriggered}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Device Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#17191E] border border-[#2B2F38] rounded p-4 w-full max-w-sm text-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#2B2F38]">
              <span className="font-mono font-bold text-[#F0F1F3] text-sm">ПОДКЛЮЧИТЬ УСТРОЙСТВО RUST+</span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#9BA2AF] hover:text-[#F0F1F3]">✕</button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-2.5">
              <div>
                <label className="block text-[#9BA2AF] mb-1">Название устройства</label>
                <input
                  type="text"
                  required
                  placeholder="напр: Освещение двора / ПВО #2"
                  value={newDevName}
                  onChange={e => setNewDevName(e.target.value)}
                  className="w-full bg-[#1D2026] border border-[#2B2F38] rounded p-2 text-[#F0F1F3] focus:outline-none focus:border-[#FF7417]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#9BA2AF] mb-1">Тип устройства</label>
                  <select
                    value={newDevType}
                    onChange={e => setNewDevType(e.target.value as any)}
                    className="w-full bg-[#1D2026] border border-[#2B2F38] rounded p-2 text-[#F0F1F3] focus:outline-none focus:border-[#FF7417]"
                  >
                    <option value="switch">Переключатель (Smart Switch)</option>
                    <option value="alarm">Сигнализация (Smart Alarm)</option>
                    <option value="battery">Аккумулятор (Battery)</option>
                    <option value="turret">Авто-турель (Turret)</option>
                    <option value="counter">Счетчик (Storage Counter)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#9BA2AF] mb-1">Группа</label>
                  <select
                    value={newDevGroup}
                    onChange={e => setNewDevGroup(e.target.value as any)}
                    className="w-full bg-[#1D2026] border border-[#2B2F38] rounded p-2 text-[#F0F1F3] focus:outline-none focus:border-[#FF7417]"
                  >
                    {groups.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#9BA2AF] mb-1">Потребление энергии (Ватт)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newDevPower}
                  onChange={e => setNewDevPower(Number(e.target.value))}
                  className="w-full bg-[#1D2026] border border-[#2B2F38] rounded p-2 text-[#F0F1F3] font-mono focus:outline-none focus:border-[#FF7417]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#1D2026] text-[#9BA2AF] hover:bg-[#2B2F38] hover:text-[#F0F1F3]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#FF7417] hover:bg-[#E85D12] text-white font-medium"
                >
                  Сопряжение
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
