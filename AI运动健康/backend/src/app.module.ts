import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';

import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DietModule } from './modules/diet/diet.module';
import { MenuModule } from './modules/menu/menu.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ChatModule } from './modules/chat/chat.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { FoodsModule } from './modules/foods/foods.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // 配置模块 - 全局加载
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // 缓存模块
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get<string>('REDIS_PASSWORD', ''),
        ttl: 300,
        max: 100,
      }),
      inject: [ConfigService],
    }),

    // 限流模块
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ([{
        ttl: configService.get<number>('THROTTLE_TTL', 60) * 1000,
        limit: configService.get<number>('THROTTLE_LIMIT', 100),
      }]),
      inject: [ConfigService],
    }),

    // 定时任务模块
    ScheduleModule.forRoot(),

    // 业务模块
    PrismaModule,
    AuthModule,
    UsersModule,
    DietModule,
    MenuModule,
    AnalyticsModule,
    ChatModule,
    AchievementsModule,
    FoodsModule,
    RecipesModule,
    HealthModule,
  ],
})
export class AppModule {}
