import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Plus,
  Trash2,
  Crosshair,
  Search,
  Radio,
  Eye,
  Info,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { MONUMENTS } from '../data/rustData';
import { MapMarker } from '../types';

export const MapPage: React.FC = () => {
  const {
    markers,
    addMarker,
    removeMarker,
    teamMembers,
    openCCTV,
    allCameras,
    isSimulatedMode,
  } = useCompanion();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cursorCoords, setCursorCoords] = useState<{ grid: string; x: number; y: number }>({ grid: 'G11', x: 450, y: 680 });

  // Layers
  const [showGrid, setShowGrid] = useState(true);
  const [showMonuments, setShowMonuments] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showTeam, setShowTeam] = useState(true);
  const [showRadiation, setShowRadiation] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Selected object inspector
  const [selectedItem, setSelectedItem] = useState<{
    type: 'monument' | 'marker' | 'team';
    data: any;
  } | null>(null);

  // Add marker dialog
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMarkerName, setNewMarkerName] = useState('');
  const [newMarkerGrid, setNewMarkerGrid] = useState('G11');
  const [newMarkerType, setNewMarkerType] = useState<MapMarker['type']>('base');
  const [newMarkerColor, setNewMarkerColor] = useState('#FF7417');
  const [newMarkerNote, setNewMarkerNote] = useState('');

  const gridLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
  const gridNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left - pan.x) / (rect.width * zoom)) * 100;
    const clickY = ((e.clientY - rect.top - pan.y) / (rect.height * zoom)) * 100;

    const colIdx = Math.floor((clickX / 100) * gridLetters.length);
    const rowIdx = Math.floor((clickY / 100) * gridNumbers.length);
    const col = gridLetters[Math.max(0, Math.min(gridLetters.length - 1, colIdx))];
    const row = gridNumbers[Math.max(0, Math.min(gridNumbers.length - 1, rowIdx))];

    if (col && row) {
      setCursorCoords({
        grid: `${col}${row}`,
        x: Math.round(clickX * 10),
        y: Math.round(clickY * 10),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    setNewMarkerGrid(cursorCoords.grid);
  };

  const handleCreateMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarkerName.trim()) return;

    const colLetter = newMarkerGrid.charAt(0).toUpperCase();
    const rowNum = parseInt(newMarkerGrid.slice(1)) || 7;
    const colIdx = gridLetters.indexOf(colLetter);
    const validColIdx = colIdx >= 0 ? colIdx : 6;
    const x = ((validColIdx + 0.5) / gridLetters.length) * 100;
    const y = ((rowNum - 0.5) / gridNumbers.length) * 100;

    addMarker({
      name: newMarkerName.trim(),
      grid: newMarkerGrid.toUpperCase(),
      x,
      y,
      color: newMarkerColor,
      type: newMarkerType,
      note: newMarkerNote.trim(),
    });

    setIsAddModalOpen(false);
    setNewMarkerName('');
    setNewMarkerNote('');
  };

  const filteredMonuments = MONUMENTS.filter(
    m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ruName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.grid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row overflow-hidden select-none bg-[#101114]">
      {/* Central Map Canvas Workspace */}
      <div 
        className="flex-1 relative overflow-hidden bg-[#101114] cursor-grab active:cursor-grabbing border-r border-[#2B2F38]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleMapClick}
      >
        {/* Simulation Watermark Banner */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-2 px-2.5 py-1 rounded bg-[#17191E]/90 border border-[#2B2F38] text-xs font-mono backdrop-blur-xs">
          <Radio className="w-3.5 h-3.5 text-[#F5B942] animate-pulse" />
          <span className="text-[#F0F1F3]">RUST+ КАРТА (4250M)</span>
          <span className="text-[#9BA2AF]">|</span>
          <span className="text-[#F5B942]">
            {isSimulatedMode ? 'СИМУЛЯЦИЯ' : 'LIVE API'}
          </span>
          <span className="text-[#9BA2AF]">|</span>
          <span className="text-[#28C995] font-bold">КУРСОР: {cursorCoords.grid} ({cursorCoords.x}, {cursorCoords.y})</span>
        </div>

        {/* Floating Map Zoom / Layer Tools */}
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5">
          <div className="bg-[#17191E]/95 border border-[#2B2F38] rounded p-1 flex flex-col gap-1 backdrop-blur-xs shadow-xl">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(prev => Math.min(prev + 0.3, 3));
              }}
              className="p-1.5 rounded hover:bg-[#1D2026] text-[#9BA2AF] hover:text-[#F0F1F3]"
              title="Приблизить (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(prev => Math.max(prev - 0.3, 0.7));
              }}
              className="p-1.5 rounded hover:bg-[#1D2026] text-[#9BA2AF] hover:text-[#F0F1F3]"
              title="Отдалить (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1.5 rounded hover:bg-[#1D2026] text-[#9BA2AF] hover:text-[#F0F1F3]"
              title="Сброс положения"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAddModalOpen(true);
            }}
            className="p-2 rounded bg-[#FF7417] hover:bg-[#E85D12] text-white shadow-lg transition-colors flex items-center justify-center"
            title="Добавить свою метку на карту"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Map Area */}
        <div
          className="w-full h-full relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Procedural Island Terrain SVG */}
          <svg className="w-full h-full min-w-[700px] min-h-[700px]" viewBox="0 0 1000 1000">
            <defs>
              <radialGradient id="waterGrad" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="#0B131C" />
                <stop offset="100%" stopColor="#080C12" />
              </radialGradient>
              <radialGradient id="landGrad" cx="45%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1E2E25" />
                <stop offset="60%" stopColor="#18241D" />
                <stop offset="90%" stopColor="#2F2B1D" />
                <stop offset="100%" stopColor="#161C19" />
              </radialGradient>
              <pattern id="topoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Ocean */}
            <rect width="1000" height="1000" fill="url(#waterGrad)" />

            {/* Main Procedural Rust Island Contour */}
            <path
              d="M 220 280 
                 Q 300 120 540 140 
                 T 820 280 
                 Q 920 450 860 680 
                 T 650 880 
                 Q 420 920 260 840 
                 T 110 560 
                 Q 120 380 220 280 Z"
              fill="url(#landGrad)"
              stroke="#263A2F"
              strokeWidth="4"
            />

            {/* Secondary Islands */}
            <ellipse cx="880" cy="860" rx="45" ry="35" fill="#16201B" stroke="#1F2E26" strokeWidth="2" />
            <ellipse cx="140" cy="800" rx="30" ry="25" fill="#16201B" stroke="#1F2E26" strokeWidth="2" />

            {/* Rivers & Mountain Ridges */}
            <path
              d="M 540 140 Q 520 400 480 550 T 260 840"
              fill="none"
              stroke="#080C12"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 480 550 Q 640 600 860 680"
              fill="none"
              stroke="#080C12"
              strokeWidth="8"
              strokeLinecap="round"
            />

            {/* Topo texture */}
            <rect width="1000" height="1000" fill="url(#topoGrid)" />

            {/* Radiation Zone Heatmaps */}
            {showRadiation && (
              <g>
                <circle cx="520" cy="360" r="75" fill="rgba(240, 68, 68, 0.08)" stroke="rgba(240, 68, 68, 0.3)" strokeDasharray="4,4" />
                <circle cx="210" cy="420" r="60" fill="rgba(240, 68, 68, 0.08)" stroke="rgba(240, 68, 68, 0.3)" strokeDasharray="4,4" />
              </g>
            )}

            {/* Rust Grid Overlay (A1 - N14) */}
            {showGrid && (
              <g>
                {gridLetters.map((col, cIdx) => {
                  const x = (cIdx / gridLetters.length) * 1000;
                  return (
                    <g key={`col-${col}`}>
                      <line x1={x} y1={0} x2={x} y2={1000} stroke="#2B2F38" strokeWidth="1" opacity="0.6" />
                      <text x={x + 5} y={15} fill="#9BA2AF" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        {col}
                      </text>
                    </g>
                  );
                })}
                {gridNumbers.map((row, rIdx) => {
                  const y = (rIdx / gridNumbers.length) * 1000;
                  return (
                    <g key={`row-${row}`}>
                      <line x1={0} y1={y} x2={1000} y2={y} stroke="#2B2F38" strokeWidth="1" opacity="0.6" />
                      <text x={5} y={y + 14} fill="#9BA2AF" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        {row}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>

          {/* HTML Overlay for Monuments */}
          {showMonuments &&
            MONUMENTS.map(m => (
              <div
                key={m.id}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedItem({ type: 'monument', data: m });
                }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold border shadow-lg transition-transform group-hover:scale-125 ${
                    m.tier === 'safe'
                      ? 'bg-[#10241B] border-[#28C995] text-[#28C995]'
                      : m.tier === 'high'
                      ? 'bg-[#261416] border-[#F04444] text-[#F04444]'
                      : 'bg-[#221B12] border-[#F5B942] text-[#F5B942]'
                  }`}
                >
                  {m.tier === 'safe' ? 'S' : m.tier === 'high' ? 'H' : 'M'}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-[#17191E]/95 px-1.5 py-0.5 rounded border border-[#2B2F38] text-[10px] font-mono text-[#F0F1F3] whitespace-nowrap opacity-90 group-hover:opacity-100 pointer-events-none">
                  {m.ruName}
                </div>
              </div>
            ))}

          {/* HTML Overlay for Custom Markers */}
          {showMarkers &&
            markers.map(marker => (
              <div
                key={marker.id}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedItem({ type: 'marker', data: marker });
                }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-15"
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-transform group-hover:scale-125"
                  style={{ backgroundColor: marker.color }}
                />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 bg-[#17191E]/95 px-1.5 py-0.5 rounded border border-[#2B2F38] text-[10px] font-mono text-[#F0F1F3] whitespace-nowrap shadow-lg">
                  {marker.name} ({marker.grid})
                </div>
              </div>
            ))}

          {/* HTML Overlay for Team Members */}
          {showTeam &&
            teamMembers.map(member => (
              <div
                key={member.id}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedItem({ type: 'team', data: member });
                }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                style={{ left: `${member.coords.x}%`, top: `${member.coords.y}%` }}
              >
                <div className="relative">
                  <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-[#28C995] shadow-lg">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {member.isLeader && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#F5B942] rounded-full border border-black" />
                  )}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-0.5 bg-black/90 px-1 py-0.5 rounded text-[9px] font-mono text-[#28C995] whitespace-nowrap">
                  {member.name.split(' ')[0]} ({member.hp} HP)
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Right Tactical Sidebar: Layer Toggles, Inspector & Monuments Search */}
      <div className="w-full md:w-80 bg-[#17191E] flex flex-col justify-between border-t md:border-t-0 border-[#2B2F38] overflow-y-auto">
        <div className="p-3 space-y-3">
          {/* Layer Controls Bar */}
          <div className="bg-[#1D2026] border border-[#2B2F38] rounded p-2.5">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#F0F1F3] mb-2">
              <Layers className="w-3.5 h-3.5 text-[#FF7417]" />
              <span>СЛОИ КАРТЫ</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`px-2 py-1 rounded text-left border transition-colors ${
                  showGrid
                    ? 'bg-[#17191E] border-[#FF7417] text-[#FF7417] font-medium'
                    : 'bg-[#17191E] border-[#2B2F38] text-[#9BA2AF]'
                }`}
              >
                Сетка A1-N14
              </button>
              <button
                onClick={() => setShowMonuments(!showMonuments)}
                className={`px-2 py-1 rounded text-left border transition-colors ${
                  showMonuments
                    ? 'bg-[#17191E] border-[#FF7417] text-[#FF7417] font-medium'
                    : 'bg-[#17191E] border-[#2B2F38] text-[#9BA2AF]'
                }`}
              >
                Монументы
              </button>
              <button
                onClick={() => setShowMarkers(!showMarkers)}
                className={`px-2 py-1 rounded text-left border transition-colors ${
                  showMarkers
                    ? 'bg-[#17191E] border-[#FF7417] text-[#FF7417] font-medium'
                    : 'bg-[#17191E] border-[#2B2F38] text-[#9BA2AF]'
                }`}
              >
                Метки ({markers.length})
              </button>
              <button
                onClick={() => setShowTeam(!showTeam)}
                className={`px-2 py-1 rounded text-left border transition-colors ${
                  showTeam
                    ? 'bg-[#17191E] border-[#FF7417] text-[#FF7417] font-medium'
                    : 'bg-[#17191E] border-[#2B2F38] text-[#9BA2AF]'
                }`}
              >
                Команда ({teamMembers.length})
              </button>
              <button
                onClick={() => setShowRadiation(!showRadiation)}
                className={`col-span-2 px-2 py-1 rounded text-left border transition-colors ${
                  showRadiation
                    ? 'bg-[#17191E] border-[#FF7417] text-[#FF7417] font-medium'
                    : 'bg-[#17191E] border-[#2B2F38] text-[#9BA2AF]'
                }`}
              >
                Зоны радиации (Launch / MilTunnels)
              </button>
            </div>
          </div>

          {/* Selected Item Inspector Panel */}
          {selectedItem && (
            <div className="bg-[#1D2026] border border-[#2B2F38] rounded p-3 text-xs space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#2B2F38]">
                <span className="font-mono font-bold text-[#F0F1F3] uppercase">
                  {selectedItem.type === 'monument'
                    ? 'ИНФО МОНУМЕНТА'
                    : selectedItem.type === 'marker'
                    ? 'ИНФО МЕТКИ'
                    : 'ЧЛЕН КОМАНДЫ'}
                </span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-[#9BA2AF] hover:text-[#F0F1F3] text-[11px]"
                >
                  ✕ Закрыть
                </button>
              </div>

              {selectedItem.type === 'monument' && (
                <div>
                  <div className="font-bold text-sm text-[#FF7417]">
                    {selectedItem.data.ruName} ({selectedItem.data.name})
                  </div>
                  <div className="text-[11px] font-mono text-[#F0F1F3] mt-1">
                    Квадрат: <span className="text-[#FF7417] font-bold">{selectedItem.data.grid}</span> · Радиация:{' '}
                    <span className="text-[#F5B942]">{selectedItem.data.radiation}</span>
                  </div>
                  <div className="mt-2 text-[#9BA2AF] text-[11px] space-y-0.5">
                    <div>Особенности: {selectedItem.data.features.join(', ')}</div>
                    <div>
                      Переработчик: {selectedItem.data.hasRecycler ? '✅ Есть' : '❌ Нет'} · НПЗ:{' '}
                      {selectedItem.data.hasRefinery ? '✅ Есть' : '❌ Нет'}
                    </div>
                  </div>

                  {selectedItem.data.cctvCodes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#2B2F38]">
                      <div className="text-[10px] font-mono text-[#9BA2AF] mb-1">КАМЕРЫ CCTV:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedItem.data.cctvCodes.map((code: string) => {
                          const cam = allCameras.find(c => c.code === code);
                          return (
                            <button
                              key={code}
                              onClick={() => cam && openCCTV(cam)}
                              className="px-2 py-0.5 rounded bg-[#17191E] hover:bg-[#2B2F38] text-[#F0F1F3] font-mono text-[10px] flex items-center gap-1 border border-[#2B2F38]"
                            >
                              <Eye className="w-3 h-3 text-[#28C995]" />
                              {code}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedItem.type === 'marker' && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#F0F1F3]">
                      {selectedItem.data.name}
                    </span>
                    <span className="font-mono text-xs text-[#FF7417] font-bold">
                      {selectedItem.data.grid}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#9BA2AF] mt-1">
                    {selectedItem.data.note || 'Заметка отсутствует'}
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        removeMarker(selectedItem.data.id);
                        setSelectedItem(null);
                      }}
                      className="px-2 py-1 rounded bg-[#261416] hover:bg-[#341A1D] text-[#F04444] font-mono text-[10px] flex items-center gap-1 border border-[#F04444]/40"
                    >
                      <Trash2 className="w-3 h-3" /> Удалить метку
                    </button>
                  </div>
                </div>
              )}

              {selectedItem.type === 'team' && (
                <div>
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedItem.data.avatar}
                      alt={selectedItem.data.name}
                      className="w-7 h-7 rounded"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-bold text-[#F0F1F3]">{selectedItem.data.name}</div>
                      <div className="text-[10px] font-mono text-[#9BA2AF]">
                        {selectedItem.data.coords.grid} · {selectedItem.data.distance}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-[#F0F1F3]">
                    Здоровье: <span className="font-mono font-bold text-[#28C995]">{selectedItem.data.hp} / 100 HP</span>
                  </div>
                  <div className="text-[11px] text-[#9BA2AF]">
                    В руках: <span className="text-[#F5B942]">{selectedItem.data.heldItem}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Monuments Directory Search */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-[#F0F1F3] px-1">
              <span>КАТАЛОГ МОНУМЕНТОВ</span>
              <span className="text-[10px] text-[#9BA2AF]">{filteredMonuments.length} РТ</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9BA2AF] absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск монумента или квадрата..."
                className="w-full bg-[#1D2026] border border-[#2B2F38] rounded pl-8 pr-2 py-1 text-xs text-[#F0F1F3] placeholder-[#9BA2AF] focus:outline-none focus:border-[#FF7417]"
              />
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
              {filteredMonuments.map(m => (
                <div
                  key={m.id}
                  onClick={() => setSelectedItem({ type: 'monument', data: m })}
                  className="bg-[#1D2026] border border-[#2B2F38] hover:border-[#FF7417]/50 rounded p-2 flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-medium text-[#F0F1F3]">{m.ruName}</div>
                    <div className="text-[10px] font-mono text-[#9BA2AF]">{m.name}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#17191E] border border-[#2B2F38] text-[10px] font-mono text-[#FF7417] font-bold">
                    {m.grid}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Map Status Bar */}
        <div className="p-2.5 border-t border-[#2B2F38] bg-[#101114] text-[10px] font-mono text-[#9BA2AF] flex justify-between">
          <span>СЕТКА КАРТЫ: PROCEDURAL 4250M</span>
          <span>МАСШТАБ: {Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Add Custom Marker Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#17191E] border border-[#2B2F38] rounded p-4 w-full max-w-sm text-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#2B2F38]">
              <span className="font-mono font-bold text-[#F0F1F3] text-sm">ДОБАВИТЬ МЕТКУ</span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#9BA2AF] hover:text-[#F0F1F3]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMarker} className="space-y-2.5">
              <div>
                <label className="block text-[#9BA2AF] mb-1">Название метки</label>
                <input
                  type="text"
                  required
                  placeholder="напр: Тайник серы / База врагов"
                  value={newMarkerName}
                  onChange={e => setNewMarkerName(e.target.value)}
                  className="w-full bg-[#1D2026] border border-[#2B2F38] rounded p-2 text-[#F0F1F3] focus:outline-none focus:border-[#FF7417]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#9BA2AF] mb-1">Квадрат (A1-N14)</label>
                  <input
                    type="text"
                    required
                    value={newMarkerGrid}
                    onChange={e => setNewMarkerGrid(e.target.value)}
                    className="w-full bg-[#1D2026] border border-[#2B2F38] rounded p-2 text-[#F0F1F3] uppercase font-mono focus:outline-none focus:border-[#FF7417]"
                  />
                </div>
                <div>
                  <label className="block text-[#9BA2AF] mb-1">Цвет метки</label>
                  <div className="flex gap-1.5 items-center mt-1">
                    {['#FF7417', '#3b82f6', '#28C995', '#F04444', '#F5B942'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewMarkerColor(c)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          newMarkerColor === c ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[#9BA2AF] mb-1">Тип метки</label>
                <select
                  value={newMarkerType}
                  onChange={e => setNewMarkerType(e.target.value as any)}
                  className="w-full bg-[#1D2026] border border-[#2B2F38] rounded p-2 text-[#F0F1F3] focus:outline-none focus:border-[#FF7417]"
                >
                  <option value="base">База / Постройка</option>
                  <option value="stash">Тайник / Скрап</option>
                  <option value="raid">Рейд цель</option>
                  <option value="enemy">Вражеский дом</option>
                  <option value="quarry">Карьер / Ресурсы</option>
                </select>
              </div>

              <div>
                <label className="block text-[#9BA2AF] mb-1">Заметка</label>
                <textarea
                  rows={2}
                  placeholder="Дополнительные детали..."
                  value={newMarkerNote}
                  onChange={e => setNewMarkerNote(e.target.value)}
                  className="w-full bg-[#1D2026] border border-[#2B2F38] rounded p-2 text-[#F0F1F3] focus:outline-none focus:border-[#FF7417]"
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
                  Сохранить метку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
