export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function titlesMatch(guess: string, ...titles: Array<string | null | undefined>): boolean {
  const normalizedGuess = normalizeTitle(guess);
  if (!normalizedGuess) return false;

  return titles.some((title) => {
    if (!title) return false;
    return normalizeTitle(title) === normalizedGuess;
  });
}
