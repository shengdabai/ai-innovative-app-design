import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementCategory } from '@prisma/client';

/**
 * 成就系统服务
 */
@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 初始化成就列表
   */
  async initializeAchievements() {
    const existingCount = await this.prisma.achievement.count();

    if (existingCount > 0) {
      return { message: '成就已初始化' };
    }

    const achievements = [
      // 连续打卡成就
      {
        name: '初出茅庐',
        description: '连续打卡3天',
        icon: '🌱',
        category: AchievementCategory.CHECK_IN,
        condition: { type: 'consecutive_check_in', days: 3 },
      },
      {
        name: '坚持不懈',
        description: '连续打卡7天',
        icon: '🔥',
        category: AchievementCategory.CHECK_IN,
        condition: { type: 'consecutive_check_in', days: 7 },
      },
      {
        name: '习惯养成',
        description: '连续打卡30天',
        icon: '💪',
        category: AchievementCategory.CHECK_IN,
        condition: { type: 'consecutive_check_in', days: 30 },
      },
      {
        name: '百日筑基',
        description: '连续打卡100天',
        icon: '🏆',
        category: AchievementCategory.CHECK_IN,
        condition: { type: 'consecutive_check_in', days: 100 },
      },

      // 运动成就
      {
        name: '运动新星',
        description: '累计运动100分钟',
        icon: '🏃',
        category: AchievementCategory.WORKOUT,
        condition: { type: 'total_workout_time', minutes: 100 },
      },
      {
        name: '运动达人',
        description: '累计运动500分钟',
        icon: '🏋️',
        category: AchievementCategory.WORKOUT,
        condition: { type: 'total_workout_time', minutes: 500 },
      },
      {
        name: '健身狂人',
        description: '累计运动1200分钟',
        icon: '🎖️',
        category: AchievementCategory.WORKOUT,
        condition: { type: 'total_workout_time', minutes: 1200 },
      },
      {
        name: '周周练',
        description: '一周内运动5次',
        icon: '📅',
        category: AchievementCategory.WORKOUT,
        condition: { type: 'weekly_workout', count: 5 },
      },

      // 营养成就
      {
        name: '饮食记录员',
        description: '记录50餐',
        icon: '📝',
        category: AchievementCategory.NUTRITION,
        condition: { type: 'total_meals', count: 50 },
      },
      {
        name: '营养大师',
        description: '连续14天营养达标',
        icon: '🥗',
        category: AchievementCategory.NUTRITION,
        condition: { type: 'consecutive_nutrition_goal', days: 14 },
      },
      {
        name: '水分充足',
        description: '连续7天达到饮水目标',
        icon: '💧',
        category: AchievementCategory.NUTRITION,
        condition: { type: 'consecutive_water_goal', days: 7 },
      },

      // 体重目标成就
      {
        name: '减重先锋',
        description: '成功减重5kg',
        icon: '⚖️',
        category: AchievementCategory.WEIGHT,
        condition: { type: 'weight_loss', kg: 5 },
      },
      {
        name: '瘦身达人',
        description: '成功减重10kg',
        icon: '🎯',
        category: AchievementCategory.WEIGHT,
        condition: { type: 'weight_loss', kg: 10 },
      },
    ];

    await this.prisma.achievement.createMany({
      data: achievements,
    });

    return { created: achievements.length };
  }

  /**
   * 获取所有成就列表
   */
  async getAchievements() {
    return this.prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * 获取用户已解锁的成就
   */
  async getUserAchievements(userId: string) {
    const unlocked = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });

    // 获取所有成就以标记哪些已解锁
    const allAchievements = await this.prisma.achievement.findMany();
    const unlockedIds = new Set(unlocked.map((ua) => ua.achievementId));

    return {
      unlocked: unlocked.map((ua) => ({
        ...ua.achievement,
        unlockedAt: ua.unlockedAt,
      })),
      locked: allAchievements
        .filter((a) => !unlockedIds.has(a.id))
        .map((a) => ({
          ...a,
          progress: 0, // TODO: 计算进度
        })),
    };
  }

  /**
   * 检查并解锁成就
   */
  async checkAndUnlockAchievements(userId: string) {
    const unlocked: any[] = [];

    // 获取所有成就
    const achievements = await this.prisma.achievement.findMany();
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
    });
    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    // 获取用户数据
    const userData = await this.getUserDataForAchievements(userId);

    // 检查每个成就
    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const shouldUnlock = this.checkAchievementCondition(
        achievement.condition as any,
        userData,
      );

      if (shouldUnlock) {
        await this.prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });

        unlocked.push(achievement);
      }
    }

    return {
      newUnlocks: unlocked.length,
      achievements: unlocked,
    };
  }

  /**
   * 获取用户成就数据
   */
  private async getUserDataForAchievements(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      latestCheckIn,
      totalWorkouts,
      weekWorkouts,
      totalMeals,
      latestWeight,
      firstWeight,
      weekMeals,
      weekWater,
    ] = await Promise.all([
      this.prisma.dailyCheckIn.findFirst({
        where: { userId },
        orderBy: { checkInDate: 'desc' },
      }),
      this.prisma.workoutRecord.aggregate({
        where: { userId },
        _sum: { duration: true },
      }),
      this.prisma.workoutRecord.count({
        where: {
          userId,
          workoutDate: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.mealRecord.count({ where: { userId } }),
      this.prisma.weightRecord.findFirst({
        where: { userId },
        orderBy: { recordDate: 'desc' },
      }),
      this.prisma.weightRecord.findFirst({
        where: { userId },
        orderBy: { recordDate: 'asc' },
      }),
      this.prisma.mealRecord.count({
        where: {
          userId,
          mealDate: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.waterRecord.aggregate({
        where: {
          userId,
          recordDate: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      consecutiveCheckIn: latestCheckIn?.streakCount || 0,
      totalWorkoutMinutes: totalWorkouts._sum.duration || 0,
      weeklyWorkoutCount: weekWorkouts,
      totalMeals,
      currentWeight: latestWeight?.weight,
      startWeight: firstWeight?.weight,
      weeklyMealCount: weekMeals,
      weeklyWaterAmount: weekWater._sum.amount || 0,
    };
  }

  /**
   * 检查成就条件
   */
  private checkAchievementCondition(condition: any, userData: any): boolean {
    switch (condition.type) {
      case 'consecutive_check_in':
        return userData.consecutiveCheckIn >= condition.days;

      case 'total_workout_time':
        return userData.totalWorkoutMinutes >= condition.minutes;

      case 'weekly_workout':
        return userData.weeklyWorkoutCount >= condition.count;

      case 'total_meals':
        return userData.totalMeals >= condition.count;

      case 'consecutive_nutrition_goal':
        // TODO: 实现连续营养达标检查
        return false;

      case 'consecutive_water_goal':
        // TODO: 实现连续饮水目标检查
        return false;

      case 'weight_loss':
        if (!userData.startWeight || !userData.currentWeight) return false;
        return userData.startWeight - userData.currentWeight >= condition.kg;

      default:
        return false;
    }
  }

  /**
   * 获取成就统计
   */
  async getAchievementStats(userId: string) {
    const total = await this.prisma.achievement.count();
    const unlocked = await this.prisma.userAchievement.count({
      where: { userId },
    });

    // 按分类统计
    const achievements = await this.prisma.achievement.findMany();
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    const byCategory: Record<string, { total: number; unlocked: number }> = {};

    for (const achievement of achievements) {
      const cat = achievement.category;
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, unlocked: 0 };
      }
      byCategory[cat].total++;
      if (unlockedIds.has(achievement.id)) {
        byCategory[cat].unlocked++;
      }
    }

    return {
      total,
      unlocked,
      progress: Math.round((unlocked / total) * 100) || 0,
      byCategory,
    };
  }
}
