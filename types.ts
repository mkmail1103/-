
export interface LevelData {
  level: number;
  powerIncrease: number;
}

export interface BuildingDefinition {
  id: string;
  name: string;
  levels: LevelData[];
}

export enum CalculationResult {
  ACCELERATE_NOW = 'ACCELERATE_NOW',
  WAIT_FOR_SPEEDUP = 'WAIT_FOR_SPEEDUP',
  EQUAL = 'EQUAL',
}

// Resource Types
export type ResourceType = 'food' | 'wood' | 'stone' | 'iron';

export interface ResourcePack {
  id: string;
  value: number;
  label: string;
  isSafe?: boolean;
}

export interface ResourceConfig {
  id: ResourceType;
  name: string;
  ratio: number;
  color: string;
  bgColor: string;
  ringColor: string;
  iconColor: string;
  packs: ResourcePack[];
}
