/** True when Ticketmaster (or the user) supplied a title distinct from the artist. */
export function concertTitleDiffers(artist: string, title: string | null | undefined): boolean {
  return Boolean(title && title !== artist);
}

/** First letter of the artist name, for image placeholders. */
export function concertInitial(artist: string): string {
  const trimmed = artist.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
}
