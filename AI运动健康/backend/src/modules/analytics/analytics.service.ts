import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NutritionUtil } from '../../common/utils/nutrition.util';

interface DashboardData {
  overview: {
    currentWeight: number | null;
    weightChange: number;
    weightTrend: 'up' | 'down' | 'stable';
    daysToGoal: number | null;
    targetWeight: number | null;
  };
  nutrition: {
    todayCalories: number;
    todayProtein: number;
    todayCarbs: number;
    todayFat: number;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    weeklyAverage: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  };
  activity: {
    checkInStreak: number;
    mealsThisWeek: number;
    workoutsThisWeek: number;
    waterToday: number;
    waterGoal: number;
  };
  progress: {
    weightProgress: number;
    calorieProgress: number;
    workoutProgress: number;
    waterProgress: number;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户仪表盘数据
   */
  async getDashboard(userId: string): Promise<DashboardData> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    const today = new Date(new Date().toDateString());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 并行查询所有需要的数据
    const [
      latestWeight,
      weightHistory,
      todayMeals,
      weekMeals,
      todayWorkouts,
      weekWorkouts,
      todayWater,
      latestCheckIn,
    ] = await Promise.all([
      this.prisma.weightRecord.findFirst({
        where: { userId },
        orderBy: { recordDate: 'desc' },
      }),
      this.prisma.weightRecord.findMany({
        where: { userId, recordDate: { gte: weekAgo } },
        orderBy: { recordDate: 'asc' },
        take: 30,
      }),
      this.getMealsNutrition(userId, today, today),
      this.getMealsNutrition(userId, weekAgo, today),
      this.prisma.workoutRecord.aggregate({
        where: { userId, workoutDate: { gte: today, lte: new Date() } },
        _sum: { duration: true, caloriesBurned: true },
        _count: true,
      }),
      this.prisma.workoutRecord.aggregate({
        where: { userId, workoutDate: { gte: weekAgo } },
        _sum: { duration: true, caloriesBurned: true },
        _count: true,
      }),
      this.prisma.waterRecord.aggregate({
        where: { userId, recordDate: { gte: today, lte: new Date() } },
        _sum: { amount: true },
      }),
      this.prisma.dailyCheckIn.findFirst({
        where: { userId },
        orderBy: { checkInDate: 'desc' },
      }),
    ]);

    // 体重数据
    const weightTrend = NutritionUtil.calculateWeightTrend(
      weightHistory.map((w) => ({ weight: w.weight, date: w.recordDate })),
    );

    const daysToGoal =
      profile?.targetWeight && latestWeight
        ? NutritionUtil.calculateDaysToGoal(
            latestWeight.weight,
            profile.targetWeight,
            500, // 假设每日亏空500kcal
          )
        : null;

    // 营养数据
    const weekDayCount = Math.max(
      Math.ceil((today.getTime() - weekAgo.getTime()) / (1000 * 60 * 60 * 24)),
      1,
    );

    const targetCalories = profile?.targetCalories || 2000;
    const targetProtein = profile?.targetProtein || 100;
    const targetCarbs = profile?.targetCarbs || 250;
    const targetFat = profile?.targetFat || 70;

    return {
      overview: {
        currentWeight: latestWeight?.weight || null,
        weightChange: weightTrend.weeklyChange,
        weightTrend: weightTrend.trend,
        daysToGoal,
        targetWeight: profile?.targetWeight || null,
      },
      nutrition: {
        todayCalories: Math.round(todayMeals.calories),
        todayProtein: Math.round(todayMeals.protein),
        todayCarbs: Math.round(todayMeals.carbs),
        todayFat: Math.round(todayMeals.fat),
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
        weeklyAverage: {
          calories: Math.round(weekMeals.calories / weekDayCount),
          protein: Math.round(weekMeals.protein / weekDayCount),
          carbs: Math.round(weekMeals.carbs / weekDayCount),
          fat: Math.round(weekMeals.fat / weekDayCount),
        },
      },
      activity: {
        checkInStreak: latestCheckIn?.streakCount || 0,
        mealsThisWeek: weekMeals.count,
        workoutsThisWeek: weekWorkouts._count || 0,
        waterToday: todayWater._sum.amount || 0,
        waterGoal: profile?.targetWater || 2000,
      },
      progress: {
        weightProgress: this.calculateWeightProgress(
          latestWeight?.weight,
          profile?.weight,
          profile?.targetWeight,
        ),
        calorieProgress: Math.round(
          (todayMeals.calories / targetCalories) * 100,
        ),
        workoutProgress: this.calculateWorkoutProgress(weekWorkouts._count || 0),
        waterProgress: Math.round(
          ((todayWater._sum.amount || 0) / (profile?.targetWater || 2000)) *
            100,
        ),
      },
    };
  }

