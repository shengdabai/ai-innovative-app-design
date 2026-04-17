import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface FoodItem {
  id?: string;
  name: string;
  weight?: number;
  confidence?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

interface EnrichedFood extends FoodItem {
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

interface MealNutrition {
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * 营养计算服务
 */
@Injectable()
export class NutritionCalculationService {
  private readonly logger = new Logger(NutritionCalculationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 丰富营养数据 - 从数据库查询
   */
  async enrichNutritionData(
    foods: FoodItem[],
  ): Promise<EnrichedFood[]> {
    const enrichedFoods: EnrichedFood[] = [];

    for (const food of foods) {
      // 从数据库查询食物营养信息
      const foodData = await this.findFoodInDatabase(food.name);

      if (foodData) {
        enrichedFoods.push({
          ...food,
          id: foodData.id,
          caloriesPer100g: foodData.calories,
          proteinPer100g: foodData.protein,
          carbsPer100g: foodData.carbs,
          fatPer100g: foodData.fat,
          calories: food.weight
            ? (food.weight * foodData.calories) / 100
            : undefined,
          protein: food.weight
            ? (food.weight * foodData.protein) / 100
            : undefined,
          carbs: food.weight
            ? (food.weight * foodData.carbs) / 100
            : undefined,
          fat: food.weight
            ? (food.weight * foodData.fat) / 100
            : undefined,
        });
      } else {
        // 如果数据库中没有，使用估算值
        const estimated = this.estimateNutrition(food.name);
        enrichedFoods.push({
          ...food,
          caloriesPer100g: estimated.calories,
          proteinPer100g: estimated.protein,
          carbsPer100g: estimated.carbs,
          fatPer100g: estimated.fat,
          calories: food.weight
            ? (food.weight * estimated.calories) / 100
            : estimated.calories,
          protein: food.weight
            ? (food.weight * estimated.protein) / 100
            : estimated.protein,
          carbs: food.weight
            ? (food.weight * estimated.carbs) / 100
            : estimated.carbs,
          fat: food.weight
            ? (food.weight * estimated.fat) / 100
            : estimated.fat,
        });
      }
    }

    return enrichedFoods;
  }

  /**
   * 在数据库中查找食物
   */
  private async findFoodInDatabase(name: string) {
    // 首先精确匹配
    let food = await this.prisma.food.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    // 如果没有，尝试模糊匹配
    if (!food) {
      food = await this.prisma.food.findFirst({
        where: { name: { contains: name, mode: 'insensitive' } },
      });
    }

    return food;
  }

  /**
   * 估算营养值（当数据库中没有时）
   */
  private estimateNutrition(name: string): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } {
    // 常见食物的平均值
    const estimates: Record<string, any> = {
      // 谷物类
      米饭: { calories: 130, protein: 2.6, carbs: 28, fat: 0.3 },
      面条: { calories: 110, protein: 4, carbs: 25, fat: 0.5 },
      面包: { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
      馒头: { calories: 236, protein: 7, carbs: 47, fat: 1.1 },

      // 肉类
      猪肉: { calories: 143, protein: 20, carbs: 1.5, fat: 6 },
      牛肉: { calories: 250, protein: 26, carbs: 0, fat: 15 },
      鸡肉: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      鱼: { calories: 140, protein: 20, carbs: 0, fat: 6 },

      // 蔬菜类
      白菜: { calories: 17, protein: 1.5, carbs: 3.2, fat: 0.1 },
      西兰花: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
      菠菜: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
      西红柿: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      黄瓜: { calories: 16, protein: 0.8, carbs: 3.6, fat: 0.1 },

      // 水果类
      苹果: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
      香蕉: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
      橙子: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },

      // 蛋奶豆制品
      鸡蛋: { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      豆腐: { calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
      牛奶: { calories: 54, protein: 3, carbs: 5, fat: 3 },

      // 其他
      rice: { calories: 130, protein: 2.6, carbs: 28, fat: 0.3 },
      noodles: { calories: 110, protein: 4, carbs: 25, fat: 0.5 },
      bread: { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
      pork: { calories: 143, protein: 20, carbs: 1.5, fat: 6 },
      beef: { calories: 250, protein: 26, carbs: 0, fat: 15 },
      chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      fish: { calories: 140, protein: 20, carbs: 0, fat: 6 },
      egg: { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      tofu: { calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
    };

    // 查找匹配
    for (const [key, value] of Object.entries(estimates)) {
      if (name.toLowerCase().includes(key)) {
        return value;
      }
    }

    // 默认值（中等热量）
    return { calories: 100, protein: 10, carbs: 15, fat: 3 };
  }

  /**
   * 计算餐食总营养
   */
  calculateMealNutrition(foods: EnrichedFood[]): MealNutrition {
    return foods.reduce(
      (total, food) => ({
        totalCalories:
          total.totalCalories +
          (food.calories || (food.weight && food.caloriesPer100g
            ? (food.weight * food.caloriesPer100g) / 100
            : 0)),
        protein:
          total.protein +
          (food.protein || (food.weight && food.proteinPer100g
            ? (food.weight * food.proteinPer100g) / 100
            : 0)),
        carbs:
          total.carbs +
          (food.carbs || (food.weight && food.carbsPer100g
            ? (food.weight * food.carbsPer100g) / 100
            : 0)),
        fat:
          total.fat +
          (food.fat || (food.weight && food.fatPer100g
            ? (food.weight * food.fatPer100g) / 100
            : 0)),
      }),
      { totalCalories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }

  /**
   * 格式化营养数据（保留小数）
   */
  formatNutrition(nutrition: MealNutrition): MealNutrition {
    return {
      totalCalories: parseFloat(nutrition.totalCalories.toFixed(2)),
      protein: parseFloat(nutrition.protein.toFixed(2)),
      carbs: parseFloat(nutrition.carbs.toFixed(2)),
      fat: parseFloat(nutrition.fat.toFixed(2)),
    };
  }

  /**
   * 添加新食物到数据库
   */
  async addFoodToDatabase(food: {
    name: string;
    nameEn?: string;
    category: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  }) {
    return this.prisma.food.create({
      data: food,
    });
  }
}
