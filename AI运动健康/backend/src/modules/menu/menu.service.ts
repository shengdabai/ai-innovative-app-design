import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuPlanDto } from './dto/create-menu-plan.dto';
import { MealType, TastePreference } from '@prisma/client';

interface MealSuggestion {
  recipeId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
}

interface DayMenu {
  date: string;
  breakfast: MealSuggestion[];
  lunch: MealSuggestion[];
  dinner: MealSuggestion[];
  snacks: MealSuggestion[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 创建菜单计划
   */
  async createMenuPlan(userId: string, dto: CreateMenuPlanDto) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('请先完善个人资料');
    }

    // 生成一周菜单
    const meals = await this.generateWeeklyMenu(
      dto.availableIngredients || [],
      {
        tastePreference: profile.tastePreference,
        allergies: profile.allergies,
        dislikedFoods: profile.dislikedFoods,
        targetCalories: profile.targetCalories,
        targetProtein: profile.targetProtein,
        targetCarbs: profile.targetCarbs,
        targetFat: profile.targetFat,
        fitnessGoal: profile.fitnessGoal,
      },
      dto.days || 7,
    );

    const startDate = new Date(dto.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (dto.days || 7));

    const menuPlan = await this.prisma.menuPlan.create({
      data: {
        userId,
        name: dto.name || '一周菜单计划',
        startDate,
        endDate,
        meals,
        preferences: {
          tastePreference: profile.tastePreference,
          allergies: profile.allergies,
          dislikedFoods: profile.dislikedFoods,
        },
      },
    });

