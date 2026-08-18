import { toLocalInput, todayIsoDate, shiftLocalInput } from './local-datetime';

describe('local-datetime', () => {
  it('formats a Date as YYYY-MM-DDTHH:mm in local time', () => {
    const date = new Date(2026, 8, 1, 14, 5);
    expect(toLocalInput(date)).toBe('2026-09-01T14:05');
  });

  it('returns the local calendar day', () => {
    expect(todayIsoDate(new Date(2026, 8, 1, 23, 30))).toBe('2026-09-01');
  });

  it('adds minutes to a datetime-local value', () => {
    expect(shiftLocalInput('2026-09-01T12:00', 1)).toBe('2026-09-01T12:01');
  });

  it('returns empty when shifting an empty value', () => {
    expect(shiftLocalInput('', -1)).toBe('');
  });
});