  /**
   * 获取体重趋势图表数据
   */
  async getWeightChart(
    userId: string,
    days: number = 30,
  ): Promise<Array<{ date: string; weight: number; target?: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await this.prisma.weightRecord.findMany({
      where: {
        userId,
        recordDate: { gte: startDate, lte: endDate },
      },
      orderBy: { recordDate: 'asc' },
    });

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    return records.map((r) => ({
      date: r.recordDate.toISOString().split('T')[0],
      weight: r.weight,
      target: profile?.targetWeight,
    }));
  }

  /**
   * 获取营养摄入图表数据
   */
  async getNutritionChart(
    userId: string,
    days: number = 30,
  ): Promise<
    Array<{ date: string; calories: number; protein: number; carbs: number; fat: number }>
  > {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const meals = await this.prisma.mealRecord.findMany({
      where: {
        userId,
        mealDate: { gte: startDate, lte: endDate },
      },
      orderBy: { mealDate: 'asc' },
    });

    // 按日期汇总
    const dailyMap = new Map<
      string,
      { calories: number; protein: number; carbs: number; fat: number }
    >();

    meals.forEach((meal) => {
      const dateKey = meal.mealDate.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };

      existing.calories += meal.totalCalories;
      existing.protein += meal.protein;
      existing.carbs += meal.carbs;
      existing.fat += meal.fat;

      dailyMap.set(dateKey, existing);
    });

    return Array.from(dailyMap.entries()).map(([date, nutrition]) => ({
      date,
      ...nutrition,
    }));
  }

  /**
   * 记录体重
   */
  async recordWeight(
    userId: string,
    weight: number,
    bodyFat?: number,
    notes?: string,
  ) {
    return this.prisma.weightRecord.create({
      data: {
        userId,
        weight,
        bodyFat,
        notes,
      },
    });
  }

  /**
   * 记录运动
   */
  async recordWorkout(
    userId: string,
    workoutType: string,
    duration: number,
    caloriesBurned?: number,
    notes?: string,
  ) {
    // 如果没有提供消耗热量，自动计算
    let finalCalories = caloriesBurned;
    if (!finalCalories) {
      const profile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });
      if (profile?.weight) {
        const mets = NutritionUtil.getMETs(workoutType);
        finalCalories = NutritionUtil.calculateCaloriesBurned(
          mets,
          profile.weight,
          duration,
        );
      }
    }

    return this.prisma.workoutRecord.create({
      data: {
        userId,
        workoutType,
        duration,
        caloriesBurned: finalCalories,
        notes,
      },
    });
  }

  /**
   * 记录饮水
   */
  async recordWater(userId: string, amount: number) {
    return this.prisma.waterRecord.create({
      data: {
        userId,
        amount,
        recordDate: new Date(),
      },
    });
  }

  /**
   * 获取运动记录
   */
  async getWorkoutRecords(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.workoutDate = {};
      if (startDate) where.workoutDate.gte = startDate;
      if (endDate) where.workoutDate.lte = endDate;
    }

    return this.prisma.workoutRecord.findMany({
      where,
      orderBy: { workoutDate: 'desc' },
    });
  }

  /**
   * 获取体重记录
   */
  async getWeightRecords(userId: string, limit: number = 30) {
    return this.prisma.weightRecord.findMany({
      where: { userId },
      orderBy: { recordDate: 'desc' },
      take: limit,
    });
  }

  /**
   * 获取饮水记录
   */
  async getWaterRecords(userId: string, date: Date) {
    const dayStart = new Date(date.toDateString());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    return this.prisma.waterRecord.findMany({
      where: {
        userId,
        recordDate: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { recordDate: 'asc' },
    });
  }

  /**
   * 辅助方法：计算体重进度
   */
  private calculateWeightProgress(
    current: number | undefined,
    start: number | undefined,
    target: number | undefined,
  ): number {
    if (!current || !start || !target) return 0;

    const totalChange = Math.abs(target - start);
    const currentChange = Math.abs(current - start);

    if (totalChange === 0) return 100;

    return Math.min(100, Math.round((currentChange / totalChange) * 100));
  }

  /**
   * 辅助方法：计算运动进度（每周目标）
   */
  private calculateWorkoutProgress(weekWorkouts: number): number {
    const target = 3; // 每周3次运动
    return Math.min(100, Math.round((weekWorkouts / target) * 100));
  }

  /**
   * 辅助方法：获取餐食营养汇总
   */
  private async getMealsNutrition(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    count: number;
  }> {
    const meals = await this.prisma.mealRecord.findMany({
      where: {
        userId,
        mealDate: { gte: startDate, lte: endDate },
      },
    });

    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totalCalories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return { ...totals, count: meals.length };
  }
}
