/** One confirmed passenger row in the driver-facing CSV manifest. */
export interface ManifestRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  seats: number;
  paid: boolean;
  status: string;
}

const CSV_HEADER = ['name', 'email', 'phone', 'seats', 'paid', 'status'];

/**
 * RFC 4180 CSV of confirmed passengers: name, contact, seats, paid, status.
 */
export function buildPassengerManifestCsv(rows: readonly ManifestRow[]): string {
  const lines = [CSV_HEADER.join(',')];
  for (const row of rows) {
    const name = `${row.firstName} ${row.lastName}`.trim();
    lines.push(
      [
        csvField(name),
        csvField(row.email),
        csvField(row.phone ?? ''),
        csvField(String(row.seats)),
        csvField(row.paid ? 'yes' : 'no'),
        csvField(row.status),
      ].join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Concert-day filename: `manifest-{artist}-{city}-{YYYY-MM-DD}.csv`.
 * Artist/city are slugified to `[a-z0-9-]+` so the value is header-safe.
 */
export function manifestFilename(
  artist: string,
  city: string,
  startAt: Date,
): string {
  const date = startAt.toISOString().slice(0, 10);
  return `manifest-${slug(artist)}-${slug(city)}-${date}.csv`;
}

function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function slug(value: string): string {
  const slugged = value
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
  return slugged || 'unknown';
}
