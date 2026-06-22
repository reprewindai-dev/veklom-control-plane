import { meetsTier, Tier, normalizeTier } from '../tiers';

describe('Tier Utils', () => {
  describe('meetsTier', () => {
    it('returns true when current tier is strictly greater than required tier', () => {
      expect(meetsTier('pro', 'starter')).toBe(true);
      expect(meetsTier('enterprise', 'pro')).toBe(true);
      expect(meetsTier('sovereign', 'free')).toBe(true);
    });

    it('returns true when current tier is equal to required tier', () => {
      expect(meetsTier('free', 'free')).toBe(true);
      expect(meetsTier('starter', 'starter')).toBe(true);
      expect(meetsTier('enterprise', 'enterprise')).toBe(true);
    });

    it('returns false when current tier is less than required tier', () => {
      expect(meetsTier('free', 'starter')).toBe(false);
      expect(meetsTier('pro', 'enterprise')).toBe(false);
      expect(meetsTier('starter', 'sovereign')).toBe(false);
    });

    it('handles undefined current tier', () => {
      // When current is undefined, it does not meet any tier, even "free"
      expect(meetsTier(undefined, 'free')).toBe(false);
      expect(meetsTier(undefined, 'starter')).toBe(false);
      expect(meetsTier(undefined, 'enterprise')).toBe(false);
    });
  });

  describe('normalizeTier', () => {
    it('normalizes matching strings correctly', () => {
      expect(normalizeTier('Enterprise')).toBe('enterprise');
      expect(normalizeTier('SOVEREIGN')).toBe('sovereign');
      expect(normalizeTier('Pro')).toBe('pro');
      expect(normalizeTier('Starter')).toBe('starter');
      expect(normalizeTier('Free')).toBe('free');
    });

    it('normalizes alias strings correctly', () => {
      expect(normalizeTier('Basic')).toBe('starter');
    });

    it('falls back to "free" for unrecognized strings', () => {
      expect(normalizeTier('unknown')).toBe('free');
      expect(normalizeTier('premium')).toBe('free');
    });

    it('handles undefined/null by returning "free"', () => {
      expect(normalizeTier(undefined)).toBe('free');
      expect(normalizeTier(null)).toBe('free');
    });
  });
});
