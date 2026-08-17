export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export interface ConcertSnippet {
  artist: string;
  city: string;
  venue: string;
  startAt: Date;
}

export interface TripEmailContext {
  recipientFirstName: string;
  driverName: string;
  concert: ConcertSnippet;
  departureAt: Date;
  inviteLink?: string;
  groupName?: string;
}

export interface BookingEmailContext extends TripEmailContext {
  passengerName: string;
  seats: number;
}

export type TripMailEvent =
  | 'TRIP_READY'
  | 'TRIP_CONFIRMED'
  | 'TRIP_CANCELLED'
  | 'TRIP_REMINDER'
  | 'SIGNAL_INVITE';

export type BookingMailEvent =
  'BOOKING_REQUESTED' | 'BOOKING_ACCEPTED' | 'BOOKING_REJECTED';

export function renderTripEmail(
  type: TripMailEvent,
  ctx: TripEmailContext,
): RenderedEmail {
  switch (type) {
    case 'TRIP_READY':
      return tripReady(ctx);
    case 'TRIP_CONFIRMED':
      return tripConfirmed(ctx);
    case 'TRIP_CANCELLED':
      return tripCancelled(ctx);
    case 'TRIP_REMINDER':
      return tripReminder(ctx);
    case 'SIGNAL_INVITE':
      return signalInvite(ctx);
  }
}

export function renderBookingEmail(
  type: BookingMailEvent,
  ctx: BookingEmailContext,
): RenderedEmail {
  switch (type) {
    case 'BOOKING_REQUESTED':
      return bookingRequested(ctx);
    case 'BOOKING_ACCEPTED':
      return bookingAccepted(ctx);
    case 'BOOKING_REJECTED':
      return bookingRejected(ctx);
  }
}

export function formatUtc(date: Date): string {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date);
  return `${formatted} UTC`;
}

function tripReady(ctx: TripEmailContext): RenderedEmail {
  const { artist, city } = ctx.concert;
  return compose(
    ctx,
    `Your ${artist} trip is ready to confirm`,
    `your trip to ${artist} in ${city} has reached the minimum number of passengers. Confirm it in GigDrive so the crew can go.`,
  );
}

function tripConfirmed(ctx: TripEmailContext): RenderedEmail {
  const { artist, city } = ctx.concert;
  return compose(
    ctx,
    `Trip confirmed: ${artist} in ${city}`,
    `the trip to ${artist} in ${city} is confirmed. See you on the road.`,
  );
}

function tripCancelled(ctx: TripEmailContext): RenderedEmail {
  const { artist, city } = ctx.concert;
  return compose(
    ctx,
    `Trip cancelled: ${artist} in ${city}`,
    `the trip to ${artist} in ${city} has been cancelled.`,
  );
}

function tripReminder(ctx: TripEmailContext): RenderedEmail {
  const { artist, city } = ctx.concert;
  return compose(
    ctx,
    `Reminder: ${artist} trip departs tomorrow`,
    `this is a reminder that your trip to ${artist} in ${city} departs in about 24 hours.`,
  );
}

function signalInvite(ctx: TripEmailContext): RenderedEmail {
  const { artist, city } = ctx.concert;
  const groupName = ctx.groupName ?? `🎵 ${artist} — ${city}`;
  const link = ctx.inviteLink ?? '';
  const greeting = `Hi ${ctx.recipientFirstName},`;
  const body = `the crew Signal group "${groupName}" is ready. Open the invite link below to join. GigDrive never collects phone numbers for Signal.`;
  const details = tripDetails(ctx);
  const signOff = '— GigDrive';
  const subject = `Signal group for ${artist} in ${city}`;
  const text = [greeting, '', body, '', link, '', details, '', signOff].join(
    '\n',
  );
  const html = wrapHtml(
    subject,
    [
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>${escapeHtml(body)}</p>`,
      `<p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>`,
      `<p>${escapeHtml(details).replaceAll('\n', '<br />')}</p>`,
      `<p>${escapeHtml(signOff)}</p>`,
    ].join('\n'),
  );
  return { subject, text, html };
}

function bookingRequested(ctx: BookingEmailContext): RenderedEmail {
  const { artist, city } = ctx.concert;
  const seats = seatLabel(ctx.seats);
  return compose(
    ctx,
    `New booking request for ${artist} in ${city}`,
    `${ctx.passengerName} requested ${seats} on your trip to ${artist} in ${city}. Log in to GigDrive to accept or reject.`,
  );
}

function bookingAccepted(ctx: BookingEmailContext): RenderedEmail {
  const { artist, city } = ctx.concert;
  const seats = seatLabel(ctx.seats);
  return compose(
    ctx,
    `Your booking for ${artist} was accepted`,
    `${ctx.driverName} accepted your request for ${seats} on the trip to ${artist} in ${city}.`,
  );
}

function bookingRejected(ctx: BookingEmailContext): RenderedEmail {
  const { artist, city } = ctx.concert;
  const seats = seatLabel(ctx.seats);
  return compose(
    ctx,
    `Your booking for ${artist} was declined`,
    `${ctx.driverName} declined your request for ${seats} on the trip to ${artist} in ${city}.`,
  );
}

function compose(
  ctx: TripEmailContext,
  subject: string,
  body: string,
): RenderedEmail {
  const greeting = `Hi ${ctx.recipientFirstName},`;
  const details = tripDetails(ctx);
  const signOff = '— GigDrive';
  const text = [greeting, '', body, '', details, '', signOff].join('\n');
  const html = wrapHtml(
    subject,
    [
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>${escapeHtml(body)}</p>`,
      `<p>${escapeHtml(details).replaceAll('\n', '<br />')}</p>`,
      `<p>${escapeHtml(signOff)}</p>`,
    ].join('\n'),
  );
  return { subject, text, html };
}

function tripDetails(ctx: TripEmailContext): string {
  const { artist, venue, city, startAt } = ctx.concert;
  return [
    `Concert: ${artist} at ${venue}, ${city} (${formatUtc(startAt)})`,
    `Departure: ${formatUtc(ctx.departureAt)}`,
    `Driver: ${ctx.driverName}`,
  ].join('\n');
}

function seatLabel(seats: number): string {
  return seats === 1 ? '1 seat' : `${seats} seats`;
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="font-family: sans-serif; line-height: 1.5; color: #111;">
    ${body}
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
