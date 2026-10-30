export interface KenoDraw {
  id: string;
  drawNumber: number;
  timestamp: string;
  numbers: number[]; // 20 unique numbers between 1 and 80
  notes?: string;
}

export interface NumberStat {
  number: number;
  count: number;
  percentage: number;
  drawsSinceLastHit: number;
  isHot: boolean;
  isCold: boolean;
  isDue: boolean;
}

export interface OverallStats {
  totalDraws: number;
  numberStats: Record<number, NumberStat>;
  hotNumbers: NumberStat[];
  coldNumbers: NumberStat[];
  dueNumbers: NumberStat[];
  avgSum: number;
  avgOddCount: number;
  avgEvenCount: number;
  avgLowCount: number; // 1-40
  avgHighCount: number; // 41-80
  topPairs: { pair: [number, number]; count: number }[];
  decadeDistribution: Record<string, number>;
}

export interface SimulationResult {
  totalSimulations: number;
  selectedSpots: number[];
  hitDistribution: Record<number, number>; // hit count -> occurrence count
  empiricalProbabilities: Record<number, number>; // hit count -> empirical %
  theoreticalProbabilities: Record<number, number>; // hit count -> theoretical %
  maxHitAchieved: number;
}

export interface GeneratedImageItem {
  id: string;
  type: 'create' | 'edit';
  prompt: string;
  imageUrl: string;
  originalImageUrl?: string;
  modelUsed: string;
  aspectRatio: string;
  imageSize: string;
  timestamp: string;
  textNote?: string;
}
