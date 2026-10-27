import React, { useState } from 'react';
import {
  Bomb,
  Plus,
  Minus,
  Trash2,
  Layers,
  Calculator,
} from 'lucide-react';
import { RAID_TARGETS } from '../data/rustData';
import { RaidTarget } from '../types';

interface PlannedTarget {
  target: RaidTarget;
  quantity: number;
}

export const RaidCalculatorPage: React.FC = () => {
  const [plannedTargets, setPlannedTargets] = useState<PlannedTarget[]>([
    { target: RAID_TARGETS.find(t => t.id === 'garage-door') || RAID_TARGETS[2], quantity: 2 },
    { target: RAID_TARGETS.find(t => t.id === 'sheet-door') || RAID_TARGETS[1], quantity: 3 },
  ]);

  const [preferredMethod, setPreferredMethod] = useState<'rockets' | 'c4' | 'satchels' | 'exploAmmo' | 'optimal'>('optimal');

  const handleAddTarget = (target: RaidTarget) => {
    setPlannedTargets(prev => {
      const existing = prev.find(p => p.target.id === target.id);
      if (existing) {
        return prev.map(p =>
          p.target.id === target.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { target, quantity: 1 }];
    });
  };

  const handleUpdateQty = (targetId: string, delta: number) => {
    setPlannedTargets(prev =>
      prev
        .map(p => {
          if (p.target.id === targetId) {
            const newQty = p.quantity + delta;
            return newQty > 0 ? { ...p, quantity: newQty } : null;
          }
          return p;
        })
        .filter(Boolean) as PlannedTarget[]
    );
  };

  const handleRemove = (targetId: string) => {
    setPlannedTargets(prev => prev.filter(p => p.target.id !== targetId));
  };

  const handleClear = () => {
    setPlannedTargets([]);
  };

  // Calculations
  const totalRockets = plannedTargets.reduce((sum, p) => sum + p.target.rockets * p.quantity, 0);
  const totalC4 = plannedTargets.reduce((sum, p) => sum + p.target.c4 * p.quantity, 0);
  const totalSatchels = plannedTargets.reduce((sum, p) => sum + p.target.satchels * p.quantity, 0);
  const totalExploAmmo = plannedTargets.reduce((sum, p) => sum + p.target.exploAmmo * p.quantity, 0);
  const totalOptimalSulfur = plannedTargets.reduce((sum, p) => sum + p.target.sulfurOptimal * p.quantity, 0);

  let calculatedSulfur = totalOptimalSulfur;
  let calculatedCharcoal = Math.round(totalOptimalSulfur * 1.45);
  let calculatedGunpowder = Math.round(totalOptimalSulfur / 2);
  let calculatedPipes = 0;
  let calculatedTechTrash = 0;

  if (preferredMethod === 'rockets') {
    calculatedSulfur = totalRockets * 1400;
    calculatedCharcoal = totalRockets * 1950;
    calculatedGunpowder = totalRockets * 650;
    calculatedPipes = totalRockets * 2;
  } else if (preferredMethod === 'c4') {
    calculatedSulfur = totalC4 * 2200;
    calculatedCharcoal = totalC4 * 3000;
    calculatedGunpowder = totalC4 * 1000;
    calculatedTechTrash = totalC4 * 2;
  } else if (preferredMethod === 'satchels') {
    calculatedSulfur = totalSatchels * 480;
    calculatedCharcoal = totalSatchels * 720;
    calculatedGunpowder = totalSatchels * 240;
  } else if (preferredMethod === 'exploAmmo') {
    calculatedSulfur = totalExploAmmo * 25;
    calculatedCharcoal = totalExploAmmo * 35;
    calculatedGunpowder = totalExploAmmo * 12;
  }

  return (
    <div className="p-3 space-y-3 max-w-[1500px] mx-auto select-none">
      {/* Header */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#171A21] border border-[#262A36]">
            <Bomb className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <div className="font-mono font-bold text-[#E6E8EC] text-sm flex items-center gap-2">
              <span>КАЛЬКУЛЯТОР РЕЙДОВ И ВЗРЫВЧАТКИ (RAID DAMAGE)</span>
              <span className="text-[10px] font-mono text-[#F04444] bg-[#261416] border border-[#F04444]/40 px-2 py-0.5 rounded">
                АКТУАЛЬНЫЕ ХАРАКТЕРИСТИКИ RUST
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#9298A5]">
              Расчет ракет, C4, сатчелей, разрывных патронов и суммарного расхода серы и угля
            </div>
          </div>
        </div>

        {plannedTargets.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#171A21] hover:bg-[#262A36] text-[#9298A5] hover:text-[#F04444] font-mono text-xs transition-colors border border-[#262A36]"
          >
            <Trash2 className="w-3.5 h-3.5" /> Очистить список рейдов
          </button>
        )}
      </div>

      {/* Target Selector Grid */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 text-xs space-y-2">
        <div className="font-mono font-bold text-[#E6E8EC] flex items-center gap-1.5 pb-1.5 border-b border-[#262A36]">
          <Layers className="w-3.5 h-3.5 text-[#F97316]" />
          <span>КАТАЛОГ ПОСТРОЕК И ДВЕРЕЙ (НАЖМИТЕ ЧТОБЫ ДОБАВИТЬ В ПЛАН РЕЙДА)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {RAID_TARGETS.map(target => (
            <button
              key={target.id}
              onClick={() => handleAddTarget(target)}
              className="p-2 rounded bg-[#171A21] border border-[#262A36] hover:border-[#F97316] text-left transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#9298A5] mb-1">
                  <span>{target.category}</span>
                  <span className="text-[#E6E8EC] font-bold">{target.hp} HP</span>
                </div>
                <div className="font-bold text-[#E6E8EC] group-hover:text-[#F97316] truncate text-[11px]">
                  {target.ruName}
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-[#262A36] flex items-center justify-between font-mono text-[10px] text-[#9298A5]">
                <span>{target.rockets} рак. / {target.c4} C4</span>
                <span className="text-[#F97316] font-bold">+</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Planned Targets + Total Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Planned Targets List (2 cols) */}
        <div className="lg:col-span-2 bg-[#12141A] border border-[#262A36] rounded p-3 text-xs space-y-2">
          <div className="font-mono font-bold text-[#E6E8EC] flex items-center justify-between pb-2 border-b border-[#262A36]">
            <span>ВЫБРАННЫЕ ЦЕЛИ ДЛЯ ПРОБИТИЯ ({plannedTargets.length})</span>
            <span className="text-[10px] font-mono text-[#9298A5]">
              Количество дверей и стен на пути к шкафу (TC)
            </span>
          </div>

          {plannedTargets.length === 0 ? (
            <div className="p-8 text-center text-[#9298A5] font-mono text-xs">
              Список пуст. Выберите цели из каталога выше.
            </div>
          ) : (
            <div className="space-y-1.5">
              {plannedTargets.map(item => (
                <div
                  key={item.target.id}
                  className="bg-[#171A21] border border-[#262A36] rounded p-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-[#E6E8EC] flex items-center gap-2">
                      <span>{item.target.ruName}</span>
                      <span className="text-[10px] font-mono text-[#9298A5]">
                        ({item.target.hp} HP)
                      </span>
                    </div>
                    <div className="text-[11px] text-[#9298A5] font-mono mt-0.5">
                      Оптимально: <span className="text-[#F5B942]">{item.target.optimalMethod}</span>
                    </div>
                  </div>

                  {/* Qty and Quick Details */}
                  <div className="flex items-center gap-4 shrink-0 font-mono">
                    <div className="text-right text-[11px]">
                      <div className="text-[#E6E8EC]">
                        {item.target.rockets * item.quantity} рак. | {item.target.c4 * item.quantity} C4
                      </div>
                      <div className="text-[10px] text-[#9298A5]">
                        ~{item.target.sulfurOptimal * item.quantity} серы
                      </div>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-1 bg-[#12141A] border border-[#262A36] rounded p-0.5">
                      <button
                        onClick={() => handleUpdateQty(item.target.id, -1)}
                        className="p-1 hover:bg-[#262A36] rounded text-[#E6E8EC]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-white tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.target.id, 1)}
                        className="p-1 hover:bg-[#262A36] rounded text-[#E6E8EC]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item.target.id)}
                      className="p-1 text-[#9298A5] hover:text-[#F04444] rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total Cost & Material Calculator (1 col) */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-3.5 text-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="font-mono font-bold text-[#E6E8EC] flex items-center justify-between pb-2 border-b border-[#262A36]">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#F97316]" />
                ИТОГОВЫЙ РАСХОД ВЗРЫВЧАТКИ
              </span>
            </div>

            {/* Raiding Method Picker */}
            <div className="pt-2 pb-1">
              <label className="block text-[10px] font-mono text-[#9298A5] mb-1">
                ПРЕДПОЧТИТЕЛЬНЫЙ СПОСОБ:
              </label>
              <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                {[
                  { id: 'optimal', label: 'Оптимальный' },
                  { id: 'rockets', label: 'Ракеты (Сплеш)' },
                  { id: 'c4', label: 'Таймер C4' },
                  { id: 'satchels', label: 'Сатчели' },
                  { id: 'exploAmmo', label: 'Разрывные' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPreferredMethod(m.id as any)}
                    className={`px-2 py-1 rounded text-left border transition-colors ${
                      preferredMethod === m.id
                        ? 'bg-[#171A21] border-[#F97316] text-[#F97316] font-bold'
                        : 'bg-[#12141A] border-[#262A36] text-[#9298A5]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Explosive Units Summary */}
            <div className="grid grid-cols-2 gap-2 my-3 font-mono">
              <div className="bg-[#171A21] border border-[#262A36] rounded p-2 text-center">
                <div className="text-[10px] text-[#9298A5]">РАКЕТЫ</div>
                <div className="text-base font-bold text-[#F97316] tabular-nums">{totalRockets} шт</div>
              </div>
              <div className="bg-[#171A21] border border-[#262A36] rounded p-2 text-center">
                <div className="text-[10px] text-[#9298A5]">ЗАРЯДЫ C4</div>
                <div className="text-base font-bold text-[#F04444] tabular-nums">{totalC4} шт</div>
              </div>
              <div className="bg-[#171A21] border border-[#262A36] rounded p-2 text-center">
                <div className="text-[10px] text-[#9298A5]">САТЧЕЛИ</div>
                <div className="text-sm font-bold text-[#F5B942] tabular-nums">{totalSatchels} шт</div>
              </div>
              <div className="bg-[#171A21] border border-[#262A36] rounded p-2 text-center">
                <div className="text-[10px] text-[#9298A5]">РАЗРЫВНЫЕ ПАТРОНЫ</div>
                <div className="text-sm font-bold text-[#E6E8EC] tabular-nums">{totalExploAmmo} шт</div>
              </div>
            </div>

            {/* Raw Resource Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-[#262A36] font-mono text-xs">
              <div className="flex justify-between items-center py-1.5 bg-[#171A21] px-2.5 rounded border border-[#262A36]">
                <span className="text-[#F5B942] font-bold">СЫРАЯ СЕРА (SULFUR):</span>
                <span className="font-bold text-[#F5B942] tabular-nums text-sm">
                  {calculatedSulfur.toLocaleString()} шт
                </span>
              </div>

              <div className="flex justify-between items-center py-1 px-2 text-[#9298A5]">
                <span>Древесный уголь (Charcoal):</span>
                <span className="text-[#E6E8EC] tabular-nums">{calculatedCharcoal.toLocaleString()} шт</span>
              </div>

              <div className="flex justify-between items-center py-1 px-2 text-[#9298A5]">
                <span>Порох (Gunpowder):</span>
                <span className="text-[#E6E8EC] tabular-nums">{calculatedGunpowder.toLocaleString()} шт</span>
              </div>

              {calculatedPipes > 0 && (
                <div className="flex justify-between items-center py-1 px-2 text-[#9298A5]">
                  <span>Металлические трубы:</span>
                  <span className="text-[#E6E8EC] tabular-nums">{calculatedPipes} шт</span>
                </div>
              )}

              {calculatedTechTrash > 0 && (
                <div className="flex justify-between items-center py-1 px-2 text-[#9298A5]">
                  <span>Tech Trash:</span>
                  <span className="text-[#E6E8EC] tabular-nums">{calculatedTechTrash} шт</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 text-[10px] font-mono text-[#9298A5] border-t border-[#262A36] text-center">
            * Сплеш-урон ракеты пробивает до 4 соседних блоков базы
          </div>
        </div>
      </div>
    </div>
  );
};
