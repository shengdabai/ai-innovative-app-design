import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully');

    // 开发环境打印查询日志
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // 按顺序删除，避免外键约束问题
    await this.userAchievement.deleteMany();
    await this.achievement.deleteMany();
    await this.chatMessage.deleteMany();
    await this.dailyCheckIn.deleteMany();
    await this.waterRecord.deleteMany();
    await this.workoutRecord.deleteMany();
    await this.weightRecord.deleteMany();
    await this.menuPlan.deleteMany();
    await this.mealRecord.deleteMany();
    await this.userProfile.deleteMany();
    await this.subscription.deleteMany();
    await this.user.deleteMany();
  }

  // 软删除扩展方法
  async softDelete(model: string, where: any) {
    return (this as any)[model].update({
      where,
      data: { deletedAt: new Date() },
    });
  }
}
