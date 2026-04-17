import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FoodsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 搜索食物
   */
  async searchFoods(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [foods, total] = await Promise.all([
      this.prisma.food.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { nameEn: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        skip,
      }),
      this.prisma.food.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { nameEn: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      foods,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取食物详情
   */
  async getFood(id: string) {
    return this.prisma.food.findUnique({
      where: { id },
    });
  }

  /**
   * 获取食物分类
   */
  async getCategories() {
    const foods = await this.prisma.food.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return {
      categories: foods.map((f) => f.category).sort(),
    };
  }

  /**
   * 创建新食物
   */
  async createFood(foodData: {
    name: string;
    nameEn?: string;
    category: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    servingUnit?: string;
    servingSize?: number;
    tags?: string[];
  }) {
    return this.prisma.food.create({
      data: foodData,
    });
  }

  /**
   * 批量导入食物
   */
  async importFoods(foods: any[]) {
    // 去重：检查是否已存在
    const existingNames = new Set(
      (
        await this.prisma.food.findMany({
          select: { name: true },
        })
      ).map((f) => f.name),
    );

    const newFoods = foods.filter((f) => !existingNames.has(f.name));

    if (newFoods.length === 0) {
      return { imported: 0, message: '所有食物已存在' };
    }

    await this.prisma.food.createMany({
      data: newFoods,
      skipDuplicates: true,
    });

    return { imported: newFoods.length };
  }
}
