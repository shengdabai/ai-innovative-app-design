import * as jwt from 'jsonwebtoken';

/** Value accepted by `jwt.sign`'s `expiresIn`: seconds, or an `ms`-style timespan such as "7d". */
export type JwtExpiresIn = NonNullable<jwt.SignOptions['expiresIn']>;
type JwtTimespan = Extract<JwtExpiresIn, string>;

// Same grammar the `ms` package (used by jsonwebtoken) accepts at runtime.
const TIMESPAN_PATTERN =
  /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i;

function isTimespan(value: string): value is JwtTimespan {
  return value.length <= 100 && TIMESPAN_PATTERN.test(value);
}

/**
 * Turns an env value such as JWT_EXPIRES_IN into a typed `expiresIn`.
 * Empty or missing values use the fallback; malformed values throw instead of
 * producing a token with an unexpected lifetime.
 */
export function resolveExpiresIn(
  raw: string | undefined,
  fallback: JwtTimespan,
): JwtExpiresIn {
  if (!raw) {
    return fallback;
  }
  if (!isTimespan(raw)) {
    throw new Error(
      `Invalid JWT expiresIn value "${raw}": use a timespan such as "7d", "12h" or "30m"`,
    );
  }
  return raw;
}

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export class JwtUtil {
  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(
      { sub: payload.sub, email: payload.email },
      process.env.JWT_SECRET!,
      { expiresIn: resolveExpiresIn(process.env.JWT_EXPIRES_IN, '7d') },
    );
  }

  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(
      { sub: payload.sub, email: payload.email },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: resolveExpiresIn(process.env.JWT_REFRESH_EXPIRES_IN, '30d') },
    );
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  }

  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
  }

  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
