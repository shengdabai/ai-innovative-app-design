import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMealRecordDto } from './dto/create-meal-record.dto';
import { NutritionUtil } from '../../common/utils/nutrition.util';
import { ImageRecognitionService } from './services/image-recognition.service';
import { NutritionCalculationService } from './services/nutrition-calculation.service';
import { MealType } from '@prisma/client';

@Injectable()
export class DietService {
  constructor(
    private prisma: PrismaService,
    private imageRecognition: ImageRecognitionService,
    private nutritionCalc: NutritionCalculationService,
  ) {}

  /**
   * 创建饮食记录 - 支持图像识别
   */
  async createMealRecord(
    userId: string,
    dto: CreateMealRecordDto,
    image?: Express.Multer.File,
  ) {
    let identifiedFoods: any = dto.foods || [];

    // 如果有图片，进行图像识别
    if (image) {
      const recognitionResult = await this.imageRecognition.recognizeFood(image);
      identifiedFoods = recognitionResult.foods;
    }

    // 如果提供了食物列表，查询营养数据库
    if (identifiedFoods.length > 0) {
      identifiedFoods = await this.nutritionCalc.enrichNutritionData(identifiedFoods);
    }

    // 计算总营养
    const nutrition = this.nutritionCalc.calculateMealNutrition(identifiedFoods);

    // 创建记录
    const mealRecord = await this.prisma.mealRecord.create({
      data: {
        userId,
        mealType: dto.mealType,
        imageUrl: dto.imageUrl,
        notes: dto.notes,
        identifiedFoods,
        ...nutrition,
      },
    });

    // 检查是否触发每日成就
    await this.checkDailyAchievements(userId);

    return mealRecord;
  }

  /**
   * 获取用户饮食记录列表
   */
  async getMealRecords(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      mealType?: MealType;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const where: any = { userId };

    if (options.startDate || options.endDate) {
      where.mealDate = {};
      if (options.startDate) where.mealDate.gte = options.startDate;
      if (options.endDate) where.mealDate.lte = options.endDate;
    }

    if (options.mealType) {
      where.mealType = options.mealType;
    }

    const [total, records] = await Promise.all([
      this.prisma.mealRecord.count({ where }),
      this.prisma.mealRecord.findMany({
        where,
        orderBy: { mealDate: 'desc' },
        take: options.limit || 20,
        skip: ((options.page || 1) - 1) * (options.limit || 20),
      }),
    ]);

    return {
      records,
      pagination: {
        total,
        page: options.page || 1,
        limit: options.limit || 20,
        totalPages: Math.ceil(total / (options.limit || 20)),
      },
    };
  }

