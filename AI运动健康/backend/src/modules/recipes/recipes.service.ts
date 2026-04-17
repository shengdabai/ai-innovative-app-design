import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TastePreference } from '@prisma/client';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 搜索菜谱
   */
  async searchRecipes(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
          ],
        },
        take: limit,
        skip,
      }),
      this.prisma.recipe.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
          ],
        },
      }),
    ]);

    return {
      recipes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取菜谱详情
   */
  async getRecipe(id: string) {
    return this.prisma.recipe.findUnique({
      where: { id },
    });
  }

  /**
   * 创建新菜谱
   */
  async createRecipe(recipeData: {
    name: string;
    description?: string;
    imageUrl?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: any[];
    steps: string[];
    taste?: TastePreference[];
    difficulty?: number;
    prepTime?: number;
    cookTime?: number;
    servings?: number;
    tags?: string[];
  }) {
    return this.prisma.recipe.create({
      data: recipeData,
    });
  }

  /**
   * 获取推荐菜谱
   */
  async getRecommendedRecipes(
    preferences: {
      taste?: TastePreference[];
      allergies?: string[];
      maxCalories?: number;
      minProtein?: number;
    },
    limit: number = 10,
  ) {
    const where: any = {};

    if (preferences.taste?.length) {
      where.taste = { hasSome: preferences.taste };
    }

    if (preferences.maxCalories) {
      where.calories = { lte: preferences.maxCalories };
    }

    if (preferences.minProtein) {
      where.protein = { gte: preferences.minProtein };
    }

    return this.prisma.recipe.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 批量导入菜谱
   */
  async importRecipes(recipes: any[]) {
    const existingNames = new Set(
      (
        await this.prisma.recipe.findMany({
          select: { name: true },
        })
      ).map((r) => r.name),
    );

    const newRecipes = recipes.filter((r) => !existingNames.has(r.name));

    if (newRecipes.length === 0) {
      return { imported: 0, message: '所有菜谱已存在' };
    }

    await this.prisma.recipe.createMany({
      data: newRecipes,
      skipDuplicates: true,
    });

    return { imported: newRecipes.length };
  }
}
