import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Layers,
  Sparkles,
  Zap,
  Shield,
  Crosshair,
  Package,
} from 'lucide-react';
import { RUST_ITEMS } from '../data/rustData';
import { RustItem } from '../types';

export const ItemDatabasePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Все');
  const [workbenchFilter, setWorkbenchFilter] = useState<number | 'all'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string>(RUST_ITEMS[0]?.id || '');

  const categories = ['Все', 'Оружие', 'Боеприпасы', 'Броня', 'Строительство', 'Инструменты', 'Медикаменты', 'Электрика'];

  const filteredItems = RUST_ITEMS.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ruName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'Все' || item.category === categoryFilter;
    const matchesWorkbench = workbenchFilter === 'all' || item.workbench === workbenchFilter;

    return matchesSearch && matchesCategory && matchesWorkbench;
  });

  const selectedItem = RUST_ITEMS.find(i => i.id === selectedItemId) || filteredItems[0] || RUST_ITEMS[0];

  return (
    <div className="h-[calc(100vh-2.75rem)] flex flex-col md:flex-row overflow-hidden select-none bg-[#0D0F12]">
      {/* Left List of Items */}
      <div className="w-full md:w-[380px] bg-[#12141A] border-r border-[#262A36] flex flex-col justify-between shrink-0">
        <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#E6E8EC]">
            <BookOpen className="w-3.5 h-3.5 text-[#F97316]" />
            <span>СПРАВОЧНИК ПРЕДМЕТОВ RUST ({RUST_ITEMS.length})</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9298A5] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или описанию..."
              className="w-full bg-[#171A21] border border-[#262A36] rounded pl-8 pr-2 py-1.5 text-xs text-[#E6E8EC] placeholder-[#9298A5] focus:outline-none focus:border-[#F97316] transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-1 rounded whitespace-nowrap border transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[#171A21] border-[#F97316] text-[#F97316] font-semibold'
                    : 'bg-[#12141A] border-[#262A36] text-[#9298A5] hover:text-[#E6E8EC]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Workbench Tier Tabs */}
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <span className="text-[#9298A5] mr-1">ВЕРСТАК:</span>
            {[
              { id: 'all', label: 'Все' },
              { id: 0, label: 'Без Т' },
              { id: 1, label: 'Т1' },
              { id: 2, label: 'Т2' },
              { id: 3, label: 'Т3' },
            ].map(wb => (
              <button
                key={wb.id}
                onClick={() => setWorkbenchFilter(wb.id as any)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  workbenchFilter === wb.id
                    ? 'bg-[#171A21] border-[#F97316] text-[#F97316] font-bold'
                    : 'bg-[#12141A] border-[#262A36] text-[#9298A5] hover:text-[#E6E8EC]'
                }`}
              >
                {wb.label}
              </button>
            ))}
          </div>

          {/* Item Cards List */}
          <div className="space-y-1.5 pt-1">
            {filteredItems.map(item => {
              const isSelected = selectedItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`p-2.5 rounded border text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#171A21] border-[#F97316] text-[#E6E8EC]'
                      : 'bg-[#12141A] border-[#262A36] hover:bg-[#171A21] hover:border-[#262A36]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#E6E8EC] truncate">{item.ruName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#171A21] text-[#F97316] font-bold border border-[#262A36]">
                      {item.workbench === 0 ? 'Без верстака' : `Т${item.workbench}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#9298A5]">
                    <span>{item.category}</span>
                    <span className="tabular-nums">Изучение: {item.researchScrap} скрапа</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-[#262A36] bg-[#0D0F12] text-[10px] font-mono text-[#9298A5] flex justify-between">
          <span>БАЗА ДАННЫХ RUST WIKI</span>
          <span className="tabular-nums">НАЙДЕНО: {filteredItems.length}</span>
        </div>
      </div>

      {/* Right Item Detail Dossier */}
      {selectedItem ? (
        <div className="flex-1 bg-[#0D0F12] overflow-y-auto p-4 space-y-4">
          {/* Header */}
          <div className="bg-[#12141A] border border-[#262A36] rounded p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#E6E8EC] font-mono">
                  {selectedItem.ruName}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#171A21] text-[#9298A5] border border-[#262A36]">
                  {selectedItem.name}
                </span>
              </div>
              <div className="text-xs font-mono text-[#9298A5] mt-1.5 flex items-center gap-4">
                <span>Категория: <strong className="text-[#E6E8EC]">{selectedItem.category}</strong></span>
                <span>·</span>
                <span>
                  Уровень верстака:{' '}
                  <strong className="text-[#F97316]">
                    {selectedItem.workbench === 0 ? 'Любой (без Т)' : `Верстак Т${selectedItem.workbench}`}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Изучение:{' '}
                  <strong className="text-[#F5B942] tabular-nums">{selectedItem.researchScrap} скрапа</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#12141A] border border-[#262A36] rounded p-3.5 text-xs space-y-1">
            <div className="font-mono text-[#9298A5] text-[11px] font-semibold">ОПИСАНИЕ И ХАРАКТЕРИСТИКИ:</div>
            <div className="text-[#E6E8EC] text-sm leading-relaxed">
              {selectedItem.description}
            </div>
          </div>

          {/* Crafting Recipe & Recycle Yields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Craft Cost */}
            <div className="bg-[#12141A] border border-[#262A36] rounded p-3.5 text-xs space-y-2">
              <div className="font-mono font-bold text-[#E6E8EC] flex items-center gap-1.5 pb-2 border-b border-[#262A36]">
                <Package className="w-4 h-4 text-[#F97316]" />
                <span>РЕЦЕПТ СОЗДАНИЯ (КРАФТ)</span>
              </div>

              <div className="space-y-1.5 pt-1">
                {selectedItem.craftCost.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-2 px-3 rounded bg-[#171A21] border border-[#262A36] font-mono text-xs"
                  >
                    <span className="text-[#E6E8EC]">{c.item}</span>
                    <span className="font-bold text-[#F97316] tabular-nums">{c.qty} шт</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recycle Yield */}
            <div className="bg-[#12141A] border border-[#262A36] rounded p-3.5 text-xs space-y-2">
              <div className="font-mono font-bold text-[#E6E8EC] flex items-center gap-1.5 pb-2 border-b border-[#262A36]">
                <Sparkles className="w-4 h-4 text-[#00C896]" />
                <span>ПЕРЕРАБОТКА В ПЕРЕРАБОТЧИКЕ</span>
              </div>

              <div className="p-3 rounded bg-[#171A21] border border-[#262A36] text-xs font-mono text-[#E6E8EC] leading-relaxed">
                {selectedItem.recycleYield}
              </div>
              <div className="text-[10px] font-mono text-[#9298A5] pt-1">
                * Разборка предмета в переработчике возвращает до 50% исходных ресурсов
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#9298A5] font-mono text-xs">
          Выберите предмет из списка слева
        </div>
      )}
    </div>
  );
};