  /**
   * 获取单条饮食记录
   */
  async getMealRecord(userId: string, recordId: string) {
    const record = await this.prisma.mealRecord.findFirst({
      where: { id: recordId, userId },
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    return record;
  }

  /**
   * 更新饮食记录
   */
  async updateMealRecord(
    userId: string,
    recordId: string,
    dto: Partial<CreateMealRecordDto>,
  ) {
    const record = await this.prisma.mealRecord.findFirst({
      where: { id: recordId, userId },
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    // 如果更新了食物，重新计算营养
    let nutrition = {};
    if (dto.foods) {
      const enrichedFoods = await this.nutritionCalc.enrichNutritionData(dto.foods);
      nutrition = this.nutritionCalc.calculateMealNutrition(enrichedFoods);
    }

    return this.prisma.mealRecord.update({
      where: { id: recordId },
      data: {
        ...dto,
        ...nutrition,
      },
    });
  }

  /**
   * 删除饮食记录
   */
  async deleteMealRecord(userId: string, recordId: string) {
    const record = await this.prisma.mealRecord.findFirst({
      where: { id: recordId, userId },
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    await this.prisma.mealRecord.delete({
      where: { id: recordId },
    });

    return { success: true };
  }

  /**
   * 获取每日饮食汇总
   */
  async getDailySummary(userId: string, date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const meals = await this.prisma.mealRecord.findMany({
      where: {
        userId,
        mealDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    // 按餐次汇总
    const summary = {
      date: dayStart.toISOString().split('T')[0],
      total: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
      meals: {
        breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
        lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
        dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
        snack: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
      },
    };

    meals.forEach((meal) => {
      const mealTypeKey = meal.mealType.toLowerCase();
      summary.total.calories += meal.totalCalories;
      summary.total.protein += meal.protein;
      summary.total.carbs += meal.carbs;
      summary.total.fat += meal.fat;

      if (summary.meals[mealTypeKey]) {
        summary.meals[mealTypeKey].calories += meal.totalCalories;
        summary.meals[mealTypeKey].protein += meal.protein;
        summary.meals[mealTypeKey].carbs += meal.carbs;
        summary.meals[mealTypeKey].fat += meal.fat;
        summary.meals[mealTypeKey].count += 1;
      }
    });

    // 获取目标
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (profile) {
      summary['targets'] = {
        calories: profile.targetCalories,
        protein: profile.targetProtein,
        carbs: profile.targetCarbs,
        fat: profile.targetFat,
      };

      // 计算完成度
      summary['progress'] = {
        calories: Math.round((summary.total.calories / profile.targetCalories) * 100),
        protein: Math.round((summary.total.protein / profile.targetProtein) * 100),
        carbs: Math.round((summary.total.carbs / profile.targetCarbs) * 100),
        fat: Math.round((summary.total.fat / profile.targetFat) * 100),
      };
    }

    return summary;
  }

  /**
   * 获取饮食趋势分析
   */
  async getDietTrends(
    userId: string,
    days: number = 30,
  ): Promise<{
    dailyData: Array<{
      date: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
    averages: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const meals = await this.prisma.mealRecord.findMany({
      where: {
        userId,
        mealDate: {
          gte: startDate,
          lte: endDate,
        },
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

    // 转换为数组
    const dailyData = Array.from(dailyMap.entries()).map(([date, nutrition]) => ({
      date,
      ...nutrition,
    }));

    // 计算平均值
    const totals = dailyData.reduce(
      (acc, cur) => ({
        calories: acc.calories + cur.calories,
        protein: acc.protein + cur.protein,
        carbs: acc.carbs + cur.carbs,
        fat: acc.fat + cur.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    const count = dailyData.length || 1;
    const averages = {
      calories: Math.round(totals.calories / count),
      protein: Math.round(totals.protein / count),
      carbs: Math.round(totals.carbs / count),
      fat: Math.round(totals.fat / count),
    };

    return { dailyData, averages };
  }

  /**
   * 获取营养建议
   */
  async getNutritionAdvice(userId: string): Promise<{
    score: number;
    suggestions: string[];
    strengths: string[];
  }> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return {
        score: 0,
        suggestions: ['请先完善您的个人资料'],
        strengths: [],
      };
    }

    // 获取最近7天的数据
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const meals = await this.prisma.mealRecord.findMany({
      where: {
        userId,
        mealDate: { gte: weekAgo },
      },
    });

    // 计算平均摄入
    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totalCalories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    const days = Math.max(meals.length / 3, 1); // 假设每天3餐
    const averages = {
      calories: Math.round(totals.calories / days),
      protein: Math.round(totals.protein / days),
      carbs: Math.round(totals.carbs / days),
      fat: Math.round(totals.fat / days),
    };

    // 评估
    return NutritionUtil.assessNutritionBalance(averages, {
      protein: profile.targetProtein,
      carbs: profile.targetCarbs,
      fat: profile.targetFat,
    });
  }

  /**
   * 检查每日成就
   */
  private async checkDailyAchievements(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMeals = await this.prisma.mealRecord.count({
      where: {
        userId,
        mealDate: { gte: today },
      },
    });

    // 记录3餐算打卡成功
    if (todayMeals >= 3) {
      await this.prisma.dailyCheckIn.upsert({
        where: {
          userId_checkInDate: {
            userId,
            checkInDate: today,
          },
        },
        create: {
          userId,
          checkInDate: today,
          mealsLogged: todayMeals,
        },
        update: {
          mealsLogged: todayMeals,
        },
      });
    }
  }
}
