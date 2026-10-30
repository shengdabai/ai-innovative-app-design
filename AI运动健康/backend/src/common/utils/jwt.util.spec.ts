import * as jwt from 'jsonwebtoken';
import { JwtUtil, resolveExpiresIn } from './jwt.util';

describe('resolveExpiresIn', () => {
  it('uses the fallback when the value is missing or empty', () => {
    expect(resolveExpiresIn(undefined, '7d')).toBe('7d');
    expect(resolveExpiresIn('', '30d')).toBe('30d');
  });

  it('accepts the timespans jsonwebtoken understands', () => {
    for (const value of ['15m', '12h', '7d', '2 weeks', '1.5h', '60000']) {
      expect(resolveExpiresIn(value, '7d')).toBe(value);
    }
  });

  it('rejects malformed values instead of signing with them', () => {
    for (const value of ['seven days', '7 fortnights', 'abc', '7d;']) {
      expect(() => resolveExpiresIn(value, '7d')).toThrow(/Invalid JWT expiresIn/);
    }
  });
});

describe('JwtUtil token lifetimes', () => {
  const saved = { ...process.env };

  beforeEach(() => {
    process.env.JWT_SECRET = 'unit-test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret';
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_REFRESH_EXPIRES_IN;
  });

  afterAll(() => {
    process.env = saved;
  });

  const payload = { sub: 'user-1', email: 'user@example.test' };

  function lifetimeSeconds(token: string): number {
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    return decoded.exp - decoded.iat;
  }

  it('defaults to 7 days for access tokens and 30 days for refresh tokens', () => {
    expect(lifetimeSeconds(JwtUtil.generateAccessToken(payload))).toBe(7 * 24 * 3600);
    expect(lifetimeSeconds(JwtUtil.generateRefreshToken(payload))).toBe(30 * 24 * 3600);
  });

  it('honours JWT_EXPIRES_IN / JWT_REFRESH_EXPIRES_IN', () => {
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '2d';
    expect(lifetimeSeconds(JwtUtil.generateAccessToken(payload))).toBe(15 * 60);
    expect(lifetimeSeconds(JwtUtil.generateRefreshToken(payload))).toBe(2 * 24 * 3600);
  });

  it('round-trips through verify with the matching secret', () => {
    const access = JwtUtil.generateAccessToken(payload);
    expect(JwtUtil.verifyAccessToken(access)).toMatchObject(payload);
    expect(() => JwtUtil.verifyRefreshToken(access)).toThrow();
  });

  it('throws on a malformed JWT_EXPIRES_IN', () => {
    process.env.JWT_EXPIRES_IN = 'forever';
    expect(() => JwtUtil.generateAccessToken(payload)).toThrow(/Invalid JWT expiresIn/);
  });
});
