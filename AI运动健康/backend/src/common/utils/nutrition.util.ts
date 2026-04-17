import { Gender, ActivityLevel, FitnessGoal } from '@prisma/client';

/**
 * 营养计算工具类
 */
export class NutritionUtil {
  /**
   * 计算基础代谢率 (BMR) - Mifflin-St Jeor公式
   * @param weight 体重 (kg)
   * @param height 身高 (cm)
   * @param age 年龄 (岁)
   * @param gender 性别
   * @returns BMR (kcal/day)
   */
  static calculateBMR(
    weight: number,
    height: number,
    age: number,
    gender: Gender,
  ): number {
    if (gender === Gender.MALE) {
      return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    } else {
      return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
    }
  }

  /**
   * 计算每日总消耗热量 (TDEE)
   * @param bmr 基础代谢率
   * @param activityLevel 活动水平
   * @returns TDEE (kcal/day)
   */
  static calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    const activityMultipliers: Record<ActivityLevel, number> = {
      [ActivityLevel.SEDENTARY]: 1.2,
      [ActivityLevel.LIGHT]: 1.375,
      [ActivityLevel.MODERATE]: 1.55,
      [ActivityLevel.ACTIVE]: 1.725,
      [ActivityLevel.VERY_ACTIVE]: 1.9,
    };

