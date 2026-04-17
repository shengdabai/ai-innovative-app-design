import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { NutritionUtil } from '../../common/utils/nutrition.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户完整信息
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        subscription: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * 更新用户资料
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // 计算营养目标
    let targetCalories = dto.targetCalories;
    let targetProtein = dto.targetProtein;
    let targetCarbs = dto.targetCarbs;
    let targetFat = dto.targetFat;

    // 如果提供了身体数据，自动计算目标
    if (
      dto.height &&
      dto.weight &&
      dto.birthDate &&
      dto.gender &&
      dto.activityLevel &&
      dto.fitnessGoal
    ) {
      const age = this.calculateAge(dto.birthDate);
      const bmr = NutritionUtil.calculateBMR(
        dto.weight,
        dto.height,
        age,
        dto.gender,
      );
      const tdee = NutritionUtil.calculateTDEE(bmr, dto.activityLevel);
      targetCalories = NutritionUtil.calculateTargetCalories(tdee, dto.fitnessGoal);

      const macros = NutritionUtil.calculateMacros(targetCalories, dto.fitnessGoal);
      targetProtein = macros.protein;
      targetCarbs = macros.carbs;
      targetFat = macros.fat;
    }

    // 更新或创建profile
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...dto,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
      },
      update: {
        ...dto,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
      },
    });

    return profile;
  }

  /**
   * 更新订阅计划
   */
  async updateSubscription(
    userId: string,
    plan: 'MONTHLY' | 'YEARLY' | 'LIFETIME',
  ) {
    const now = new Date();
    let endDate: Date;

    switch (plan) {
      case 'MONTHLY':
        endDate = new Date(now.setMonth(now.getMonth() + 1));
        break;
      case 'YEARLY':
        endDate = new Date(now.setFullYear(now.getFullYear() + 1));
        break;
      case 'LIFETIME':
        endDate = new Date('2099-12-31');
        break;
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: {
        plan,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate,
      },
    });
  }

  /**
   * 删除用户
   */
  async deleteUser(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  }

  /**
   * 计算年龄
   */
  private calculateAge(birthDate: string | Date): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * 获取用户统计概览
   */
  async getUserStats(userId: string) {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // 并行查询多个统计
    const [
      totalMeals,
      weekMeals,
      monthMeals,
      totalWorkouts,
      weekWorkouts,
      latestWeight,
      checkInStats,
    ] = await Promise.all([
      this.prisma.mealRecord.count({ where: { userId } }),
      this.prisma.mealRecord.count({
        where: { userId, mealDate: { gte: weekAgo } },
      }),
      this.prisma.mealRecord.count({
        where: { userId, mealDate: { gte: monthStart } },
      }),
      this.prisma.workoutRecord.count({ where: { userId } }),
      this.prisma.workoutRecord.count({
        where: { userId, workoutDate: { gte: weekAgo } },
      }),
      this.prisma.weightRecord.findFirst({
        where: { userId },
        orderBy: { recordDate: 'desc' },
      }),
      this.prisma.dailyCheckIn.aggregate({
        where: { userId },
        _count: true,
        _avg: { streakCount: true },
      }),
    ]);

    // 获取连续打卡
    const latestCheckIn = await this.prisma.dailyCheckIn.findFirst({
      where: { userId },
      orderBy: { checkInDate: 'desc' },
    });

    const currentStreak = latestCheckIn?.streakCount || 0;

    return {
      meals: {
        total: totalMeals,
        thisWeek: weekMeals,
        thisMonth: monthMeals,
      },
      workouts: {
        total: totalWorkouts,
        thisWeek: weekWorkouts,
      },
      weight: latestWeight?.weight || null,
      checkIn: {
        currentStreak,
        totalDays: checkInStats._count,
        avgStreak: Math.round(checkInStats._avg.streakCount || 0),
      },
    };
  }
}
