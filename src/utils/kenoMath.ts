import { KenoDraw, NumberStat, OverallStats, SimulationResult } from '../types/keno';

// Combinations nCr calculation using logarithmic sum to avoid integer overflow
export function combinations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  if (r > n / 2) r = n - r;

  let res = 1;
  for (let i = 1; i <= r; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return Math.round(res);
}

// Theoretical Hypergeometric probability of hitting k numbers when picking n spots
// Total balls = 80, Drawn balls = 20
// Formula: [ C(20, k) * C(60, n - k) ] / C(80, n)
export function getHypergeometricProb(nSpots: number, kHits: number): number {
  if (kHits < 0 || kHits > nSpots || kHits > 20) return 0;
  if (nSpots - kHits > 60) return 0;

  const favorable = combinations(20, kHits) * combinations(60, nSpots - kHits);
  const total = combinations(80, nSpots);
  if (total === 0) return 0;
  return favorable / total;
}

// Generate random 20 numbers from 1 to 80 (Fisher-Yates sampling)
export function generateRandomDrawNumbers(): number[] {
  const pool = Array.from({ length: 80 }, (_, i) => i + 1);
  const result: number[] = [];
  for (let i = 0; i < 20; i++) {
    const randomIndex = Math.floor(Math.random() * (pool.length - i)) + i;
    const temp = pool[i];
    pool[i] = pool[randomIndex];
    pool[randomIndex] = temp;
    result.push(pool[i]);
  }
  return result.sort((a, b) => a - b);
}

// Generate a random ticket of spots (e.g. 5, 8, 10 spots)
export function generateQuickPickTicket(spotCount: number = 10): number[] {
  const count = Math.min(Math.max(1, spotCount), 15);
  const pool = Array.from({ length: 80 }, (_, i) => i + 1);
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * (pool.length - i)) + i;
    const temp = pool[i];
    pool[i] = pool[randomIndex];
    pool[randomIndex] = temp;
    result.push(pool[i]);
  }
  return result.sort((a, b) => a - b);
}

