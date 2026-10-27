import React, { useState } from 'react';
import {
  Sprout,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';

type GeneType = 'G' | 'Y' | 'H' | 'W' | 'X';

interface PlantClone {
  id: string;
  name: string;
  genes: GeneType[];
}

export const PlantGeneticsPage: React.FC = () => {
  const [targetType, setTargetType] = useState<'4G2Y' | '3G3Y' | '2G4Y'>('4G2Y');

  const [parents, setParents] = useState<PlantClone[]>([
    { id: 'p-1', name: 'Родитель 1 (Клон A)', genes: ['G', 'G', 'Y', 'W', 'H', 'X'] },
    { id: 'p-2', name: 'Родитель 2 (Клон B)', genes: ['G', 'Y', 'Y', 'G', 'W', 'H'] },
    { id: 'p-3', name: 'Родитель 3 (Клон C)', genes: ['Y', 'G', 'G', 'Y', 'H', 'H'] },
  ]);

  const geneTypes: { type: GeneType; label: string; desc: string; color: string; isPositive: boolean }[] = [
    { type: 'G', label: 'Скорость роста (Growth)', desc: 'Ускоряет созревание растения', color: '#00C896', isPositive: true },
    { type: 'Y', label: 'Урожайность (Yield)', desc: 'Увеличивает количество плодов/конопли', color: '#F5B942', isPositive: true },
    { type: 'H', label: 'Выживаемость (Hardiness)', desc: 'Устойчивость к холоду и плохой почве', color: '#06b6d4', isPositive: true },
    { type: 'W', label: 'Расход воды (Water)', desc: 'Требует больше полива водой', color: '#F04444', isPositive: false },
    { type: 'X', label: 'Пустой ген (Empty)', desc: 'Бесполезный ген, замедляет селекцию', color: '#9298A5', isPositive: false },
  ];

  // Crossbreeding Calculation:
  // Red genes (W, X) weight: 1.0
  // Green genes (G, Y, H) weight: 0.6
  const calculateResultingChild = (clones: PlantClone[]): { genes: GeneType[]; stats: string } => {
    if (clones.length < 2) {
      return { genes: ['X', 'X', 'X', 'X', 'X', 'X'], stats: 'Требуется минимум 2 родительских клона' };
    }

    const childGenes: GeneType[] = [];

    for (let slot = 0; slot < 6; slot++) {
      const weights: Record<GeneType, number> = { G: 0, Y: 0, H: 0, W: 0, X: 0 };

      clones.forEach(p => {
        const gene = p.genes[slot];
        if (gene === 'W' || gene === 'X') {
          weights[gene] += 1.0;
        } else {
          weights[gene] += 0.6;
        }
      });

      let bestGene: GeneType = 'X';
      let maxWeight = -1;

      (Object.keys(weights) as GeneType[]).forEach(g => {
        if (weights[g] > maxWeight) {
          maxWeight = weights[g];
          bestGene = g;
        }
      });

      childGenes.push(bestGene);
    }

    const gCount = childGenes.filter(g => g === 'G').length;
    const yCount = childGenes.filter(g => g === 'Y').length;
    const hCount = childGenes.filter(g => g === 'H').length;

    return {
      genes: childGenes,
      stats: `${gCount}G ${yCount}Y ${hCount}H`,
    };
  };

  const handleUpdateGene = (cloneId: string, slotIdx: number, newGene: GeneType) => {
    setParents(prev =>
      prev.map(p => {
        if (p.id === cloneId) {
          const newGenes = [...p.genes];
          newGenes[slotIdx] = newGene;
          return { ...p, genes: newGenes };
        }
        return p;
      })
    );
  };

  const handleAddParent = () => {
    if (parents.length >= 4) return;
    const newId = `p-${Date.now()}`;
    setParents(prev => [
      ...prev,
      {
        id: newId,
        name: `Родитель ${prev.length + 1}`,
        genes: ['G', 'Y', 'G', 'Y', 'H', 'W'],
      },
    ]);
  };

  const handleRemoveParent = (id: string) => {
    if (parents.length <= 2) return;
    setParents(prev => prev.filter(p => p.id !== id));
  };

  const child = calculateResultingChild(parents);

  const getGeneColor = (g: GeneType) => {
    switch (g) {
      case 'G': return 'bg-[#10241B] text-[#00C896] border-[#00C896]/60';
      case 'Y': return 'bg-[#221B12] text-[#F5B942] border-[#F5B942]/60';
      case 'H': return 'bg-cyan-950/60 text-cyan-400 border-cyan-600/60';
      case 'W': return 'bg-[#261416] text-[#F04444] border-[#F04444]/60';
      case 'X': return 'bg-[#171A21] text-[#9298A5] border-[#262A36]';
    }
  };

  return (
    <div className="p-3 space-y-3 max-w-[1400px] mx-auto select-none">
      {/* Header */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#171A21] border border-[#262A36]">
            <Sprout className="w-5 h-5 text-[#00C896]" />
          </div>
          <div>
            <div className="font-mono font-bold text-[#E6E8EC] text-sm flex items-center gap-2">
              <span>КАЛЬКУЛЯТОР ГЕНЕТИКИ И СКРЕЩИВАНИЯ (RUST FARMING)</span>
              <span className="text-[10px] font-mono text-[#00C896] bg-[#10241B] border border-[#00C896]/40 px-2 py-0.5 rounded">
                МЕХАНИКА ВЕСОВ 0.6 / 1.0
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#9298A5]">
              Точный расчет скрещивания рассады в большой грядке для выведения «Идеального клона» (God Clone)
            </div>
          </div>
        </div>

        <button
          onClick={handleAddParent}
          disabled={parents.length >= 4}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-xs disabled:opacity-40 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Добавить родителя ({parents.length}/4)
        </button>
      </div>

      {/* Gene Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {geneTypes.map(g => (
          <div
            key={g.type}
            className="bg-[#12141A] border border-[#262A36] rounded p-2 flex items-center gap-2"
          >
            <div
              className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs border ${getGeneColor(
                g.type
              )}`}
            >
              {g.type}
            </div>
            <div className="truncate">
              <div className="font-bold text-[#E6E8EC] truncate">{g.label}</div>
              <div className="text-[10px] text-[#9298A5] font-mono">
                Вес: {g.isPositive ? '0.6' : '1.0'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Parents Matrix Section */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 space-y-3 text-xs">
        <div className="font-mono font-bold text-[#E6E8EC] flex items-center justify-between pb-2 border-b border-[#262A36]">
          <span>РОДИТЕЛЬСКИЕ КЛОНЫ В ГРЯДКЕ (КЛИКНИТЕ НА ГЕН ДЛЯ СМЕНЫ)</span>
          <span className="text-[11px] text-[#9298A5] font-normal">
            Высаживаются по углам грядки вокруг центрального ростка
          </span>
        </div>

        <div className="space-y-2">
          {parents.map((parent, pIdx) => (
            <div
              key={parent.id}
              className="bg-[#171A21] border border-[#262A36] rounded p-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-[140px]">
                <span className="w-5 h-5 rounded-full bg-[#12141A] border border-[#262A36] flex items-center justify-center font-mono font-bold text-[10px] text-[#E6E8EC]">
                  {pIdx + 1}
                </span>
                <span className="font-medium text-[#E6E8EC]">{parent.name}</span>
              </div>

              {/* 6 Gene Slots */}
              <div className="flex items-center gap-1.5">
                {parent.genes.map((gene, slotIdx) => (
                  <button
                    key={slotIdx}
                    onClick={() => {
                      const cycle: GeneType[] = ['G', 'Y', 'H', 'W', 'X'];
                      const next = cycle[(cycle.indexOf(gene) + 1) % cycle.length];
                      handleUpdateGene(parent.id, slotIdx, next);
                    }}
                    className={`w-9 h-9 rounded flex items-center justify-center font-mono font-bold text-sm border shadow-sm transition-transform hover:scale-105 active:scale-95 ${getGeneColor(
                      gene
                    )}`}
                    title="Кликните для переключения гена"
                  >
                    {gene}
                  </button>
                ))}
              </div>

              {/* Remove button */}
              <div className="w-12 text-right">
                {parents.length > 2 && (
                  <button
                    onClick={() => handleRemoveParent(parent.id)}
                    className="p-1 rounded hover:bg-[#261416] text-[#9298A5] hover:text-[#F04444]"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resulting Child Output Banner */}
      <div className="bg-[#171A21] border-2 border-[#F97316]/60 rounded p-4 text-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#262A36]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F97316]" />
            <span className="font-mono font-bold text-sm text-[#E6E8EC]">
              РЕЗУЛЬТАТ СКРЕЩИВАНИЯ (ЦЕНТРАЛЬНЫЙ РОСТОК):
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-[#00C896] bg-[#10241B] px-2.5 py-1 rounded border border-[#00C896]/40">
            СТАТУС: {child.stats}
          </span>
        </div>

        {/* 6 Child Gene Display */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2">
            {child.genes.map((gene, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-[#9298A5]">Слот {idx + 1}</span>
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center font-mono font-bold text-lg border-2 shadow-lg ${getGeneColor(
                    gene
                  )}`}
                >
                  {gene}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#12141A] p-3 rounded border border-[#262A36] font-mono text-[11px] text-[#E6E8EC] space-y-1">
            <div className="font-bold text-[#E6E8EC]">ОЦЕНКА КАЧЕСТВА:</div>
            <div>
              {child.genes.every(g => g === 'G' || g === 'Y' || g === 'H') ? (
                <span className="text-[#00C896] font-bold">★ ОТЛИЧНЫЙ КЛОН (Без красных генов)</span>
              ) : (
                <span className="text-[#F5B942]">Содержит нежелательные гены (W / X)</span>
              )}
            </div>
            <div className="text-[10px] text-[#9298A5]">
              Рекомендуется срезать клон на стадии «Созревание» (Ripe)
            </div>
          </div>
        </div>
      </div>

      {/* Target Presets: 4G2Y / 3G3Y */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
        <div className="bg-[#12141A] border border-[#262A36] rounded p-3 space-y-1.5">
          <div className="font-bold font-mono text-[#E6E8EC] text-xs">
            4G 2Y — СКОРОСТНОЙ ХАРВЕСТ
          </div>
          <div className="text-[11px] text-[#9298A5]">
            Идеально для конопли (ткань) и ягод для чая. Быстрый рост и хороший сбор.
          </div>
          <div className="text-[10px] font-mono text-[#00C896]">
            Гены: G G G G Y Y
          </div>
        </div>

        <div className="bg-[#12141A] border border-[#262A36] rounded p-3 space-y-1.5">
          <div className="font-bold font-mono text-[#E6E8EC] text-xs">
            3G 3Y — БАЛАНСИРОВАННЫЙ СБОР
          </div>
          <div className="text-[11px] text-[#9298A5]">
            Универсальный сорт для картофеля и тыквы с оптимальным запасом плодов.
          </div>
          <div className="text-[10px] font-mono text-[#F5B942]">
            Гены: G G G Y Y Y
          </div>
        </div>

        <div className="bg-[#12141A] border border-[#262A36] rounded p-3 space-y-1.5">
          <div className="font-bold font-mono text-[#E6E8EC] text-xs">
            2G 4Y — МАКСИМАЛЬНЫЙ УРОЖАЙ
          </div>
          <div className="text-[11px] text-[#9298A5]">
            Для ночного созревания: наибольший выход с куста при длительном росте.
          </div>
          <div className="text-[10px] font-mono text-cyan-400">
            Гены: G G Y Y Y Y
          </div>
        </div>
      </div>
    </div>
  );
};
