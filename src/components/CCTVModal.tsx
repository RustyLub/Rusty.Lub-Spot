import React, { useState, useEffect } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Video,
  Radio,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';

export const CCTVModal: React.FC = () => {
  const { activeCCTV, closeCCTV } = useCompanion();
  const [filterMode, setFilterMode] = useState<'night' | 'bw' | 'flir'>('night');
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isRecording, setIsRecording] = useState(true);

  useEffect(() => {
    // Reset camera position when opening a camera
    setPanX(0);
    setPanY(0);
    setZoom(1);
  }, [activeCCTV]);

  if (!activeCCTV) return null;

  const handlePan = (dx: number, dy: number) => {
    setPanX(prev => Math.max(-50, Math.min(50, prev + dx)));
    setPanY(prev => Math.max(-30, Math.min(30, prev + dy)));
  };

  const handleZoom = (dz: number) => {
    setZoom(prev => Math.max(1, Math.min(2.5, +(prev + dz).toFixed(1))));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-4xl bg-[#121419] border border-[#2d323e] rounded shadow-2xl flex flex-col overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-[#181a22] px-4 py-2 border-b border-[#292e3a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[#e05326]" />
            <span className="font-mono text-xs font-bold text-neutral-100">
              CCTV СИСТЕМА: [{activeCCTV.code}]
            </span>
            <span className="text-[11px] text-neutral-400">
              — {activeCCTV.ruMonument} ({activeCCTV.description})
            </span>
          </div>
          <button
            onClick={closeCCTV}
            className="p-1 rounded hover:bg-[#252a36] text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Canvas Container */}
        <div className="relative aspect-16/9 bg-black overflow-hidden flex items-center justify-center">
          {/* Simulated Camera View with Scanlines */}
          <div
            className={`w-full h-full relative transition-transform duration-100 ${
              filterMode === 'night'
                ? 'brightness-95 contrast-125 saturate-150'
                : filterMode === 'flir'
                ? 'invert hue-rotate-180 contrast-150'
                : 'grayscale contrast-125'
            }`}
            style={{
              transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            }}
          >
            {/* SVG Tactical Environment Rendering */}
            <svg
              className="w-full h-full"
              viewBox="0 0 800 450"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d1b1e" />
                  <stop offset="100%" stopColor="#1e3231" />
                </linearGradient>
                <radialGradient id="spotLight" cx="50%" cy="30%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.8)" />
                </radialGradient>
              </defs>

              <rect width="800" height="450" fill="url(#skyGrad)" />
              <rect width="800" height="450" fill="url(#spotLight)" />

              {/* Distant Terrain Silhouettes */}
              <path
                d="M0,260 Q120,220 250,250 T500,230 T800,270 L800,450 L0,450 Z"
                fill="#0b1715"
              />

              {/* Monument Structures based on code */}
              {activeCCTV.code.includes('DOME') ? (
                <g>
                  {/* Sphere structure */}
                  <ellipse cx="400" cy="200" rx="140" ry="140" fill="#132320" stroke="#22423c" strokeWidth="3" />
                  <ellipse cx="400" cy="200" rx="138" ry="138" fill="none" stroke="#2c534b" strokeWidth="1" strokeDasharray="6,4" />
                  <line x1="260" y1="200" x2="540" y2="200" stroke="#1d3833" strokeWidth="2" />
                  <line x1="400" y1="60" x2="400" y2="340" stroke="#1d3833" strokeWidth="2" />
                  {/* Pipes & supports */}
                  <rect x="290" y="270" width="16" height="150" fill="#091210" />
                  <rect x="494" y="270" width="16" height="150" fill="#091210" />
                  <rect x="370" y="190" width="60" height="20" fill="#203d37" />
                </g>
              ) : activeCCTV.code.includes('OIL') ? (
                <g>
                  {/* Oil Rig structure */}
                  <rect x="180" y="160" width="440" height="40" fill="#162925" />
                  <rect x="220" y="90" width="200" height="70" fill="#0f1c1a" />
                  <polygon points="520,160 560,70 590,70 540,160" fill="#203a35" />
                  {/* Helipad */}
                  <rect x="240" y="80" width="160" height="10" fill="#2d4f48" />
                  <circle cx="320" cy="85" r="16" fill="none" stroke="#8cb8ae" strokeWidth="2" />
                  <text x="314" y="90" fill="#8cb8ae" fontSize="14" fontFamily="monospace" fontWeight="bold">H</text>
                  {/* Water */}
                  <rect x="0" y="320" width="800" height="130" fill="#060e12" />
                  <line x1="0" y1="320" x2="800" y2="320" stroke="#1b363a" strokeWidth="2" />
                </g>
              ) : activeCCTV.code.includes('AIR') ? (
                <g>
                  {/* Airfield runway */}
                  <polygon points="100,450 700,450 480,240 320,240" fill="#0a1412" />
                  <line x1="400" y1="240" x2="400" y2="450" stroke="#719e93" strokeWidth="3" strokeDasharray="20,15" />
                  {/* Hangar & tower */}
                  <rect x="120" y="200" width="160" height="60" fill="#152622" />
                  <rect x="520" y="150" width="50" height="110" fill="#101e1b" />
                  <rect x="500" y="130" width="90" height="20" fill="#26443e" />
                </g>
              ) : (
                <g>
                  {/* Industrial compound */}
                  <rect x="250" y="180" width="300" height="140" fill="#132420" />
                  <polygon points="230,180 400,120 570,180" fill="#1c332e" />
                  <rect x="280" y="220" width="40" height="80" fill="#091210" />
                  <rect x="480" y="220" width="40" height="80" fill="#091210" />
                </g>
              )}

              {/* Simulated loot crate / target glow */}
              <circle cx="440" cy="285" r="4" fill="#f97316" className="animate-ping" />
              <rect x="432" y="280" width="16" height="12" fill="#d97706" stroke="#451a03" strokeWidth="1" />
            </svg>
          </div>

          {/* CRT scanline overlay */}
          <div className="absolute inset-0 pointer-events-none cctv-scanlines opacity-75" />

          {/* HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between font-mono text-[11px] text-emerald-400">
            {/* Top HUD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded border border-emerald-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <span className="font-bold tracking-widest text-red-500">REC</span>
                <span className="text-neutral-400">|</span>
                <span className="text-white font-bold">{activeCCTV.code}</span>
                <span className="text-emerald-400">CAM_0{activeCCTV.id.replace(/\D/g, '') || '1'}</span>
              </div>

              <div className="bg-black/60 px-2.5 py-1 rounded border border-emerald-500/30 text-right">
                <div>FPS: 30.0 · LATENCY: 22ms</div>
                <div className="text-[10px] text-neutral-400">RUST+ CCTV FEED // PTZ ACTIVE</div>
              </div>
            </div>

            {/* Tactical Crosshair */}
            <div className="self-center flex items-center justify-center relative w-24 h-24">
              <div className="w-16 h-16 border border-emerald-500/40 rounded-full" />
              <div className="absolute w-24 h-[1px] bg-emerald-500/30" />
              <div className="absolute h-24 w-[1px] bg-emerald-500/30" />
              <div className="absolute w-2 h-2 border border-emerald-400" />
            </div>

            {/* Bottom HUD */}
            <div className="flex items-center justify-between">
              <div className="bg-black/60 px-2.5 py-1 rounded border border-emerald-500/30">
                <span>ZOOM: {zoom}x</span>
                <span className="mx-2 text-neutral-500">|</span>
                <span>PAN: {panX}° / {panY}°</span>
                <span className="mx-2 text-neutral-500">|</span>
                <span>РЕЖИМ: {filterMode.toUpperCase()}</span>
              </div>

              <div className="bg-black/60 px-2.5 py-1 rounded border border-emerald-500/30 text-amber-400">
                {activeCCTV.ruMonument} · {activeCCTV.description}
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Control Bar */}
        <div className="bg-[#15171f] p-3 border-t border-[#292e3a] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Filter Modes */}
          <div className="flex items-center gap-1.5 bg-[#1b1e28] p-1 rounded border border-[#2b303e]">
            <span className="text-[10px] text-neutral-400 px-1 font-mono">РЕЖИМ:</span>
            <button
              onClick={() => setFilterMode('night')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                filterMode === 'night'
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              ПНВ (Night)
            </button>
            <button
              onClick={() => setFilterMode('bw')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                filterMode === 'bw'
                  ? 'bg-[#2f3545] text-white border border-[#434b60]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Ч/Б (Mono)
            </button>
            <button
              onClick={() => setFilterMode('flir')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                filterMode === 'flir'
                  ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              FLIR (Тепло)
            </button>
          </div>

          {/* PTZ Pan Controls */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400 font-mono">ПОВОРОТ PTZ:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePan(-15, 0)}
                className="p-1.5 rounded bg-[#1f2330] hover:bg-[#2b3142] text-neutral-300 hover:text-white"
                title="Влево"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handlePan(0, -10)}
                  className="p-1 rounded bg-[#1f2330] hover:bg-[#2b3142] text-neutral-300 hover:text-white"
                  title="Вверх"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handlePan(0, 10)}
                  className="p-1 rounded bg-[#1f2330] hover:bg-[#2b3142] text-neutral-300 hover:text-white"
                  title="Вниз"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => handlePan(15, 0)}
                className="p-1.5 rounded bg-[#1f2330] hover:bg-[#2b3142] text-neutral-300 hover:text-white"
                title="Вправо"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reset Pan */}
            <button
              onClick={() => {
                setPanX(0);
                setPanY(0);
                setZoom(1);
              }}
              className="p-1.5 rounded bg-[#1f2330] hover:bg-[#2b3142] text-neutral-400 hover:text-white"
              title="Сброс позиции"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-[#1b1e28] p-1 rounded border border-[#2b303e]">
            <span className="text-[10px] text-neutral-400 px-1 font-mono">ЗУМ:</span>
            <button
              onClick={() => handleZoom(-0.2)}
              disabled={zoom <= 1}
              className="p-1 rounded hover:bg-[#282d3c] text-neutral-300 disabled:opacity-30"
              title="Отдалить"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-white tabular-nums">
              {zoom}x
            </span>
            <button
              onClick={() => handleZoom(0.2)}
              disabled={zoom >= 2.5}
              className="p-1 rounded hover:bg-[#282d3c] text-neutral-300 disabled:opacity-30"
              title="Приблизить"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
