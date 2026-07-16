"use server";

export async function signInWithOAuth(_provider: "google" | "github") {
  // TODO: реализовать OAuth через Supabase
  throw new Error("Not implemented");
}

export async function signOut() {
  // TODO: реализовать выход
  throw new Error("Not implemented");
}

export async function getCurrentUser() {
  // TODO: получить текущего пользователя
  return null;
}
