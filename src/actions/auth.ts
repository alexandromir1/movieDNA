"use server";

/** Auth не в soft launch — без throw, чтобы игрок не видел «Not implemented». */
export async function signInWithOAuth(_provider: "google" | "github") {
  return { ok: false as const, message: "Аккаунты скоро появятся." };
}

export async function signOut() {
  return { ok: false as const, message: "Аккаунты скоро появятся." };
}

export async function getCurrentUser() {
  return null;
}
