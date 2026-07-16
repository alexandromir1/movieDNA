"use client";

import type { UserProfile } from "@/types/user";

interface UseAuthReturn {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  // TODO: реализовать аутентификацию через Supabase
  return {
    user: null,
    isLoading: true,
    signIn: async () => {},
    signOut: async () => {},
  };
}
