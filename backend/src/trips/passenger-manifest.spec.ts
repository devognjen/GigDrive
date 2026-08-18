import { buildPassengerManifestCsv, manifestFilename } from './passenger-manifest';

describe('buildPassengerManifestCsv', () => {
  it('emits a header-only CSV when there are no rows', () => {
    expect(buildPassengerManifestCsv([])).toBe(
      'name,email,phone,seats,paid,status\n',
    );
  });

  it('maps name, contact, seats, paid flag, and status', () => {
    const csv = buildPassengerManifestCsv([
      {
        firstName: 'Ana',
        lastName: 'Passenger',
        email: 'ana@gigdrive.demo',
        phone: '+38160111222',
        seats: 2,
        paid: true,
        status: 'CONFIRMED',
      },
    ]);

    expect(csv).toBe(
      'name,email,phone,seats,paid,status\n' +
        'Ana Passenger,ana@gigdrive.demo,+38160111222,2,yes,CONFIRMED\n',
    );
  });

  it('leaves phone empty when it is null and paid as no when unpaid', () => {
    const csv = buildPassengerManifestCsv([
      {
        firstName: 'Pat',
        lastName: 'Rider',
        email: 'pat@gigdrive.demo',
        phone: null,
        seats: 1,
        paid: false,
        status: 'CONFIRMED',
      },
    ]);

    expect(csv).toContain('Pat Rider,pat@gigdrive.demo,,1,no,CONFIRMED');
  });

  it('quotes fields that contain commas or quotes', () => {
    const csv = buildPassengerManifestCsv([
      {
        firstName: 'Ada',
        lastName: 'Lovelace, Esq.',
        email: 'ada@example.com',
        phone: null,
        seats: 1,
        paid: false,
        status: 'CONFIRMED',
      },
    ]);

    expect(csv).toContain('"Ada Lovelace, Esq.",ada@example.com,,1,no,CONFIRMED');

    const quoted = buildPassengerManifestCsv([
      {
        firstName: 'Ann "The Ace"',
        lastName: 'Rider',
        email: 'ann@example.com',
        phone: null,
        seats: 1,
        paid: true,
        status: 'CONFIRMED',
      },
    ]);
    expect(quoted).toContain('"Ann ""The Ace"" Rider"');
  });
});

describe('manifestFilename', () => {
  it('builds a slugified artist-city-date filename', () => {
    expect(
      manifestFilename(
        'The Demo Band',
        'Novi Sad',
        new Date('2026-09-10T18:00:00.000Z'),
      ),
    ).toBe('manifest-the-demo-band-novi-sad-2026-09-10.csv');
  });

  it('strips diacritics and falls back when a part is empty', () => {
    expect(
      manifestFilename('Čačak Live!', '', new Date('2026-08-18T00:00:00.000Z')),
    ).toBe('manifest-cacak-live-unknown-2026-08-18.csv');
  });
});
