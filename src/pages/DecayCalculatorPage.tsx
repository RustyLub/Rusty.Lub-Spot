import React, { useState } from 'react';
import {
  Hourglass,
  Clock,
  Shield,
  Layers,
  AlertTriangle,
  RefreshCw,
  Box,
  CheckCircle2,
  Plus,
} from 'lucide-react';

interface ResourceUpkeep {
  wood: number;
  stone: number;
  metal: number;
  hqm: number;
}

export const DecayCalculatorPage: React.FC = () => {
  // Current in TC (Шкаф инструментов)
  const [inTC, setInTC] = useState<ResourceUpkeep>({
    wood: 2500,
    stone: 8400,
    metal: 3200,
    hqm: 95,
  });

  // Daily upkeep consumption (Расход в сутки 24ч)
  const [dailyUpkeep, setDailyUpkeep] = useState<ResourceUpkeep>({
    wood: 600,
    stone: 2400,
    metal: 1100,
    hqm: 28,
  });

  // Presets
  const applyPreset = (preset: 'starter' | 'clan' | 'bunker') => {
    if (preset === 'starter') {
      setDailyUpkeep({ wood: 200, stone: 1200, metal: 300, hqm: 0 });
      setInTC({ wood: 1000, stone: 5000, metal: 1200, hqm: 0 });
    } else if (preset === 'clan') {
      setDailyUpkeep({ wood: 0, stone: 4800, metal: 3600, hqm: 80 });
      setInTC({ wood: 0, stone: 15000, metal: 12000, hqm: 250 });
    } else if (preset === 'bunker') {
      setDailyUpkeep({ wood: 0, stone: 0, metal: 2200, hqm: 65 });
      setInTC({ wood: 0, stone: 0, metal: 8000, hqm: 200 });
    }
  };

  const addResource = (key: keyof ResourceUpkeep, amount: number) => {
    setInTC(prev => ({ ...prev, [key]: Math.max(0, prev[key] + amount) }));
  };

  // Calculate hours remaining for each resource
  const calcHours = (current: number, daily: number) => {
    if (daily <= 0) return 999;
    return (current / daily) * 24;
  };

  const hoursWood = calcHours(inTC.wood, dailyUpkeep.wood);
  const hoursStone = calcHours(inTC.stone, dailyUpkeep.stone);
  const hoursMetal = calcHours(inTC.metal, dailyUpkeep.metal);
  const hoursHqm = calcHours(inTC.hqm, dailyUpkeep.hqm);

  // Minimum bottleneck resource
  const activeHours = [
    dailyUpkeep.wood > 0 ? hoursWood : 999,
    dailyUpkeep.stone > 0 ? hoursStone : 999,
    dailyUpkeep.metal > 0 ? hoursMetal : 999,
    dailyUpkeep.hqm > 0 ? hoursHqm : 999,
  ];

  const minHours = Math.min(...activeHours);
  const totalDays = Math.floor(minHours / 24);
  const remainingHours = Math.floor(minHours % 24);
  const remainingMins = Math.floor((minHours * 60) % 60);

  const formatHoursText = (h: number) => {
    if (h >= 999) return '∞ (нет расхода)';
    const d = Math.floor(h / 24);
    const remH = Math.floor(h % 24);
    if (d > 0) return `${d} дн. ${remH} ч.`;
    return `${remH} ч.`;
  };

  const getDecayStatusColor = (h: number) => {
    if (h >= 48) return 'text-[#28C995]';
    if (h >= 12) return 'text-[#F5B942]';
    return 'text-[#F04444]';
  };

  const resourcesConfig = [
    {
      key: 'wood' as const,
      name: 'Дерево',
      enName: 'Wood',
      step: 500,
      quickAdd: 1000,
      hours: hoursWood,
      color: '#F5B942',
    },
    {
      key: 'stone' as const,
      name: 'Камень',
      enName: 'Stone',
      step: 1000,
      quickAdd: 5000,
      hours: hoursStone,
      color: '#9BA2AF',
    },
    {
      key: 'metal' as const,
      name: 'Фрагменты металла',
      enName: 'Metal Frags',
      step: 500,
      quickAdd: 2000,
      hours: hoursMetal,
      color: '#FF7417',
    },
    {
      key: 'hqm' as const,
      name: 'Высококачественный металл (МВК)',
      enName: 'HQM',
      step: 10,
      quickAdd: 50,
      hours: hoursHqm,
      color: '#E05326',
    },
  ];

  return (
    <div className="p-3 space-y-3 max-w-[1400px] mx-auto select-none">
      {/* Header */}
      <div className="bg-[#17191E] border border-[#2B2F38] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#17191E] border border-[#2B2F38]">
            <Hourglass className="w-5 h-5 text-[#FF7417]" />
          </div>
          <div>
            <div className="font-mono font-bold text-[#F0F1F3] text-sm flex items-center gap-2">
              <span>КАЛЬКУЛЯТОР ГНИЕНИЯ И СОДЕРЖАНИЯ (TOOL CUPBOARD)</span>
              <span className="text-[10px] font-mono text-[#28C995] bg-[#28C995]/10 border border-[#28C995]/30 px-2 py-0.5 rounded">
                СИНХРОНИЗИРОВАНО С ШКАФОМ
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#9BA2AF]">
              Расчет времени содержания базы до начала гниения построек при пустом шкафу
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-[#9BA2AF] mr-1 text-[11px]">ПРЕСЕТ:</span>
          <button
            onClick={() => applyPreset('starter')}
            className="px-2.5 py-1 rounded bg-[#17191E] hover:bg-[#2B2F38] text-[#F0F1F3] border border-[#2B2F38] text-[11px] transition-colors"
          >
            2х2 Стартер
          </button>
          <button
            onClick={() => applyPreset('clan')}
            className="px-2.5 py-1 rounded bg-[#17191E] hover:bg-[#2B2F38] text-[#F0F1F3] border border-[#2B2F38] text-[11px] transition-colors"
          >
            Клановая 3х3
          </button>
          <button
            onClick={() => applyPreset('bunker')}
            className="px-2.5 py-1 rounded bg-[#17191E] hover:bg-[#2B2F38] text-[#F0F1F3] border border-[#2B2F38] text-[11px] transition-colors"
          >
            МВК Бункер
          </button>
        </div>
      </div>

      {/* Main Remaining Time Hero Banner */}
      <div className="bg-[#17191E] border border-[#2B2F38] rounded p-4 text-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[#9BA2AF] text-xs mb-1">
            ВРЕМЯ ДО НАЧАЛА ГНИЕНИЯ (ПО НАИБОЛЕЕ ДЕФИЦИТНОМУ РЕСУРСУ):
          </div>
          <div className={`font-mono text-3xl font-bold tracking-tight ${getDecayStatusColor(minHours)} tabular-nums`}>
            {minHours >= 999 ? '∞ Нет расхода' : (
              <>
                {totalDays > 0 && `${totalDays} дн. `}
                {remainingHours} ч. {remainingMins} мин.
              </>
            )}
          </div>
          <div className="text-[11px] font-mono text-[#9BA2AF] mt-1 flex items-center gap-2">
            <span>Шкаф инструментов защищает постройку от разрушения</span>
            <span>·</span>
            <span className="text-[#F0F1F3]">
              Лимит: {minHours < 24 ? 'Критически мало ресурсов!' : 'База защищена'}
            </span>
          </div>
        </div>

        <div className="bg-[#17191E] p-3 rounded border border-[#2B2F38] font-mono text-xs space-y-1.5">
          <div className="text-[#9BA2AF] text-[10px] font-semibold">ВРЕМЯ ПОЛНОГО РАЗРУШЕНИЯ БЕЗ РЕСУРСОВ:</div>
          <div className="text-[#F0F1F3] text-[11px] grid grid-cols-2 gap-x-5 gap-y-1">
            <span>Солома: <strong className="text-[#F0F1F3]">1 час</strong></span>
            <span>Дерево: <strong className="text-[#F0F1F3]">3 часа</strong></span>
            <span>Камень: <strong className="text-[#F0F1F3]">5 часов</strong></span>
            <span>Металл: <strong className="text-[#F0F1F3]">8 часов</strong></span>
            <span className="col-span-2 text-[#FF7417]">МВК (HQM): <strong>12 часов</strong></span>
          </div>
        </div>
      </div>

      {/* Interactive Inputs & Resource Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Box 1: Resources in TC */}
        <div className="bg-[#17191E] border border-[#2B2F38] rounded p-3.5 space-y-3">
          <div className="font-mono font-bold text-[#F0F1F3] flex items-center justify-between pb-2 border-b border-[#2B2F38]">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-[#FF7417]" />
              <span>ТЕКУЩИЕ РЕСУРСЫ В ШКАФУ (ИНВЕНТАРЬ ТС)</span>
            </div>
            <span className="text-[10px] font-mono text-[#9BA2AF]">24 СЛОТА ШКАФА</span>
          </div>

          <div className="space-y-3">
            {resourcesConfig.map(res => (
              <div key={res.key} className="space-y-1">
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-[#9BA2AF]">{res.name} ({res.enName})</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#F0F1F3] font-bold tabular-nums">
                      {inTC[res.key].toLocaleString()} шт
                    </span>
                    <button
                      onClick={() => addResource(res.key, res.quickAdd)}
                      className="px-1.5 py-0.5 rounded bg-[#17191E] hover:bg-[#2B2F38] text-[#FF7417] border border-[#2B2F38] text-[10px] font-mono flex items-center gap-0.5 transition-colors"
                      title={`Добавить +${res.quickAdd}`}
                    >
                      <Plus className="w-2.5 h-2.5" />
                      {res.quickAdd}
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  step={res.step}
                  value={inTC[res.key]}
                  onChange={e => setInTC({ ...inTC, [res.key]: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-[#17191E] border border-[#2B2F38] rounded p-2 text-[#F0F1F3] font-mono tabular-nums focus:outline-none focus:border-[#FF7417] transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Box 2: Daily Upkeep Rates */}
        <div className="bg-[#17191E] border border-[#2B2F38] rounded p-3.5 space-y-3">
          <div className="font-mono font-bold text-[#F0F1F3] flex items-center justify-between pb-2 border-b border-[#2B2F38]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF7417]" />
              <span>РАСХОД СОДЕРЖАНИЯ В СУТКИ (ЗА 24 ЧАСА)</span>
            </div>
            <span className="text-[10px] font-mono text-[#9BA2AF]">АВТО-ПОДСЧЕТ</span>
          </div>

          <div className="space-y-3">
            {resourcesConfig.map(res => {
              const hours = res.hours;
              return (
                <div key={res.key} className="space-y-1">
                  <div className="flex justify-between items-center font-mono text-[11px]">
                    <span className="text-[#9BA2AF]">{res.name} / сутки</span>
                    <span className={`tabular-nums font-semibold ${hours < 24 ? 'text-[#F04444]' : hours < 48 ? 'text-[#F5B942]' : 'text-[#28C995]'}`}>
                      ~{formatHoursText(hours)} запаса
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step={res.step / 2}
                    value={dailyUpkeep[res.key]}
                    onChange={e => setDailyUpkeep({ ...dailyUpkeep, [res.key]: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-[#17191E] border border-[#2B2F38] rounded p-2 text-[#F0F1F3] font-mono tabular-nums focus:outline-none focus:border-[#FF7417] transition-colors"
                  />
                  {/* Visual Progress Ratio */}
                  <div className="w-full bg-[#101114] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, dailyUpkeep[res.key] > 0 ? (hours / 72) * 100 : 100))}%`,
                        backgroundColor: hours < 24 ? '#F04444' : hours < 48 ? '#F5B942' : '#28C995',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
