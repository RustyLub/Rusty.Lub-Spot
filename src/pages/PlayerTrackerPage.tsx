import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Tag,
  Clock,
  MapPin,
  FileText,
  ExternalLink,
  Save,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { PlayerContact } from '../types';

export const PlayerTrackerPage: React.FC = () => {
  const {
    players,
    updatePlayerNote,
    addPlayerSighting,
    addPlayerTag,
    removePlayerTag,
    addNewPlayer,
  } = useCompanion();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('Все');
  const [showMatrix, setShowMatrix] = useState(false);

  // Form states for adding player
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNick, setNewNick] = useState('');
  const [newSteamId, setNewSteamId] = useState('');
  const [newRating, setNewRating] = useState<PlayerContact['combatRating']>('Обычный');
  const [newGrid, setNewGrid] = useState('G11');
  const [newNotes, setNewNotes] = useState('');
  const [newClan, setNewClan] = useState('');

  // Sighting form
  const [newSightingGrid, setNewSightingGrid] = useState('G11');
  const [newSightingNote, setNewSightingNote] = useState('');

  // Tag input for selected player
  const [customTagInput, setCustomTagInput] = useState('');
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || players[0];
  const [editableNotes, setEditableNotes] = useState(selectedPlayer?.notes || '');

  React.useEffect(() => {
    if (selectedPlayer) {
      setEditableNotes(selectedPlayer.notes);
    }
  }, [selectedPlayerId]);

  const handleSaveNotes = () => {
    if (!selectedPlayer) return;
    updatePlayerNote(selectedPlayer.id, editableNotes);
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 2000);
  };

  const handleAddSighting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer || !newSightingNote.trim()) return;
    addPlayerSighting(selectedPlayer.id, newSightingGrid.toUpperCase(), newSightingNote.trim());
    setNewSightingNote('');
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer || !customTagInput.trim()) return;
    addPlayerTag(selectedPlayer.id, customTagInput.trim());
    setCustomTagInput('');
  };

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNick.trim()) return;

    addNewPlayer({
      nickname: newNick.trim(),
      steamId: newSteamId.trim() || `76561198${Math.floor(100000000 + Math.random() * 900000000)}`,
      aliases: [newNick.trim()],
      tags: ['Ручной ввод', newRating],
      notes: newNotes.trim(),
      combatRating: newRating,
      clanTag: newClan.trim() || undefined,
      lastSeenDate: 'Только что',
      lastSeenGrid: newGrid.toUpperCase(),
      hoursPlayed: 850,
    });

    setIsAddModalOpen(false);
    setNewNick('');
    setNewSteamId('');
    setNewNotes('');
    setNewClan('');
  };

  const allTags = ['Все', 'Враг', 'Союзник', 'Сосед', 'Опасный', 'Клан [TITAN]', 'Мирный'];

  const filteredPlayers = players.filter(p => {
    const matchesSearch =
      p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.steamId.includes(searchQuery) ||
      (p.clanTag && p.clanTag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = tagFilter === 'Все' || p.tags.includes(tagFilter);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="h-[calc(100vh-2.75rem)] flex flex-col md:flex-row overflow-hidden select-none bg-[#0D0F12]">
      {/* Left List of Players */}
      <div className="w-full md:w-[380px] bg-[#12141A] border-r border-[#262A36] flex flex-col justify-between shrink-0">
        <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
          {/* Header & Add Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#E6E8EC]">
              <Users className="w-3.5 h-3.5 text-[#F97316]" />
              <span>ТРЕКЕР ИГРОКОВ ({players.length})</span>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#F97316] hover:bg-[#E05326] text-white text-[11px] font-mono transition-colors"
            >
              <Plus className="w-3 h-3" /> Добавить
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9298A5] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по нику, клану, SteamID..."
              className="w-full bg-[#171A21] border border-[#262A36] rounded pl-8 pr-2 py-1.5 text-xs text-[#E6E8EC] placeholder-[#9298A5] focus:outline-none focus:border-[#F97316]"
            />
          </div>

          {/* Tag Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className={`px-2 py-0.5 rounded whitespace-nowrap border transition-colors ${
                  tagFilter === tag
                    ? 'bg-[#171A21] border-[#F97316] text-[#F97316]'
                    : 'bg-[#171A21] border-[#262A36] text-[#9298A5] hover:text-[#E6E8EC]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Player Cards List */}
          <div className="space-y-1.5 pt-1">
            {filteredPlayers.map(p => {
              const isSelected = selectedPlayer?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`p-2.5 rounded border text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#171A21] border-[#F97316]'
                      : 'bg-[#171A21] border-[#262A36] hover:border-[#383E4E]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-[#E6E8EC] truncate">{p.nickname}</span>
                      {p.clanTag && (
                        <span className="text-[10px] font-mono px-1 rounded bg-[#12141A] text-[#9298A5] border border-[#262A36]">
                          [{p.clanTag}]
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        p.combatRating === 'Клан / Задрот'
                          ? 'bg-[#261416] text-[#F04444] border border-[#F04444]/40'
                          : p.combatRating === 'Опасный'
                          ? 'bg-[#221B12] text-[#F5B942] border border-[#F5B942]/40'
                          : 'bg-[#12141A] text-[#9298A5] border border-[#262A36]'
                      }`}
                    >
                      {p.combatRating}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#9298A5]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#F97316]" />
                      Квадрат: <strong className="text-[#E6E8EC]">{p.lastSeenGrid}</strong>
                    </span>
                    <span>{p.lastSeenDate}</span>
                  </div>

                  {/* Tags Preview */}
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {p.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="text-[9px] bg-[#12141A] border border-[#262A36] text-[#9298A5] px-1.5 py-0.2 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* List Footer */}
        <div className="p-2 border-t border-[#262A36] bg-[#0D0F12] text-[10px] font-mono text-[#9298A5] flex justify-between">
          <span>СИНХРОНИЗАЦИЯ: ЛОКАЛЬНАЯ БД</span>
          <span>ЗАПИСЕЙ: {filteredPlayers.length}</span>
        </div>
      </div>

      {/* Right Detailed Dossier Panel */}
      {selectedPlayer ? (
        <div className="flex-1 bg-[#0D0F12] overflow-y-auto p-4 space-y-4">
          {/* Data Availability Matrix Banner */}
          <div className="bg-[#12141A] border border-[#262A36] rounded p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#F97316]" />
                <span className="font-mono font-bold text-[#E6E8EC]">
                  МАТРИЦА ДОСТУПНОСТИ ДАННЫХ ИГРОКОВ (RUST+ // A2S // BATTLEMETRICS // ДОСЬЕ)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrix(prev => !prev)}
                className="text-[11px] font-mono text-[#F97316] hover:underline flex items-center gap-1"
              >
                <span>{showMatrix ? 'Скрыть регламент' : 'Показать регламент источников'}</span>
                {showMatrix ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showMatrix && (
              <div className="pt-2 border-t border-[#262A36] overflow-x-auto">
                <table className="w-full text-left font-mono text-[10px] text-[#9298A5] border-collapse">
                  <thead>
                    <tr className="border-b border-[#262A36] text-[#E6E8EC]">
                      <th className="py-1.5 pr-2 font-bold">Категория данных</th>
                      <th className="py-1.5 px-2 font-bold">Реальный источник</th>
                      <th className="py-1.5 px-2 font-bold">Необходимые права</th>
                      <th className="py-1.5 px-2 font-bold">Ограничения</th>
                      <th className="py-1.5 pl-2 font-bold">Способ проверки</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1D212B]">
                    <tr>
                      <td className="py-1.5 pr-2 text-[#E6E8EC] font-semibold">1. Онлайн сервера</td>
                      <td className="py-1.5 px-2 text-[#00C896]">A2S_INFO / Rust+ AppInfo</td>
                      <td className="py-1.5 px-2">Публичный query port или сопряжение</td>
                      <td className="py-1.5 px-2">Показывает общее число игроков и очередь</td>
                      <td className="py-1.5 pl-2">UDP запрос или WebSocket getInfo</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-2 text-[#E6E8EC] font-semibold">2. Игровая карта и сетка</td>
                      <td className="py-1.5 px-2 text-[#00C896]">Rust+ AppMap</td>
                      <td className="py-1.5 px-2">Сопряжение с сервером Rust+</td>
                      <td className="py-1.5 px-2">JPG монументов и границы океана; базы врагов скрыты</td>
                      <td className="py-1.5 pl-2">WebSocket getMap</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-2 text-[#E6E8EC] font-semibold">3. Собственная команда</td>
                      <td className="py-1.5 px-2 text-[#00C896]">Rust+ AppTeamInfo</td>
                      <td className="py-1.5 px-2">Членство в отряде Rust</td>
                      <td className="py-1.5 px-2">Только свои тиммейты (координаты X/Y, HP, статус)</td>
                      <td className="py-1.5 pl-2">WebSocket getTeamInfo</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-2 text-[#E6E8EC] font-semibold">4. Произвольные игроки</td>
                      <td className="py-1.5 px-2 text-[#F97316]">Rust+ НЕ ПРЕДОСТАВЛЯЕТ</td>
                      <td className="py-1.5 px-2">A2S_PLAYER / BattleMetrics</td>
                      <td className="py-1.5 px-2">Координаты врагов недоступны (защита от читов)</td>
                      <td className="py-1.5 pl-2">Публичный список ников A2S</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-2 text-[#E6E8EC] font-semibold">5. История появлений</td>
                      <td className="py-1.5 px-2 text-[#F5B942]">Тактическое досье Rusty.Lub</td>
                      <td className="py-1.5 px-2">Записи оператора / разведки</td>
                      <td className="py-1.5 px-2">Историческая фиксация квадратов встреч в бою</td>
                      <td className="py-1.5 pl-2">Локальный журнал контактов</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-2 text-[#E6E8EC] font-semibold">6. События и вертолеты</td>
                      <td className="py-1.5 px-2 text-[#00C896]">Rust+ AppMapMarkers</td>
                      <td className="py-1.5 px-2">Сопряжение с сервером Rust+</td>
                      <td className="py-1.5 px-2">Cargo Ship, CH47 Chinook, Patrol Heli, Vending</td>
                      <td className="py-1.5 pl-2">WebSocket getMapMarkers</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Player Dossier Header */}
          <div className="bg-[#12141A] border border-[#262A36] rounded p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-[#171A21] border border-[#262A36] flex items-center justify-center font-bold font-mono text-lg text-[#F97316]">
                {selectedPlayer.nickname.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#E6E8EC] font-mono">
                    {selectedPlayer.nickname}
                  </h2>
                  {selectedPlayer.clanTag && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#171A21] text-[#9298A5] border border-[#262A36]">
                      КЛАН [{selectedPlayer.clanTag}]
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-[#9298A5] mt-0.5 flex items-center gap-3">
                  <span>SteamID: {selectedPlayer.steamId}</span>
                  {selectedPlayer.hoursPlayed && (
                    <span>Часы в Rust: {selectedPlayer.hoursPlayed}ч</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://steamcommunity.com/profiles/${selectedPlayer.steamId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#171A21] hover:bg-[#262A36] text-[#E6E8EC] border border-[#262A36] text-xs font-mono transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#F97316]" />
                Steam Профиль
              </a>
            </div>
          </div>

          {/* Aliases & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Known Aliases History */}
            <div className="bg-[#12141A] border border-[#262A36] rounded p-3 text-xs">
              <div className="font-mono text-[#9298A5] text-[11px] mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#F97316]" />
                <span>ИЗВЕСТНЫЕ НИКИ (ИСТОРИЯ АЛИАСОВ)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedPlayer.aliases.map((alias, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-[#171A21] border border-[#262A36] text-[#E6E8EC] font-mono text-[11px]"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            </div>

            {/* Custom Tags Manager */}
            <div className="bg-[#12141A] border border-[#262A36] rounded p-3 text-xs">
              <div className="font-mono text-[#9298A5] text-[11px] mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#F97316]" />
                <span>ТАКТИЧЕСКИЕ ТЕГИ</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {selectedPlayer.tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#171A21] border border-[#262A36] text-[#E6E8EC] text-[11px]"
                  >
                    {tag}
                    <button
                      onClick={() => removePlayerTag(selectedPlayer.id, tag)}
                      className="text-[#9298A5] hover:text-[#F04444] ml-1 text-xs"
                      title="Удалить тег"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {/* Add tag form */}
              <form onSubmit={handleAddTag} className="flex gap-1.5">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={e => setCustomTagInput(e.target.value)}
                  placeholder="Добавить тег (напр. 'Снайпер')..."
                  className="flex-1 bg-[#171A21] border border-[#262A36] rounded px-2 py-1 text-xs text-[#E6E8EC] focus:outline-none focus:border-[#F97316]"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded bg-[#171A21] hover:bg-[#262A36] text-[#E6E8EC] border border-[#262A36] font-mono text-[11px]"
                >
                  + Тег
                </button>
              </form>
            </div>
          </div>

          {/* Tactical Dossier Notes (Editable) */}
          <div className="bg-[#12141A] border border-[#262A36] rounded p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[#9298A5] text-[11px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#F97316]" />
                <span>РАЗВЕДДАННЫЕ И ЗАМЕТКИ (ДОСЬЕ)</span>
              </div>
              <button
                onClick={handleSaveNotes}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-[11px] transition-colors"
              >
                {noteSavedFeedback ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {noteSavedFeedback ? 'Сохранено!' : 'Сохранить заметку'}
              </button>
            </div>

            <textarea
              rows={4}
              value={editableNotes}
              onChange={e => setEditableNotes(e.target.value)}
              placeholder="Введите информацию о базе игрока, составе команды, привычках, луте..."
              className="w-full bg-[#171A21] border border-[#262A36] rounded p-2.5 text-[#E6E8EC] font-sans focus:outline-none focus:border-[#F97316] text-xs leading-relaxed"
            />
          </div>

          {/* Sightings Log & Add Sighting Form */}
          <div className="bg-[#12141A] border border-[#262A36] rounded p-3 text-xs space-y-3">
            <div className="font-mono text-[#9298A5] text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
              <span>ЖУРНАЛ ФИКСАЦИЙ И НАБЛЮДЕНИЙ ({selectedPlayer.sightings.length})</span>
            </div>

            {/* Add sighting inline form */}
            <form onSubmit={handleAddSighting} className="bg-[#171A21] border border-[#262A36] rounded p-2.5 flex flex-wrap gap-2 items-center">
              <div className="w-24">
                <input
                  type="text"
                  required
                  value={newSightingGrid}
                  onChange={e => setNewSightingGrid(e.target.value)}
                  placeholder="Квадрат (G11)"
                  className="w-full bg-[#12141A] border border-[#262A36] rounded px-2 py-1 text-xs text-[#E6E8EC] uppercase font-mono focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  required
                  value={newSightingNote}
                  onChange={e => setNewSightingNote(e.target.value)}
                  placeholder="Где и с чем замечен (напр. 'Сфера, спуск с АК')..."
                  className="w-full bg-[#12141A] border border-[#262A36] rounded px-2 py-1 text-xs text-[#E6E8EC] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-[#12141A] hover:bg-[#262A36] text-[#E6E8EC] font-mono text-[11px] border border-[#262A36] transition-colors"
              >
                + Зафиксировать
              </button>
            </form>

            {/* List of sightings */}
            <div className="space-y-1.5">
              {selectedPlayer.sightings.map(s => (
                <div
                  key={s.id}
                  className="bg-[#171A21] border border-[#262A36] rounded p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#12141A] text-[10px] font-mono text-[#F97316] font-bold border border-[#262A36]">
                      {s.grid}
                    </span>
                    <span className="text-[#E6E8EC]">{s.note}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#9298A5] shrink-0">
                    {s.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#9298A5] font-mono text-xs">
          Выберите игрока из списка слева
        </div>
      )}

      {/* Add New Player Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#12141A] border border-[#262A36] rounded p-4 w-full max-w-md text-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#262A36]">
              <span className="font-mono font-bold text-[#E6E8EC] text-sm">ДОБАВИТЬ ИГРОКА В ТРЕКЕР</span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#9298A5] hover:text-[#E6E8EC]">✕</button>
            </div>

            <form onSubmit={handleCreatePlayer} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#9298A5] mb-1">Никнейм игрока *</label>
                  <input
                    type="text"
                    required
                    value={newNick}
                    onChange={e => setNewNick(e.target.value)}
                    placeholder="напр. PvP_King"
                    className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div>
                  <label className="block text-[#9298A5] mb-1">Тег клана</label>
                  <input
                    type="text"
                    value={newClan}
                    onChange={e => setNewClan(e.target.value)}
                    placeholder="TITAN / ZERO"
                    className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#9298A5] mb-1">SteamID64 (опц.)</label>
                  <input
                    type="text"
                    value={newSteamId}
                    onChange={e => setNewSteamId(e.target.value)}
                    placeholder="76561198..."
                    className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div>
                  <label className="block text-[#9298A5] mb-1">Боевая угроза</label>
                  <select
                    value={newRating}
                    onChange={e => setNewRating(e.target.value as any)}
                    className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] focus:outline-none focus:border-[#F97316]"
                  >
                    <option value="Низкий">Низкий (Фермер)</option>
                    <option value="Обычный">Обычный</option>
                    <option value="Опасный">Опасный</option>
                    <option value="Клан / Задрот">Клан / Задрот</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#9298A5] mb-1">Квадрат первой фиксации</label>
                <input
                  type="text"
                  required
                  value={newGrid}
                  onChange={e => setNewGrid(e.target.value)}
                  className="w-full bg-[#171A21] border border-[#262A36] rounded p-2 text-[#E6E8EC] font-mono uppercase focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-[#9298A5] mb-1">Заметки о базе / поведении</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Где живет, чем стреляет, союзники..."
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
                  Добавить в досье
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