    return menuPlan;
  }

  /**
   * 生成一周菜单
   */
  private async generateWeeklyMenu(
    availableIngredients: string[],
    preferences: any,
    days: number,
  ): Promise<DayMenu[]> {
    const weeklyMenu: DayMenu[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const dayMenu = await this.generateDayMenu(
        availableIngredients,
        preferences,
      );

      weeklyMenu.push({
        date: date.toISOString().split('T')[0],
        ...dayMenu,
      });
    }

    return weeklyMenu;
  }

  /**
   * 生成单日菜单
   */
  private async generateDayMenu(
    availableIngredients: string[],
    preferences: any,
  ): Promise<Omit<DayMenu, 'date'>> {
    // 获取目标热量分配
    const calorieDistribution = this.calculateCalorieDistribution(
      preferences.targetCalories,
    );

    // 为每餐选择菜谱
    const breakfast = await this.selectMeals(
      MealType.BREAKFAST,
      calorieDistribution.breakfast,
      availableIngredients,
      preferences,
    );

    const lunch = await this.selectMeals(
      MealType.LUNCH,
      calorieDistribution.lunch,
      availableIngredients,
      preferences,
    );

    const dinner = await this.selectMeals(
      MealType.DINNER,
      calorieDistribution.dinner,
      availableIngredients,
      preferences,
    );

    const snacks = await this.selectMeals(
      MealType.SNACK,
      calorieDistribution.snack,
      availableIngredients,
      preferences,
    );

    // 计算总计
    const totals = this.calculateDayTotals([breakfast, lunch, dinner, snacks]);

    return {
      breakfast,
      lunch,
      dinner,
      snacks,
      ...totals,
    };
  }

  /**
   * 计算热量分配
   */
  private calculateCalorieDistribution(targetCalories: number) {
    return {
      breakfast: Math.round(targetCalories * 0.25), // 25%
      lunch: Math.round(targetCalories * 0.35), // 35%
      dinner: Math.round(targetCalories * 0.3), // 30%
      snack: Math.round(targetCalories * 0.1), // 10%
    };
  }

  /**
   * 为特定餐次选择菜品
   */
  private async selectMeals(
    mealType: MealType,
    targetCalories: number,
    availableIngredients: string[],
    preferences: any,
  ): Promise<MealSuggestion[]> {
    // 查询符合条件的菜谱
    const recipes = await this.prisma.recipe.findMany({
      where: {
        calories: { lte: targetCalories * 1.2 },
        taste: { hasSome: preferences.tastePreference || [] },
      },
      take: 50,
    });

    // 过滤掉过敏源和不喜欢
    const filteredRecipes = recipes.filter((recipe) => {
      const ingredients = recipe.ingredients as any[];
      const hasAllergen = ingredients.some((ing) =>
        preferences.allergies?.some((a: string) =>
          ing.name?.includes(a),
        ),
      );
      const hasDisliked = ingredients.some((ing) =>
        preferences.dislikedFoods?.some((d: string) =>
          ing.name?.includes(d),
        ),
      );

      // 优先使用可用食材
      const usesAvailableIngredients = availableIngredients.length > 0 &&
        ingredients.some((ing) =>
          availableIngredients.some((avail) =>
            ing.name?.includes(avail) || avail.includes(ing.name),
          ),
        );

      if (availableIngredients.length > 0) {
        return !hasAllergen && !hasDisliked && usesAvailableIngredients;
      }

      return !hasAllergen && !hasDisliked;
    });

    // 按匹配度排序
    const sortedRecipes = filteredRecipes.sort((a, b) => {
      const aScore = this.calculateRecipeScore(a, availableIngredients);
      const bScore = this.calculateRecipeScore(b, availableIngredients);
      return bScore - aScore;
    });

    // 选择1-2个菜品
    const selected: MealSuggestion[] = [];
    let currentCalories = 0;

    for (const recipe of sortedRecipes) {
      if (currentCalories + recipe.calories <= targetCalories * 1.1) {
        selected.push({
          recipeId: recipe.id,
          name: recipe.name,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          imageUrl: recipe.imageUrl,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
        });
        currentCalories += recipe.calories;

        if (selected.length >= 2) break;
      }
    }

    // 如果没有找到合适的，返回默认建议
    if (selected.length === 0) {
      return this.getDefaultMealSuggestions(mealType, targetCalories);
    }

    return selected;
  }

  /**
   * 计算菜谱匹配分数
   */
  private calculateRecipeScore(recipe: any, availableIngredients: string[]): number {
    let score = 0;
    const ingredients = recipe.ingredients as any[];

    // 食材匹配分数
    for (const ing of ingredients) {
      for (const avail of availableIngredients) {
        if (ing.name?.includes(avail) || avail.includes(ing.name)) {
          score += 10;
        }
      }
    }

    // 热量适中加分
    if (recipe.calories >= 300 && recipe.calories <= 600) {
      score += 5;
    }

    // 营养均衡加分
    const proteinRatio = recipe.protein / recipe.calories * 4;
    if (proteinRatio >= 0.15 && proteinRatio <= 0.35) {
      score += 5;
    }

    return score;
  }

  /**
   * 获取默认菜品建议
   */
  private getDefaultMealSuggestions(
    mealType: MealType,
    targetCalories: number,
  ): MealSuggestion[] {
    const defaults: Record<MealType, MealSuggestion[]> = {
      [MealType.BREAKFAST]: [
        {
          recipeId: 'default-1',
          name: '燕麦粥配鸡蛋',
          calories: Math.min(350, targetCalories),
          protein: 18,
          carbs: 40,
          fat: 12,
          prepTime: 10,
          cookTime: 15,
          servings: 1,
        },
      ],
      [MealType.LUNCH]: [
        {
          recipeId: 'default-2',
          name: '鸡胸肉沙拉',
          calories: Math.min(450, targetCalories),
          protein: 35,
          carbs: 30,
          fat: 15,
          prepTime: 15,
          cookTime: 20,
          servings: 1,
        },
      ],
      [MealType.DINNER]: [
        {
          recipeId: 'default-3',
          name: '清蒸鱼配蔬菜',
          calories: Math.min(400, targetCalories),
          protein: 30,
          carbs: 25,
          fat: 12,
          prepTime: 10,
          cookTime: 25,
          servings: 1,
        },
      ],
      [MealType.SNACK]: [
        {
          recipeId: 'default-4',
          name: '坚果酸奶',
          calories: Math.min(200, targetCalories),
          protein: 10,
          carbs: 15,
          fat: 8,
          prepTime: 5,
          cookTime: 0,
          servings: 1,
        },
      ],
    };

    return defaults[mealType] || [];
  }

  /**
   * 计算每日总营养
   */
  private calculateDayTotals(meals: MealSuggestion[][]) {
    const totals = meals.flat().reduce(
      (acc, meal) => ({
        totalCalories: acc.totalCalories + meal.calories,
        totalProtein: acc.totalProtein + meal.protein,
        totalCarbs: acc.totalCarbs + meal.carbs,
        totalFat: acc.totalFat + meal.fat,
      }),
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
    );

    return {
      totalCalories: Math.round(totals.totalCalories),
      totalProtein: Math.round(totals.totalProtein),
      totalCarbs: Math.round(totals.totalCarbs),
      totalFat: Math.round(totals.totalFat),
    };
  }

  /**
   * 获取用户的菜单计划列表
   */
  async getMenuPlans(userId: string) {
    return this.prisma.menuPlan.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * 获取单个菜单计划
   */
  async getMenuPlan(userId: string, planId: string) {
    const plan = await this.prisma.menuPlan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      throw new Error('菜单计划不存在');
    }

    return plan;
  }

  /**
   * 删除菜单计划
   */
  async deleteMenuPlan(userId: string, planId: string) {
    const plan = await this.prisma.menuPlan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      throw new Error('菜单计划不存在');
    }

    await this.prisma.menuPlan.delete({
      where: { id: planId },
    });

    return { success: true };
  }

  /**
   * 获取菜谱详情
   */
  async getRecipe(recipeId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new Error('菜谱不存在');
    }

    return recipe;
  }

  /**
   * 搜索菜谱
   */
  async searchRecipes(query: string, filters?: {
    taste?: TastePreference[];
    maxCalories?: number;
    minProtein?: number;
    difficulty?: number;
  }) {
    const where: any = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } },
      ];
    }

    if (filters?.taste?.length) {
      where.taste = { hasSome: filters.taste };
    }

    if (filters?.maxCalories) {
      where.calories = { ...where.calories, lte: filters.maxCalories };
    }

    if (filters?.minProtein) {
      where.protein = { gte: filters.minProtein };
    }

    if (filters?.difficulty) {
      where.difficulty = { lte: filters.difficulty };
    }

    return this.prisma.recipe.findMany({
      where,
      take: 20,
    });
  }
}
