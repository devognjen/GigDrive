import {
  BookingEmailContext,
  formatUtc,
  renderBookingEmail,
  renderTripEmail,
  renderWaitlistEmail,
  TripEmailContext,
  WaitlistEmailContext,
} from './email-templates';

describe('email templates', () => {
  const ctx: TripEmailContext = {
    recipientFirstName: 'Dana',
    driverName: 'Dana Driver',
    concert: {
      artist: 'Rammstein',
      city: 'Vienna',
      venue: 'Ernst-Happel-Stadion',
      startAt: new Date('2026-08-20T19:00:00Z'),
    },
    departureAt: new Date('2026-08-20T15:00:00Z'),
  };

  const bookingCtx: BookingEmailContext = {
    ...ctx,
    passengerName: 'Pat Rider',
    seats: 2,
  };

  const waitlistCtx: WaitlistEmailContext = {
    ...ctx,
    position: 1,
    seats: 2,
  };

  it('formats UTC timestamps for the demo copy', () => {
    expect(formatUtc(ctx.concert.startAt)).toContain('2026');
    expect(formatUtc(ctx.concert.startAt)).toContain('UTC');
  });

  it.each([
    'TRIP_READY',
    'TRIP_CONFIRMED',
    'TRIP_CANCELLED',
    'TRIP_REMINDER',
  ] as const)('renders %s with subject, text, and html', (type) => {
    const email = renderTripEmail(type, ctx);
    expect(email.subject).toContain('Rammstein');
    expect(email.text).toContain('Hi Dana');
    expect(email.text).toContain('Vienna');
    expect(email.html).toContain('<p>');
    expect(email.html).toContain('Dana');
  });

  it('renders SIGNAL_INVITE with a clickable invite link', () => {
    const email = renderTripEmail('SIGNAL_INVITE', {
      ...ctx,
      groupName: '🎵 Rammstein — Vienna, 20 Aug 2026',
      inviteLink: 'https://signal.group/#invite',
    });
    expect(email.subject).toContain('Signal group');
    expect(email.text).toContain('https://signal.group/#invite');
    expect(email.text).toContain('never collects phone numbers');
    expect(email.html).toContain('href="https://signal.group/#invite"');
  });

  it.each([
    'BOOKING_REQUESTED',
    'BOOKING_ACCEPTED',
    'BOOKING_REJECTED',
  ] as const)('renders %s with subject, text, html, and seat count', (type) => {
    const email = renderBookingEmail(type, bookingCtx);
    expect(email.subject).toContain('Rammstein');
    expect(email.text).toContain('2 seats');
    expect(email.html).toContain('<p>');
  });

  it('names the passenger on a booking request to the driver', () => {
    const email = renderBookingEmail('BOOKING_REQUESTED', bookingCtx);
    expect(email.html).toContain('Pat Rider');
  });

  it('renders WAITLIST_SEAT_AVAILABLE with position and seats', () => {
    const email = renderWaitlistEmail('WAITLIST_SEAT_AVAILABLE', waitlistCtx);
    expect(email.subject).toContain('A seat opened');
    expect(email.subject).toContain('Rammstein');
    expect(email.text).toContain('#1');
    expect(email.text).toContain('2 seats');
    expect(email.text).toContain('does not reserve a seat');
    expect(email.html).toContain('<p>');
  });

  it('escapes HTML in names', () => {
    const email = renderTripEmail('TRIP_CONFIRMED', {
      ...ctx,
      recipientFirstName: '<script>alert(1)</script>',
    });
    expect(email.html).toContain('&lt;script&gt;');
    expect(email.html).not.toContain('<script>alert(1)</script>');
  });
});
