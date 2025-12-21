import { BuildingDefinition, ResourceConfig } from './types';

// Helper to create levels 1-30 easily where applicable, though most are specific
const createLevels = (data: number[]): { level: number; powerIncrease: number }[] => {
  return data.map((val, idx) => ({ level: idx + 1, powerIncrease: val }));
};

// Troop Data (Level 1-10)
export const TROOP_DATA = [
  { level: 1, name: '見習い', power: 3 },
  { level: 2, name: '一般', power: 4 },
  { level: 3, name: '優秀', power: 6 },
  { level: 4, name: '熟練', power: 9 },
  { level: 5, name: '豪胆', power: 13 },
  { level: 6, name: '勇猛', power: 20 },
  { level: 7, name: '不屈', power: 28 },
  { level: 8, name: '精鋭', power: 38 },
  { level: 9, name: '名誉', power: 50 },
  { level: 10, name: 'エース', power: 66 },
];

// Data extracted from PDF/OCR
// Page 1: City Hall, Embassy/Institute/Warehouse, Barracks
const cityHallData = [
  2000, 1800, 2700, 3600, 5400, 8100, 11700, 11700, 11700, 17000,
  17000, 17000, 28700, 28700, 28700, 40400, 40400, 40400, 57400, 57400,
  57400, 86100, 86100, 86100, 86100, 126500, 126500, 126500, 126500, 183900
];

const embassyGroupData = [
  440, 396, 594, 792, 1188, 1782, 2574, 2574, 2574, 3740,
  3740, 3740, 6314, 6314, 6314, 8888, 8888, 8888, 12628, 12628,
  12628, 18942, 18942, 18942, 18942, 27830, 27830, 27830, 27830, 40458
];

const barracksData = [
  400, 360, 540, 720, 1080, 1620, 2340, 2340, 2340, 3400,
  3400, 3400, 5740, 5740, 5740, 8080, 8080, 8080, 11480, 11480,
  11480, 17220, 17220, 17220, 17220, 25300, 25300, 25300, 25300, 36780
];

// Page 2: Hospital, Command Center, Production (Bread/Wood/Stone/Iron)
const hospitalData = [
  300, 270, 405, 540, 810, 1215, 1755, 1755, 1755, 2550,
  2550, 2550, 4305, 4305, 4305, 6060, 6060, 6060, 8610, 8610,
  8610, 12915, 12915, 12915, 12915, 18975, 18975, 18975, 18975, 27585
];

const commandCenterData = [
  280, 252, 378, 504, 756, 1134, 1638, 1638, 1638, 2380,
  2380, 2380, 4018, 4018, 4018, 5656, 5656, 5656, 8036, 8036,
  8036, 12054, 12054, 12054, 12054, 17710, 17710, 17710, 17710, 25746
];

const productionData = [
  40, 36, 54, 72, 108, 162, 234, 234, 234, 340,
  340, 340, 574, 574, 574, 808, 808, 808, 1148, 1148,
  1148, 1722, 1722, 1722, 1722, 2530, 2530, 2530, 2530, 3678
];

// Page 3: Defense Bureau (1-10), Infirmary/Kitchen (1-10), House/Wall/Tower (1-10)
const defenseBureauData = [
  400, 2700, 6300, 12540, 25300, 39120, 63140, 67820, 50600, 36780
];

const infirmaryKitchenData = [
  100, 90, 135, 180, 270, 405, 585, 585, 585, 850
];

const houseWallData = [
  60, 54, 81, 108, 162, 243, 351, 351, 351, 510
];


export const BUILDINGS: BuildingDefinition[] = [
  {
    id: 'city_hall',
    name: '役場',
    levels: createLevels(cityHallData),
  },
  {
    id: 'embassy_group',
    name: '大使館、学院、倉庫',
    levels: createLevels(embassyGroupData),
  },
  {
    id: 'barracks',
    name: '兵舎',
    levels: createLevels(barracksData),
  },
  {
    id: 'hospital',
    name: '野戦病院',
    levels: createLevels(hospitalData),
  },
  {
    id: 'command_center',
    name: '指揮所',
    levels: createLevels(commandCenterData),
  },
  {
    id: 'production',
    name: '生産施設 (パン、木、石、鉄)',
    levels: createLevels(productionData),
  },
  {
    id: 'defense_bureau',
    name: '防衛局',
    levels: createLevels(defenseBureauData),
  },
  {
    id: 'infirmary_kitchen',
    name: '医務室、厨房',
    levels: createLevels(infirmaryKitchenData),
  },
  {
    id: 'house_wall',
    name: '民家、防衛塔、城壁',
    levels: createLevels(houseWallData),
  },
];

// Common Resource Packs - Updated to the specific 6 requested
const COMMON_PACKS = [
  { id: 'p100', value: 100, label: '100' },
  { id: 'p1k', value: 1000, label: '1K' },
  { id: 'p1k_safe', value: 1000, label: '1K', isSafe: true },
  { id: 'p10k', value: 10000, label: '10K' },
  { id: 'p10k_safe', value: 10000, label: '10K', isSafe: true },
  { id: 'p100k', value: 100000, label: '100K' },
];

export const RESOURCE_CONFIGS: ResourceConfig[] = [
  {
    id: 'food',
    name: 'パン',
    ratio: 20,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500',
    ringColor: 'ring-orange-500',
    iconColor: '#f97316',
    packs: COMMON_PACKS
  },
  {
    id: 'wood',
    name: '木材',
    ratio: 20,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500',
    ringColor: 'ring-emerald-500',
    iconColor: '#10b981',
    packs: COMMON_PACKS
  },
  {
    id: 'stone',
    name: '石材',
    ratio: 4,
    color: 'text-slate-300',
    bgColor: 'bg-slate-500',
    ringColor: 'ring-slate-500',
    iconColor: '#94a3b8',
    packs: COMMON_PACKS
  },
  {
    id: 'iron',
    name: '鉄鉱',
    ratio: 1,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500',
    ringColor: 'ring-indigo-500',
    iconColor: '#6366f1',
    packs: COMMON_PACKS
  },
];
