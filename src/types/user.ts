export interface UserProfile {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserStats {
  userId: string;
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  averageAttempts: number;
}
