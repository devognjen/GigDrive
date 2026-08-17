import { roundToOneDecimal } from './driver-rating';

describe('roundToOneDecimal', () => {
  it('rounds half up to a single decimal place', () => {
    expect(roundToOneDecimal(4.66)).toBe(4.7);
    expect(roundToOneDecimal(4.5)).toBe(4.5);
    expect(roundToOneDecimal(5)).toBe(5);
  });
});
