import React, { useState } from 'react';
import {
  RefreshCw,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Zap,
  ShieldCheck,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { RECYCLER_ITEMS } from '../data/rustData';
import { RecyclerItem } from '../types';

interface ComponentInput {
  item: RecyclerItem;
  qty: number;
}

export const RecyclerPage: React.FC = () => {
  const [inputs, setInputs] = useState<ComponentInput[]>([
    { item: RECYCLER_ITEMS.find(i => i.id === 'rec-1') || RECYCLER_ITEMS[0], qty: 12 }, // Gears
    { item: RECYCLER_ITEMS.find(i => i.id === 'rec-2') || RECYCLER_ITEMS[1], qty: 8 },  // Sheet Metal
    { item: RECYCLER_ITEMS.find(i => i.id === 'rec-3') || RECYCLER_ITEMS[2], qty: 6 },  // Metal Pipe
    { item: RECYCLER_ITEMS.find(i => i.id === 'rec-9') || RECYCLER_ITEMS[8], qty: 4 },  // Tech Trash
  ]);

  const [locationMode, setLocationMode] = useState<'safe' | 'monument'>('safe');

  const handleUpdateQty = (itemId: string, qty: number) => {
    const validQty = Math.max(0, qty);
    setInputs(prev =>
      prev.map(i => (i.item.id === itemId ? { ...i, qty: validQty } : i))
    );
  };

  const handleAddItem = (item: RecyclerItem) => {
    setInputs(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.item.id === item.id ? { ...i, qty: i.qty + 5 } : i
        );
      }
      return [...prev, { item, qty: 5 }];
    });
  };

  const handleRemove = (itemId: string) => {
    setInputs(prev => prev.filter(i => i.item.id !== itemId));
  };

  const handleClear = () => {
    setInputs([]);
  };

  // Modern Rust update: Monument recyclers are 20% faster and yield +20% scrap/output!
  const multiplier = locationMode === 'monument' ? 1.2 : 1.0;

  // Calculate totals
  const totalScrap = Math.round(inputs.reduce((sum, i) => sum + i.item.scrap * i.qty, 0) * multiplier);
  const totalHqm = Math.round(inputs.reduce((sum, i) => sum + i.item.hqm * i.qty, 0) * multiplier);
  const totalMetalFrags = Math.round(inputs.reduce((sum, i) => sum + i.item.metalFragments * i.qty, 0) * multiplier);
  const totalCloth = Math.round(inputs.reduce((sum, i) => sum + i.item.cloth * i.qty, 0) * multiplier);
  const totalLeather = Math.round(inputs.reduce((sum, i) => sum + i.item.leather * i.qty, 0) * multiplier);

  return (
    <div className="p-3 space-y-3 max-w-[1500px] mx-auto select-none">
      {/* Header */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#171A21] border border-[#262A36]">
            <RefreshCw className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <div className="font-mono font-bold text-[#E6E8EC] text-sm flex items-center gap-2">
              <span>КАЛЬКУЛЯТОР ПЕРЕРАБОТЧИКА (RECYCLER YIELD)</span>
              <span className="text-[10px] font-mono text-[#00C896] bg-[#00C896]/10 border border-[#00C896]/30 px-2 py-0.5 rounded">
                ТОЧНЫЙ ВЫХОД СКРАПА И МВК
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#9298A5]">
              Быстрый подсчет ресурсов при переработке компонентов и электроники
            </div>
          </div>
        </div>

        {/* Location toggle */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#9298A5] text-[11px]">ЛОКАЦИЯ:</span>
          <button
            onClick={() => setLocationMode('safe')}
            className={`px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 ${
              locationMode === 'safe'
                ? 'bg-[#171A21] border-[#00C896]/60 text-[#00C896] font-bold'
                : 'bg-[#12141A] border-[#262A36] text-[#9298A5] hover:text-[#E6E8EC]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#00C896]" /> Безопасная зона (100%)
          </button>
          <button
            onClick={() => setLocationMode('monument')}
            className={`px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 ${
              locationMode === 'monument'
                ? 'bg-[#171A21] border-[#F97316]/60 text-[#F97316] font-bold'
                : 'bg-[#12141A] border-[#262A36] text-[#9298A5] hover:text-[#E6E8EC]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#F97316]" /> Монумент РТ (+20% бонус)
          </button>
        </div>
      </div>

      {/* Recycler Component Buttons Grid */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 text-xs space-y-2">
        <div className="font-mono font-bold text-[#E6E8EC] flex items-center justify-between pb-1.5 border-b border-[#262A36]">
          <span>КАТАЛОГ КОМПОНЕНТОВ ДЛЯ ПЕРЕРАБОТКИ (КЛИКНИТЕ ДЛЯ ДОБАВЛЕНИЯ)</span>
          {inputs.length > 0 && (
            <button
              onClick={handleClear}
              className="text-[#9298A5] hover:text-[#F04444] text-[11px] font-mono transition-colors"
            >
              Сбросить все
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {RECYCLER_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleAddItem(item)}
              className="p-2 rounded bg-[#171A21] border border-[#262A36] hover:border-[#F97316] text-left transition-colors flex items-center justify-between group"
            >
              <div className="truncate pr-2">
                <div className="font-bold text-[#E6E8EC] group-hover:text-[#F97316] truncate text-[11px] transition-colors">
                  {item.ruName}
                </div>
                <div className="text-[10px] font-mono text-[#9298A5]">
                  {item.scrap > 0 && `${item.scrap} скрапа `}
                  {item.hqm > 0 && `· ${item.hqm} МВК`}
                </div>
              </div>
              <span className="text-[#F97316] font-mono font-bold text-sm shrink-0">+</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Recycler Workbench: Inputs + Yield Output */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left 2 Cols: In-Recycler Slot List */}
        <div className="lg:col-span-2 bg-[#12141A] border border-[#262A36] rounded p-3 text-xs space-y-2">
          <div className="font-mono font-bold text-[#E6E8EC] flex items-center justify-between pb-2 border-b border-[#262A36]">
            <span>ЗАГРУЖЕНО В ПЕРЕРАБОТЧИК ({inputs.length} ПОЗИЦИЙ)</span>
            <span className="text-[10px] font-mono text-[#9298A5]">
              Количество компонентов в слотах переработчика
            </span>
          </div>

          {inputs.length === 0 ? (
            <div className="p-8 text-center text-[#9298A5] font-mono text-xs">
              Переработчик пуст. Кликните на компоненты выше для добавления.
            </div>
          ) : (
            <div className="space-y-1.5">
              {inputs.map(item => (
                <div
                  key={item.item.id}
                  className="bg-[#171A21] border border-[#262A36] rounded p-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="truncate">
                    <span className="font-bold text-[#E6E8EC]">{item.item.ruName}</span>
                    <div className="text-[10px] font-mono text-[#9298A5]">
                      1 шт = {item.item.scrap} скрапа, {item.item.hqm} МВК, {item.item.metalFragments} металла
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Stepper */}
                    <div className="flex items-center gap-1 bg-[#12141A] border border-[#262A36] rounded p-0.5 font-mono">
                      <button
                        onClick={() => handleUpdateQty(item.item.id, item.qty - 1)}
                        className="p-1 hover:bg-[#262A36] rounded text-[#E6E8EC] transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.qty}
                        onChange={e => handleUpdateQty(item.item.id, Number(e.target.value))}
                        className="w-12 text-center bg-transparent text-[#E6E8EC] font-bold tabular-nums focus:outline-none"
                      />
                      <button
                        onClick={() => handleUpdateQty(item.item.id, item.qty + 1)}
                        className="p-1 hover:bg-[#262A36] rounded text-[#E6E8EC] transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item.item.id)}
                      className="p-1 text-[#9298A5] hover:text-[#F04444] rounded transition-colors"
                      title="Удалить слот"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Yield Output Card */}
        <div className="bg-[#12141A] border border-[#262A36] rounded p-4 text-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="font-mono font-bold text-[#E6E8EC] flex items-center justify-between pb-2 border-b border-[#262A36]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F97316]" />
                ИТОГОВЫЙ ВЫХОД РЕСУРСОВ
              </span>
              {locationMode === 'monument' && (
                <span className="text-[10px] font-mono text-[#F97316] font-bold">+20% БОНУС</span>
              )}
            </div>

            {/* Scrap Main Hero */}
            <div className="bg-[#171A21] border border-[#262A36] rounded p-3 text-center my-3">
              <div className="text-[10px] font-mono text-[#9298A5]">ПОЛУЧЕННЫЙ СКРАП (SCRAP)</div>
              <div className="text-3xl font-mono font-bold text-[#F97316] tabular-nums mt-0.5">
                {totalScrap.toLocaleString()} шт
              </div>
            </div>

            {/* Other resources grid */}
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center py-1.5 px-3 rounded bg-[#171A21] border border-[#262A36]">
                <span className="text-[#F5B942] font-bold">МВК (HQM):</span>
                <span className="font-bold text-[#F5B942] tabular-nums text-sm">
                  {totalHqm.toLocaleString()} шт
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 px-3 rounded bg-[#171A21] border border-[#262A36]">
                <span className="text-[#9298A5]">Фрагменты металла:</span>
                <span className="font-bold text-[#E6E8EC] tabular-nums">
                  {totalMetalFrags.toLocaleString()} шт
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 px-3 rounded bg-[#171A21] border border-[#262A36]">
                <span className="text-[#9298A5]">Ткань (Cloth):</span>
                <span className="font-bold text-[#E6E8EC] tabular-nums">
                  {totalCloth.toLocaleString()} шт
                </span>
              </div>

              {totalLeather > 0 && (
                <div className="flex justify-between items-center py-1.5 px-3 rounded bg-[#171A21] border border-[#262A36]">
                  <span className="text-[#9298A5]">Кожа (Leather):</span>
                  <span className="font-bold text-[#E6E8EC] tabular-nums">
                    {totalLeather.toLocaleString()} шт
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 text-[10px] font-mono text-[#9298A5] border-t border-[#262A36] flex justify-between items-center">
            <span>Время переработки:</span>
            <span className="text-[#E6E8EC] font-bold tabular-nums">
              ~{Math.ceil(inputs.reduce((sum, i) => sum + i.qty, 0) * (locationMode === 'monument' ? 3.5 : 5))} сек
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
