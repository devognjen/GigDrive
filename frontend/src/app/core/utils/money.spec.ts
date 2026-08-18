import { fromMinorUnits, toMinorUnits } from './money';

describe('money', () => {
  it('converts major units to integer cents', () => {
    expect(toMinorUnits(120)).toBe(12000);
    expect(toMinorUnits(19.99)).toBe(1999);
  });

  it('converts integer cents to major units', () => {
    expect(fromMinorUnits(12000)).toBe(120);
    expect(fromMinorUnits(1999)).toBe(19.99);
  });

  it('round-trips typical form amounts', () => {
    expect(fromMinorUnits(toMinorUnits(120.5))).toBe(120.5);
    expect(toMinorUnits(fromMinorUnits(1))).toBe(1);
  });
});
