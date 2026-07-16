export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      movies: {
        Row: {
          id: string;
          title: string;
          title_original: string | null;
          year: number;
          frame_url: string;
          frame_urls: string[];
          sort_order: number;
          hints: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          title_original?: string | null;
          year: number;
          frame_url: string;
          frame_urls?: string[];
          sort_order: number;
          hints?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          title_original?: string | null;
          year?: number;
          frame_url?: string;
          frame_urls?: string[];
          sort_order?: number;
          hints?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_puzzles: {
        Row: {
          id: string;
          date: string;
          movie_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          movie_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          movie_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_puzzles_movie_id_fkey";
            columns: ["movie_id"];
            isOneToOne: false;
            referencedRelation: "movies";
            referencedColumns: ["id"];
          },
        ];
      };
      user_guesses: {
        Row: {
          id: string;
          user_id: string | null;
          puzzle_id: string;
          guess: string;
          is_correct: boolean;
          attempt_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          puzzle_id: string;
          guess: string;
          is_correct: boolean;
          attempt_number: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          puzzle_id?: string;
          guess?: string;
          is_correct?: boolean;
          attempt_number?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_guesses_puzzle_id_fkey";
            columns: ["puzzle_id"];
            isOneToOne: false;
            referencedRelation: "daily_puzzles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_stats: {
        Row: {
          user_id: string;
          games_played: number;
          games_won: number;
          current_streak: number;
          max_streak: number;
          average_attempts: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          games_played?: number;
          games_won?: number;
          current_streak?: number;
          max_streak?: number;
          average_attempts?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          games_played?: number;
          games_won?: number;
          current_streak?: number;
          max_streak?: number;
          average_attempts?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_movies: {
        Args: {
          search_query: string;
          result_limit?: number;
        };
        Returns: {
          id: string;
          title: string;
          title_original: string | null;
          year: number;
          score: number;
        };
        SetofOptions: {
          isSetofReturn: true;
          isOneToOne: false;
          isNotNullable: false;
          to: "movies";
          from: "*";
        };
      };
      normalize_movie_text: {
        Args: {
          input: string;
        };
        Returns: string;
      };
      ensure_daily_puzzle: {
        Args: {
          puzzle_date: string;
          p_movie_id: string;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
}
