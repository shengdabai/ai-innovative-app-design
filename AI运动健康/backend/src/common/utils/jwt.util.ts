import * as jwt from 'jsonwebtoken';

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
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );
  }

  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(
      { sub: payload.sub, email: payload.email },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' },
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
