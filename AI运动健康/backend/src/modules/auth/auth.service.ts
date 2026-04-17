import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUtil, JwtPayload } from '../../common/utils/jwt.util';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户注册
   */
  async register(dto: RegisterDto) {
    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        nickname: dto.nickname || dto.email.split('@')[0],
        profile: dto.profile
          ? {
              create: {
                ...dto.profile,
                targetCalories: dto.profile.targetCalories ?? 2000,
              },
            }
          : {
              create: {
                gender: dto.profile?.gender || 'MALE',
                targetCalories: 2000,
              },
            },
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE',
          },
        },
      },
      include: {
        profile: true,
        subscription: true,
      },
    });

    // 生成token
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * 用户登录
   */
  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * 验证用户
   */
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        subscription: true,
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * 刷新token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = JwtUtil.verifyRefreshToken(refreshToken);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          profile: true,
          subscription: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      const tokens = await this.generateTokens(user.id, user.email);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('刷新token无效');
    }
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  private async generateTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = JwtUtil.generateAccessToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * 清除用户敏感信息
   */
  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('原密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  }

  /**
   * 重置密码
   */
  async resetPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // 安全考虑，不透露用户是否存在
      return { success: true };
    }

    // TODO: 发送重置密码邮件
    // 生成重置token，发送邮件

    return { success: true };
  }

  /**
   * 第三方登录（预留）
   */
  async oauthLogin(provider: string, oauthId: string, profile: any) {
    let user = await this.prisma.user.findFirst({
      where: {
        profile: {
          // TODO: 添加OAuth关联字段
        },
      },
      include: {
        profile: true,
        subscription: true,
      },
    });

    if (!user) {
      // 创建新用户
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          password: '', // OAuth用户无密码
          nickname: profile.name,
          profile: {
            create: {},
          },
          subscription: {
            create: {
              plan: 'FREE',
              status: 'ACTIVE',
            },
          },
        },
        include: {
          profile: true,
          subscription: true,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }
}
