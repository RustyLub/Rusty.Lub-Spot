/**
 * Rusty.Lub Spot Types
 */

export interface SteamUser {
  steamId: string;
  displayName: string;
  avatar: string;
  profileUrl: string;
  createdAt?: number;
}

export type SteamAuthState = 'unauthenticated' | 'logging_in' | 'authenticated' | 'error';

export type NavPageId = 
  | 'overview'
  | 'map'
  | 'player_tracker'
  | 'smart_electrical'
  | 'notifications'
  | 'team'
  | 'servers'
  | 'camera_codes'
  | 'plant_genetics'
  | 'raid_calculator'
  | 'decay_calculator'
  | 'recycler'
  | 'item_database'
  | 'hotkeys'
  | 'settings';

export interface NavItem {
  id: NavPageId;
  label: string;
  category: 'core' | 'electrical' | 'tools' | 'system';
  badge?: string | number;
}

export type RustPairingStatus =
  | 'unpaired'
  | 'pending_pair'
  | 'connecting'
  | 'connected'
  | 'reauth_required'
  | 'error';

export interface PairedRustServer {
  id: string;
  userId?: string;
  name: string;
  ip: string;
  port: number;
  playerId: string;
  status: RustPairingStatus;
  mapSize?: number;
  wipeSchedule?: string;
  lastSync?: string;
  lastError?: string;
  pairingSource: 'in_game_notification' | 'manual_entry' | 'pairing_url';
  createdAt: number;
}

export interface RustServer {
  id: string;
  name: string;
  ip: string;
  port: number;
  currentPlayers: number;
  maxPlayers: number;
  queue: number;
  ping: number;
  mapSize: number;
  wipeSchedule: string;
  lastWipe: string;
  nextWipe: string;
  seed: number;
  isFavorite: boolean;
  type: 'official' | 'modded' | 'community';
}

export interface TeamMember {
  id: string;
  name: string;
  steamId: string;
  avatar: string;
  role: string;
  isLeader: boolean;
  isOnline: boolean;
  hp: number;
  maxHp: number;
  coords: {
    grid: string;
    x: number;
    y: number;
  };
  distance: string;
  heldItem: string;
  lastActive: string;
  voiceActive?: boolean;
}

export interface PlayerContact {
  id: string;
  steamId: string;
  nickname: string;
  aliases: string[];
  tags: string[];
  notes: string;
  combatRating: 'Низкий' | 'Обычный' | 'Опасный' | 'Клан / Задрот';
  hoursPlayed?: number;
  clanTag?: string;
  lastSeenDate: string;
  lastSeenGrid: string;
  sightings: {
    id: string;
    date: string;
    grid: string;
    note: string;
  }[];
}

export interface SmartDevice {
  id: string;
  name: string;
  type: 'switch' | 'alarm' | 'battery' | 'counter' | 'turret';
  group: 'Главная база' | 'Внешний периметр' | 'ПВО / Крыша' | 'Ферма' | 'Ловушки';
  state: boolean;
  powerUsage: number; // Watts
  batteryLevel?: number; // %
  batteryOutput?: number; // W
  batteryInput?: number; // W
  counterValue?: number;
  ammoCount?: number;
  targetTriggered?: boolean;
  lastTriggered?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  category: 'raid' | 'device' | 'event' | 'team' | 'system';
  isRead: boolean;
  grid?: string;
}

export interface MapMarker {
  id: string;
  name: string;
  grid: string;
  x: number; // 0 - 100% on map
  y: number; // 0 - 100% on map
  color: string;
  type: 'base' | 'stash' | 'raid' | 'death' | 'enemy' | 'quarry';
  note?: string;
  createdAt: string;
}

export interface Monument {
  id: string;
  name: string;
  ruName: string;
  grid: string;
  x: number;
  y: number;
  tier: 'safe' | 'low' | 'mid' | 'high';
  radiation: 'Нет' | 'Слабая' | 'Средняя' | 'Высокая';
  features: string[];
  hasRecycler: boolean;
  hasRefinery: boolean;
  cctvCodes: string[];
}

export interface CameraCode {
  id: string;
  code: string;
  monument: string;
  ruMonument: string;
  description: string;
  isCustom?: boolean;
  status: 'active' | 'offline';
  fovType: 'wide' | 'narrow' | 'thermal';
}

export interface RaidTarget {
  id: string;
  name: string;
  ruName: string;
  category: 'Двери' | 'Стены' | 'Постройки' | 'Оборона';
  hp: number;
  rockets: number;
  c4: number;
  satchels: number;
  exploAmmo: number;
  beancans: number;
  sulfurOptimal: number;
  optimalMethod: string;
  imageIcon: string;
}

export interface RecyclerItem {
  id: string;
  name: string;
  ruName: string;
  iconName: string;
  scrap: number;
  hqm: number;
  metalFragments: number;
  cloth: number;
  leather: number;
  gunpowder?: number;
  pipes?: number;
  gears?: number;
  techTrash?: number;
  rope?: number;
  springs?: number;
  blades?: number;
  category: 'Компоненты' | 'Электроника' | 'Ткань / Кожа' | 'Боеприпасы';
}

export interface RustItem {
  id: string;
  name: string;
  ruName: string;
  category: 'Оружие' | 'Боеприпасы' | 'Броня' | 'Строительство' | 'Инструменты' | 'Медикаменты' | 'Электрика';
  workbench: 0 | 1 | 2 | 3;
  craftCost: { item: string; qty: number }[];
  recycleYield: string;
  description: string;
  researchScrap: number;
}

export interface ConsoleBind {
  id: string;
  title: string;
  command: string;
  description: string;
  category: 'Движение' | 'Бой' | 'Интерфейс' | 'Крафт' | 'Чат & Звук';
  recommendedKey: string;
}
