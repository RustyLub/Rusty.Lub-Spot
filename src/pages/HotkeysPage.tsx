import React, { useState } from 'react';
import {
  Keyboard,
  Copy,
  Check,
  Sparkles,
  Terminal,
  HelpCircle,
  Sliders,
  Play,
} from 'lucide-react';
import { CONSOLE_BINDS } from '../data/rustData';
import { ConsoleBind } from '../types';

export const HotkeysPage: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');

  // Custom bind builder states
  const [builderKey, setBuilderKey] = useState('q');
  const [builderAction, setBuilderAction] = useState('forward;sprint');
  const [copiedBuilder, setCopiedBuilder] = useState(false);

  const categories = ['Все', 'Движение', 'Бой', 'Интерфейс', 'Крафт', 'Чат & Звук'];

  const handleCopyCommand = (id: string, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCustomBind = () => {
    const finalCmd = `bind ${builderKey} ${builderAction}`;
    navigator.clipboard.writeText(finalCmd);
    setCopiedBuilder(true);
    setTimeout(() => setCopiedBuilder(false), 2000);
  };

  const filteredBinds = CONSOLE_BINDS.filter(
    b => selectedCategory === 'Все' || b.category === selectedCategory
  );

  return (
    <div className="p-3 space-y-3 max-w-[1400px] mx-auto select-none">
      {/* Header */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#171A21] border border-[#262A36]">
            <Keyboard className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <div className="font-mono font-bold text-[#E6E8EC] text-sm flex items-center gap-2">
              <span>ГЕНЕРАТОР БИНДОВ И ГОРЯЧИХ КЛАВИШ (F1 CONSOLE BINDS)</span>
              <span className="text-[10px] font-mono text-[#00C896] bg-[#00C896]/10 border border-[#00C896]/30 px-2 py-0.5 rounded">
                СИНТАКСИС RUST CLIENT
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#9298A5]">
              Скопируйте команду и вставьте в консоль игры (клавиша F1)
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Custom Bind Generator Panel */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-4 text-xs space-y-3">
        <div className="font-mono font-bold text-[#E6E8EC] flex items-center gap-2 pb-2 border-b border-[#262A36]">
          <Terminal className="w-4 h-4 text-[#F97316]" />
          <span>КОНСТРУКТОР КАСТОМНОГО БИНДА ДЛЯ RUST F1</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-mono text-[11px] text-[#9298A5] mb-1">
              КЛАВИША (KEY):
            </label>
            <select
              value={builderKey}
              onChange={e => setBuilderKey(e.target.value)}
              className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316] transition-colors"
            >
              <option value="q">Q (Удобно для авто-бега)</option>
              <option value="z">Z (Авто-фарм / присед)</option>
              <option value="c">C (Комбатлог или присед)</option>
              <option value="v">V (Голос / Рация)</option>
              <option value="b">B (Крафт бинтов)</option>
              <option value="x">X (Фонарик / лазер)</option>
              <option value="mouse3">Mouse 3 (Колесико мыши)</option>
              <option value="mouse4">Mouse 4 (Боковая кнопка 1)</option>
              <option value="mouse5">Mouse 5 (Боковая кнопка 2)</option>
              <option value="f7">F7 (Консоль комбатлога)</option>
              <option value="f8">F8 (Быстрый суицид)</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[11px] text-[#9298A5] mb-1">
              ДЕЙСТВИЕ / КОМАНДА:
            </label>
            <select
              value={builderAction}
              onChange={e => setBuilderAction(e.target.value)}
              className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono text-xs focus:outline-none focus:border-[#F97316] transition-colors"
            >
              <option value="forward;sprint">Авто-бег (forward;sprint)</option>
              <option value="+attack;+duck">Авто-удар + Присед (+attack;+duck)</option>
              <option value="+attack2;+graphics.fov 70;graphics.fov 90">Зум при прицеле (FOV 70/90)</option>
              <option value="craft.add -2072273936 1">Быстрый крафт 1 бинта</option>
              <option value='"consoletoggle;combatlog"'>Открыть боевой лог (combatlog)</option>
              <option value="+hoverloot">Быстрый сбор лута (+hoverloot)</option>
              <option value="kill">Мгновенный суицид (kill)</option>
              <option value="audio.master 0;audio.master 1">Глушение звуков вертолета</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={handleCopyCustomBind}
              className="w-full py-2 px-3 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-xs flex items-center justify-center gap-2 transition-colors font-bold"
            >
              {copiedBuilder ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
              {copiedBuilder ? 'СКОПИРОВАНО В БУФЕР!' : 'Скопировать бинд в буфер'}
            </button>
          </div>
        </div>

        {/* Live Command Preview Box */}
        <div className="bg-[#171A21] border border-[#262A36] rounded p-2.5 font-mono text-xs flex items-center justify-between text-[#00C896]">
          <span className="font-semibold">{`bind ${builderKey} ${builderAction}`}</span>
          <span className="text-[10px] text-[#9298A5] font-sans">
            Вставьте в F1 в клиенте Rust
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 text-xs font-mono">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded border transition-colors ${
              selectedCategory === cat
                ? 'bg-[#171A21] border-[#F97316] text-[#F97316] font-medium'
                : 'bg-[#12141A] border-[#262A36] text-[#9298A5] hover:text-[#E6E8EC]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Binds Cheatsheet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {filteredBinds.map(b => (
          <div
            key={b.id}
            className="bg-[#12141A] border border-[#262A36] rounded p-3 text-xs flex flex-col justify-between space-y-2.5"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#E6E8EC] text-[13px]">{b.title}</span>
                <span className="px-2 py-0.5 rounded bg-[#171A21] text-[#F97316] font-mono text-[11px] font-bold border border-[#262A36]">
                  КЛАВИША: {b.recommendedKey}
                </span>
              </div>
              <div className="text-[11px] text-[#9298A5] leading-relaxed">
                {b.description}
              </div>
            </div>

            <div className="pt-2 border-t border-[#262A36] flex items-center justify-between gap-2">
              <code className="bg-[#171A21] px-2 py-1 rounded text-[#00C896] font-mono text-[11px] truncate flex-1 border border-[#262A36]">
                {b.command}
              </code>
              <button
                onClick={() => handleCopyCommand(b.id, b.command)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#171A21] hover:bg-[#262A36] text-[#E6E8EC] border border-[#262A36] font-mono text-[11px] transition-colors shrink-0"
              >
                {copiedId === b.id ? (
                  <Check className="w-3.5 h-3.5 text-[#00C896]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#9298A5]" />
                )}
                <span>{copiedId === b.id ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions card */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 text-xs font-mono text-[#9298A5] flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
        <div>
          <div className="text-[#E6E8EC] font-bold mb-0.5">Как активировать бинд в Rust:</div>
          <div>1. Войдите в игру Rust и нажмите клавишу <strong className="text-white">F1</strong> (откроется консоль клиента).</div>
          <div>2. Нажмите сочетание клавиш <strong className="text-white">Ctrl + V</strong> и нажмите <strong className="text-white">Enter</strong>.</div>
          <div>3. Чтобы сохранить бинды навсегда в файл конфигурации, введите в консоль: <strong className="text-[#00C896]">writecfg</strong>.</div>
        </div>
      </div>
    </div>
  );
};
