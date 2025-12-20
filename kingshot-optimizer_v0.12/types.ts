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