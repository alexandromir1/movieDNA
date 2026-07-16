export interface CompletedGameRecord {
  date: string;
  won: boolean;
  attempts: number;
}

export type WinDistribution = Record<1 | 2 | 3 | 4 | 5 | 6, number>;

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  winDistribution: WinDistribution;
  completedGames: CompletedGameRecord[];
}

export const EMPTY_WIN_DISTRIBUTION: WinDistribution = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
};

export function createEmptyStats(): PlayerStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    winDistribution: { ...EMPTY_WIN_DISTRIBUTION },
    completedGames: [],
  };
}