    return Math.round(bmr * activityMultipliers[activityLevel]);
  }

  /**
   * 根据健身目标计算目标热量
   * @param tdee 每日总消耗
   * @param goal 健身目标
   * @returns 目标热量 (kcal/day)
   */
  static calculateTargetCalories(tdee: number, goal: FitnessGoal): number {
    const adjustments: Record<FitnessGoal, number> = {
      [FitnessGoal.LOSE_WEIGHT]: -500, // 减脂：每天亏空500kcal
      [FitnessGoal.GAIN_MUSCLE]: 300,  // 增肌：每天盈余300kcal
      [FitnessGoal.MAINTAIN]: 0,       // 保持：持平
      [FitnessGoal.IMPROVE_HEALTH]: -200, // 改善健康：轻微亏空
    };

    return Math.round(tdee + adjustments[goal]);
  }

  /**
   * 计算宏量营养素分配
   * @param calories 目标热量
   * @param goal 健身目标
   * @returns {protein, carbs, fat} in grams
   */
  static calculateMacros(
    calories: number,
    goal: FitnessGoal,
  ): { protein: number; carbs: number; fat: number } {
    let proteinRatio: number;
    let fatRatio: number;
    const carbsRatio = 1; // 剩余给碳水

    switch (goal) {
      case FitnessGoal.LOSE_WEIGHT:
        proteinRatio = 0.35; // 高蛋白保肌肉
        fatRatio = 0.25;
        break;
      case FitnessGoal.GAIN_MUSCLE:
        proteinRatio = 0.30;
        fatRatio = 0.25;
        break;
      case FitnessGoal.MAINTAIN:
      default:
        proteinRatio = 0.25;
        fatRatio = 0.30;
        break;
    }

    const proteinCalories = calories * proteinRatio;
    const fatCalories = calories * fatRatio;
    const carbsCalories = calories - proteinCalories - fatCalories;

    return {
      protein: Math.round(proteinCalories / 4), // 1g蛋白质 = 4kcal
      carbs: Math.round(carbsCalories / 4),     // 1g碳水 = 4kcal
      fat: Math.round(fatCalories / 9),         // 1g脂肪 = 9kcal
    };
  }

  /**
   * 计算BMI
   * @param weight 体重 (kg)
   * @param height 身高 (cm)
   * @returns BMI值
   */
  static calculateBMI(weight: number, height: number): number {
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  }

  /**
   * 获取BMI分类
   * @param bmi BMI值
   * @returns 分类和描述
   */
  static getBMICategory(bmi: number): { category: string; description: string } {
    if (bmi < 18.5) {
      return { category: 'underweight', description: '偏瘦' };
    } else if (bmi < 24) {
      return { category: 'normal', description: '正常' };
    } else if (bmi < 28) {
      return { category: 'overweight', description: '偏胖' };
    } else {
      return { category: 'obese', description: '肥胖' };
    }
  }

  /**
   * 计算预期达成目标所需时间
   * @param currentWeight 当前体重 (kg)
   * @param targetWeight 目标体重 (kg)
   * @param dailyCalorieDeficit 每日热量亏空 (kcal)
   * @returns 预计天数
   */
  static calculateDaysToGoal(
    currentWeight: number,
    targetWeight: number,
    dailyCalorieDeficit: number,
  ): number {
    const weightDifference = Math.abs(currentWeight - targetWeight);
    const caloriesPerKg = 7700; // 1kg脂肪 ≈ 7700kcal
    const totalCaloriesNeeded = weightDifference * caloriesPerKg;
    return Math.ceil(totalCaloriesNeeded / dailyCalorieDeficit);
  }

  /**
   * 计算食物总热量
   * @param foods 食物列表 [{weight, caloriesPer100g}, ...]
   * @returns 总热量
   */
  static calculateTotalCalories(
    foods: Array<{ weight: number; caloriesPer100g: number }>,
  ): number {
    return foods.reduce((total, food) => {
      return total + (food.weight * food.caloriesPer100g) / 100;
    }, 0);
  }

  /**
   * 计算餐食营养总和
   */
  static sumMealNutrition(
    foods: Array<{
      weight: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>,
  ): { calories: number; protein: number; carbs: number; fat: number } {
    return foods.reduce(
      (total, food) => ({
        calories: total.calories + (food.weight * food.calories) / 100,
        protein: total.protein + (food.weight * food.protein) / 100,
        carbs: total.carbs + (food.weight * food.carbs) / 100,
        fat: total.fat + (food.weight * food.fat) / 100,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }

  /**
   * 获取理想的每日饮水摄入量
   * @param weight 体重 (kg)
   * @param activityLevel 活动水平
   * @returns 饮水量
   */
  static calculateWaterIntake(
    weight: number,
    activityLevel: ActivityLevel,
  ): number {
    const baseWater = weight * 33; // 基础：33ml/kg

    const activityBonus: Record<ActivityLevel, number> = {
      [ActivityLevel.SEDENTARY]: 0,
      [ActivityLevel.LIGHT]: 200,
      [ActivityLevel.MODERATE]: 400,
      [ActivityLevel.ACTIVE]: 600,
      [ActivityLevel.VERY_ACTIVE]: 800,
    };

    return Math.round(baseWater + activityBonus[activityLevel]);
  }

  /**
   * 计算运动消耗热量 (METs公式)
   * @param mets 代谢当量
   * @param weight 体重
   * @param durationMinutes 运动时长 (分钟)
   * @returns 消耗热量
   */
  static calculateCaloriesBurned(
    mets: number,
    weight: number,
    durationMinutes: number,
  ): number {
    // calories = METs × weight(kg) × time(hours)
    return Math.round(mets * weight * (durationMinutes / 60));
  }

  /**
   * 获取常见运动的MET值
   */
  static getMETs(activityType: string): number {
    const metsMap: Record<string, number> = {
      walking: 3.5,
      jogging: 7.0,
      running: 9.8,
      cycling: 7.5,
      swimming: 8.0,
      yoga: 2.5,
      hiit: 11.0,
      weightlifting: 6.0,
      basketball: 8.0,
      football: 9.0,
      dancing: 5.0,
    };

    return metsMap[activityType.toLowerCase()] || 5.0; // 默认中等强度
  }

  /**
   * 评估营养均衡度
   */
  static assessNutritionBalance(
    consumed: { protein: number; carbs: number; fat: number },
    targets: { protein: number; carbs: number; fat: number },
  ): { score: number; suggestions: string[] } {
    const suggestions: string[] = [];
    let score = 100;

    const proteinRatio = consumed.protein / targets.protein;
    const carbsRatio = consumed.carbs / targets.carbs;
    const fatRatio = consumed.fat / targets.fat;

    // 蛋白质评估
    if (proteinRatio < 0.8) {
      suggestions.push('蛋白质摄入不足，建议增加瘦肉、蛋类或豆制品');
      score -= 15;
    } else if (proteinRatio > 1.3) {
      suggestions.push('蛋白质摄入过多，注意肾脏负担');
      score -= 5;
    }

    // 碳水评估
    if (carbsRatio < 0.7) {
      suggestions.push('碳水化合物偏低，可能影响运动表现');
      score -= 10;
    } else if (carbsRatio > 1.4) {
      suggestions.push('碳水化合物偏高，建议减少精制糖摄入');
      score -= 10;
    }

    // 脂肪评估
    if (fatRatio < 0.6) {
      suggestions.push('健康脂肪摄入不足，建议适量摄入坚果或牛油果');
      score -= 10;
    } else if (fatRatio > 1.3) {
      suggestions.push('脂肪摄入偏高，建议控制油脂用量');
      score -= 15;
    }

    return { score: Math.max(0, score), suggestions };
  }

  /**
   * 计算体重趋势
   */
  static calculateWeightTrend(
    weights: Array<{ weight: number; date: Date }>,
  ): { trend: 'up' | 'down' | 'stable'; weeklyChange: number } {
    if (weights.length < 2) {
      return { trend: 'stable', weeklyChange: 0 };
    }

    const sortedWeights = [...weights].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    const latest = sortedWeights[sortedWeights.length - 1].weight;
    const weekAgo = sortedWeights[Math.max(0, sortedWeights.length - 8)]?.weight ?? latest;
    const weeklyChange = parseFloat((latest - weekAgo).toFixed(2));

    let trend: 'up' | 'down' | 'stable';
    if (Math.abs(weeklyChange) < 0.3) {
      trend = 'stable';
    } else if (weeklyChange > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }

    return { trend, weeklyChange };
  }
}