// Compute comprehensive statistics across all draws
export function computeOverallStats(draws: KenoDraw[]): OverallStats {
  const totalDraws = draws.length;
  const countMap: Record<number, number> = {};
  const lastSeenMap: Record<number, number> = {}; // draw index (0 is newest)

  for (let i = 1; i <= 80; i++) {
    countMap[i] = 0;
    lastSeenMap[i] = totalDraws; // if never seen, gap is totalDraws
  }

  let totalSum = 0;
  let totalOdds = 0;
  let totalEvens = 0;
  let totalLows = 0;
  let totalHighs = 0;
  const pairCounts: Record<string, number> = {};
  const decadeCounts: Record<string, number> = {
    '1-10': 0,
    '11-20': 0,
    '21-30': 0,
    '31-40': 0,
    '41-50': 0,
    '51-60': 0,
    '61-70': 0,
    '71-80': 0,
  };

  // Draws are ordered: index 0 is newest, or we assume sorted by timestamp descending
  // Let's sort draws by timestamp descending
  const sortedDraws = [...draws].sort((a, b) => b.drawNumber - a.drawNumber);

  sortedDraws.forEach((draw, drawIndex) => {
    let drawOdds = 0;
    let drawLows = 0;
    let drawSum = 0;

    const nums = draw.numbers;
    nums.forEach((num) => {
      countMap[num] = (countMap[num] || 0) + 1;
      if (lastSeenMap[num] === totalDraws) {
        lastSeenMap[num] = drawIndex; // first time encountering from top (newest)
      }

      drawSum += num;
      if (num % 2 !== 0) drawOdds++;
      if (num <= 40) drawLows++;

      const decIndex = Math.min(Math.floor((num - 1) / 10), 7);
      const decKey = `${decIndex * 10 + 1}-${decIndex * 10 + 10}`;
      decadeCounts[decKey] = (decadeCounts[decKey] || 0) + 1;
    });

    totalSum += drawSum;
    totalOdds += drawOdds;
    totalEvens += 20 - drawOdds;
    totalLows += drawLows;
    totalHighs += 20 - drawLows;

    // Track common pairs among top combinations
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`;
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }
    }
  });

  const avgFreq = totalDraws > 0 ? (totalDraws * 20) / 80 : 0;
  const statsList: NumberStat[] = [];

  for (let num = 1; num <= 80; num++) {
    const cnt = countMap[num] || 0;
    const pct = totalDraws > 0 ? (cnt / totalDraws) * 100 : 0;
    const gap = lastSeenMap[num];

    statsList.push({
      number: num,
      count: cnt,
      percentage: Number(pct.toFixed(1)),
      drawsSinceLastHit: gap,
      isHot: false,
      isCold: false,
      isDue: false,
    });
  }

  // Determine Hot (top 12 by count), Cold (bottom 12 by count), Due (longest gap)
  const byCount = [...statsList].sort((a, b) => b.count - a.count);
  const hotThreshold = byCount[Math.min(11, byCount.length - 1)]?.count ?? avgFreq;
  const coldThreshold = byCount[Math.max(0, byCount.length - 12)]?.count ?? avgFreq;

  const byGap = [...statsList].sort((a, b) => b.drawsSinceLastHit - a.drawsSinceLastHit);
  const dueThreshold = byGap[Math.min(11, byGap.length - 1)]?.drawsSinceLastHit ?? 0;

  const numberStats: Record<number, NumberStat> = {};
  statsList.forEach((stat) => {
    stat.isHot = totalDraws >= 5 && stat.count >= hotThreshold && stat.count > avgFreq;
    stat.isCold = totalDraws >= 5 && stat.count <= coldThreshold && stat.count < avgFreq;
    stat.isDue = totalDraws >= 5 && stat.drawsSinceLastHit >= dueThreshold && stat.drawsSinceLastHit > 0;
    numberStats[stat.number] = stat;
  });

  const hotNumbers = byCount.slice(0, 10).map((s) => numberStats[s.number]);
  const coldNumbers = [...byCount].reverse().slice(0, 10).map((s) => numberStats[s.number]);
  const dueNumbers = [...statsList]
    .sort((a, b) => b.drawsSinceLastHit - a.drawsSinceLastHit)
    .slice(0, 10);

  // Top pairs
  const topPairs = Object.entries(pairCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key, count]) => {
      const [n1, n2] = key.split('-').map(Number);
      return { pair: [n1, n2] as [number, number], count };
    });

  return {
    totalDraws,
    numberStats,
    hotNumbers,
    coldNumbers,
    dueNumbers,
    avgSum: totalDraws > 0 ? Math.round(totalSum / totalDraws) : 810,
    avgOddCount: totalDraws > 0 ? Number((totalOdds / totalDraws).toFixed(1)) : 10.0,
    avgEvenCount: totalDraws > 0 ? Number((totalEvens / totalDraws).toFixed(1)) : 10.0,
    avgLowCount: totalDraws > 0 ? Number((totalLows / totalDraws).toFixed(1)) : 10.0,
    avgHighCount: totalDraws > 0 ? Number((totalHighs / totalDraws).toFixed(1)) : 10.0,
    topPairs,
    decadeDistribution: decadeCounts,
  };
}

// Monte Carlo Simulation of N draws against user's chosen spots
export function runMonteCarloSimulation(
  userSpots: number[],
  numSimulations: number = 1000
): SimulationResult {
  const nSpots = userSpots.length;
  const userSpotsSet = new Set(userSpots);
  const hitDistribution: Record<number, number> = {};

  for (let k = 0; k <= nSpots; k++) {
    hitDistribution[k] = 0;
  }

  let maxHitAchieved = 0;

  for (let sim = 0; sim < numSimulations; sim++) {
    // Pick 20 numbers randomly
    const drawn = generateRandomDrawNumbers();
    let hits = 0;
    for (const num of drawn) {
      if (userSpotsSet.has(num)) {
        hits++;
      }
    }
    hitDistribution[hits] = (hitDistribution[hits] || 0) + 1;
    if (hits > maxHitAchieved) maxHitAchieved = hits;
  }

  const empiricalProbabilities: Record<number, number> = {};
  const theoreticalProbabilities: Record<number, number> = {};

  for (let k = 0; k <= nSpots; k++) {
    empiricalProbabilities[k] = Number(((hitDistribution[k] / numSimulations) * 100).toFixed(2));
    theoreticalProbabilities[k] = Number((getHypergeometricProb(nSpots, k) * 100).toFixed(2));
  }

  return {
    totalSimulations: numSimulations,
    selectedSpots: [...userSpots],
    hitDistribution,
    empiricalProbabilities,
    theoreticalProbabilities,
    maxHitAchieved,
  };
}

// Pre-seeded initial educational dataset representing realistic recorded Keno draw history
export const INITIAL_KENO_DRAWS: KenoDraw[] = [
  {
    id: 'draw-35',
    drawNumber: 1035,
    timestamp: '2026-10-30T04:45:00Z',
    numbers: [3, 7, 12, 18, 22, 29, 34, 38, 41, 47, 50, 53, 58, 62, 65, 69, 71, 74, 78, 80],
    notes: 'Evening draw - High cluster in 60s & 70s',
  },
  {
    id: 'draw-34',
    drawNumber: 1034,
    timestamp: '2026-10-30T04:30:00Z',
    numbers: [1, 5, 8, 14, 19, 21, 27, 33, 36, 42, 45, 49, 52, 57, 61, 64, 68, 72, 76, 79],
    notes: 'Even split 10 Low / 10 High',
  },
  {
    id: 'draw-33',
    drawNumber: 1033,
    timestamp: '2026-10-30T04:15:00Z',
    numbers: [4, 9, 13, 16, 23, 28, 31, 37, 40, 44, 48, 51, 55, 59, 63, 67, 70, 73, 77, 80],
    notes: 'Consecutive pairs 70, 73, 77, 80',
  },
  {
    id: 'draw-32',
    drawNumber: 1032,
    timestamp: '2026-10-30T04:00:00Z',
    numbers: [2, 6, 11, 15, 20, 24, 26, 32, 35, 39, 43, 46, 54, 56, 60, 66, 69, 74, 75, 78],
    notes: 'High concentration of evens (13/20)',
  },
  {
    id: 'draw-31',
    drawNumber: 1031,
    timestamp: '2026-10-30T03:45:00Z',
    numbers: [7, 10, 14, 17, 22, 25, 30, 34, 38, 41, 47, 50, 53, 58, 62, 65, 71, 74, 77, 79],
    notes: '#7 and #14 hit again',
  },
  {
    id: 'draw-30',
    drawNumber: 1030,
    timestamp: '2026-10-30T03:30:00Z',
    numbers: [3, 8, 12, 19, 21, 27, 33, 36, 42, 45, 48, 52, 57, 61, 64, 68, 72, 76, 78, 80],
  },
  {
    id: 'draw-29',
    drawNumber: 1029,
    timestamp: '2026-10-30T03:15:00Z',
    numbers: [1, 4, 9, 15, 18, 24, 29, 32, 37, 43, 46, 51, 55, 59, 63, 67, 70, 73, 75, 79],
  },
  {
    id: 'draw-28',
    drawNumber: 1028,
    timestamp: '2026-10-30T03:00:00Z',
    numbers: [5, 11, 16, 20, 23, 28, 31, 35, 40, 44, 49, 53, 56, 60, 65, 69, 71, 74, 77, 80],
  },
  {
    id: 'draw-27',
    drawNumber: 1027,
    timestamp: '2026-10-30T02:45:00Z',
    numbers: [2, 6, 10, 13, 17, 22, 26, 30, 34, 39, 41, 47, 50, 54, 58, 62, 66, 72, 76, 78],
  },
  {
    id: 'draw-26',
    drawNumber: 1026,
    timestamp: '2026-10-30T02:30:00Z',
    numbers: [7, 12, 14, 18, 21, 25, 29, 33, 38, 42, 45, 48, 52, 57, 61, 64, 68, 70, 73, 77],
  },
  {
    id: 'draw-25',
    drawNumber: 1025,
    timestamp: '2026-10-30T02:15:00Z',
    numbers: [3, 8, 11, 16, 19, 24, 27, 32, 36, 40, 43, 46, 51, 55, 59, 63, 67, 71, 75, 79],
  },
  {
    id: 'draw-24',
    drawNumber: 1024,
    timestamp: '2026-10-30T02:00:00Z',
    numbers: [1, 5, 9, 13, 20, 23, 28, 31, 35, 39, 44, 49, 53, 56, 60, 65, 69, 72, 74, 80],
  },
  {
    id: 'draw-23',
    drawNumber: 1023,
    timestamp: '2026-10-30T01:45:00Z',
    numbers: [4, 7, 10, 15, 17, 22, 26, 30, 34, 38, 41, 47, 50, 54, 58, 62, 66, 70, 76, 78],
  },
  {
    id: 'draw-22',
    drawNumber: 1022,
    timestamp: '2026-10-30T01:30:00Z',
    numbers: [2, 6, 12, 14, 18, 21, 25, 29, 33, 37, 42, 45, 48, 52, 57, 61, 64, 68, 73, 77],
  },
  {
    id: 'draw-21',
    drawNumber: 1021,
    timestamp: '2026-10-30T01:15:00Z',
    numbers: [8, 11, 16, 19, 23, 27, 31, 36, 40, 43, 46, 51, 55, 59, 63, 67, 71, 74, 75, 79],
  },
  {
    id: 'draw-20',
    drawNumber: 1020,
    timestamp: '2026-10-30T01:00:00Z',
    numbers: [3, 5, 9, 13, 20, 24, 28, 32, 35, 39, 44, 49, 53, 56, 60, 65, 69, 72, 77, 80],
  },
  {
    id: 'draw-19',
    drawNumber: 1019,
    timestamp: '2026-10-30T00:45:00Z',
    numbers: [1, 7, 10, 15, 17, 22, 26, 30, 34, 38, 41, 47, 50, 54, 58, 62, 66, 70, 73, 78],
  },
  {
    id: 'draw-18',
    drawNumber: 1018,
    timestamp: '2026-10-30T00:30:00Z',
    numbers: [4, 6, 12, 14, 18, 21, 25, 29, 33, 37, 42, 45, 48, 52, 57, 61, 64, 68, 74, 76],
  },
  {
    id: 'draw-17',
    drawNumber: 1017,
    timestamp: '2026-10-30T00:15:00Z',
    numbers: [2, 8, 11, 16, 19, 23, 27, 31, 36, 40, 43, 46, 51, 55, 59, 63, 67, 71, 75, 79],
  },
  {
    id: 'draw-16',
    drawNumber: 1016,
    timestamp: '2026-10-30T00:00:00Z',
    numbers: [3, 5, 9, 13, 20, 24, 28, 32, 35, 39, 44, 49, 53, 56, 60, 65, 69, 72, 77, 80],
  },
];
