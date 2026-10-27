import React, { useState } from 'react';
import {
  Video,
  Copy,
  Check,
  Eye,
  Plus,
  Search,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { CameraCode } from '../types';

export const CameraCodesPage: React.FC = () => {
  const { allCameras, openCCTV, addCustomCamera } = useCompanion();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [monumentFilter, setMonumentFilter] = useState('Все');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New camera form
  const [newCode, setNewCode] = useState('');
  const [newMonument, setNewMonument] = useState('База (Кастом)');
  const [newDesc, setNewDesc] = useState('');

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateCamera = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    addCustomCamera({
      code: newCode.trim().toUpperCase(),
      monument: newMonument,
      ruMonument: newMonument,
      description: newDesc.trim() || 'Пользовательская камера',
      status: 'active',
      fovType: 'wide',
    });

    setIsAddModalOpen(false);
    setNewCode('');
    setNewDesc('');
  };

  const uniqueMonuments = ['Все', 'Сфера', 'Большая Нефтянка', 'Малая Нефтянка', 'Аэродром', 'Космодром', 'Аванпост', 'Лагерь Бандитов', 'Своя база'];

  const filteredCameras = allCameras.filter(cam => {
    const matchesSearch =
      cam.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.ruMonument.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMonument =
      monumentFilter === 'Все' ||
      cam.ruMonument.toLowerCase().includes(monumentFilter.toLowerCase());

    return matchesSearch && matchesMonument;
  });

  return (
    <div className="p-3 space-y-3 max-w-[1400px] mx-auto select-none">
      {/* Header */}
      <div className="bg-[#12141A] border border-[#262A36] rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#171A21] border border-[#262A36]">
            <Video className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <div className="font-mono font-bold text-[#E6E8EC] text-sm flex items-center gap-2">
              <span>СПРАВОЧНИК CCTV КОДОВ КАМЕР НАБЛЮДЕНИЯ</span>
              <span className="text-[10px] font-mono text-[#00C896] bg-[#10241B] border border-[#00C896]/40 px-2 py-0.5 rounded">
                СИСТЕМА PTZ АКТИВНА
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#9298A5]">
              Введите идентификатор в компьютерный терминал Rust или кликните «Смотреть» для симуляции
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Добавить свою камеру
        </button>
      </div>

      {/* Search & Monument Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#9298A5] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по коду (DOME, OILRIG)..."
            className="w-full bg-[#12141A] border border-[#262A36] rounded pl-8 pr-2 py-1.5 text-xs text-[#E6E8EC] placeholder-[#9298A5] focus:outline-none focus:border-[#F97316]"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono scrollbar-none">
          {uniqueMonuments.map(m => (
            <button
              key={m}
              onClick={() => setMonumentFilter(m)}
              className={`px-2.5 py-1 rounded whitespace-nowrap border transition-colors ${
                monumentFilter === m
                  ? 'bg-[#171A21] border-[#F97316] text-[#F97316] font-medium'
                  : 'bg-[#12141A] border-[#262A36] text-[#9298A5] hover:text-[#E6E8EC]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Cameras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredCameras.map(cam => (
          <div
            key={cam.id}
            className="bg-[#12141A] border border-[#262A36] hover:border-[#383E4E] rounded p-3 text-xs flex flex-col justify-between transition-colors space-y-2.5"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-sm font-bold text-[#E6E8EC] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse" />
                  {cam.code}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    cam.isCustom
                      ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                      : 'bg-[#171A21] text-[#9298A5] border border-[#262A36]'
                  }`}
                >
                  {cam.isCustom ? 'КАСТОМ' : 'МОНУМЕНТ'}
                </span>
              </div>

              <div className="font-medium text-[#E6E8EC]">
                {cam.ruMonument}
              </div>
              <div className="text-[11px] text-[#9298A5] mt-0.5">
                {cam.description}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-[#262A36] flex items-center justify-between gap-2">
              <button
                onClick={() => handleCopyCode(cam.code)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#171A21] hover:bg-[#262A36] text-[#E6E8EC] border border-[#262A36] font-mono text-[11px] transition-colors"
              >
                {copiedCode === cam.code ? (
                  <Check className="w-3 h-3 text-[#00C896]" />
                ) : (
                  <Copy className="w-3 h-3 text-[#9298A5]" />
                )}
                <span>{copiedCode === cam.code ? 'Скопировано' : 'Копировать'}</span>
              </button>

              <button
                onClick={() => openCCTV(cam)}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-[11px] font-medium transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> Смотреть
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Camera Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#12141A] border border-[#262A36] rounded p-4 w-full max-w-sm text-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#262A36]">
              <span className="font-mono font-bold text-[#E6E8EC] text-sm">ДОБАВИТЬ КАМЕРУ CCTV</span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#9298A5] hover:text-[#E6E8EC]">✕</button>
            </div>

            <form onSubmit={handleCreateCamera} className="space-y-2.5">
              <div>
                <label className="block text-[#9298A5] mb-1">Идентификатор камеры (КОД) *</label>
                <input
                  type="text"
                  required
                  placeholder="напр: BASE_MAIN_GATE"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] uppercase font-mono focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-[#9298A5] mb-1">Локация / Название объекта</label>
                <input
                  type="text"
                  placeholder="напр: Наша база G11"
                  value={newMonument}
                  onChange={e => setNewMonument(e.target.value)}
                  className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-[#9298A5] mb-1">Описание сектора обзора</label>
                <input
                  type="text"
                  placeholder="напр: Вид на внешний забор и вертолетную площадку"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#171A21] text-[#9298A5] hover:bg-[#262A36] hover:text-[#E6E8EC]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-medium"
                >
                  Сохранить код
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
