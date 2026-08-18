import { Trip } from '../models/trip.model';

/** Triggers a same-tab file download from a Blob. */
export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Reads `filename="..."` from a Content-Disposition header. */
export function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const match = /filename="([^"]+)"/.exec(header);
  return match?.[1] ?? null;
}

/** Fallback when the response does not expose Content-Disposition. */
export function fallbackManifestFilename(
  trip: Pick<Trip, 'concertArtist' | 'concertCity' | 'departureAt'>,
): string {
  const date = trip.departureAt.slice(0, 10);
  return `manifest-${slug(trip.concertArtist)}-${slug(trip.concertCity)}-${date}.csv`;
}

function slug(value: string): string {
  const slugged = value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
  return slugged || 'unknown';
}
