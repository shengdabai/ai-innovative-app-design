// The service is tested against an in-memory Prisma double. Framework modules
// are replaced so the test does not need a generated Prisma client or a database.
jest.mock('@nestjs/common', () => ({ Injectable: () => () => undefined }), { virtual: true });
jest.mock(
  '@prisma/client',
  () => ({ AchievementCategory: { CHECK_IN: 'CHECK_IN', WORKOUT: 'WORKOUT', NUTRITION: 'NUTRITION', WEIGHT: 'WEIGHT' } }),
  { virtual: true },
);
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { AchievementsService } from './achievements.service';

const NOW = new Date(2026, 9, 31, 15, 0);

function daysAgo(n: number, hour = 12): Date {
  return new Date(2026, 9, 31 - n, hour, 0);
}

function prismaDouble(data: {
  meals?: Array<{ mealDate: Date; totalCalories: number }>;
  water?: Array<{ recordDate: Date; amount: number }>;
  profile?: { targetCalories: number; targetWater: number } | null;
  achievements: Array<{ id: string; name: string; condition: any }>;
  unlockedIds?: string[];
}) {
  const created: any[] = [];
  const prisma = {
    achievement: { findMany: jest.fn(async () => data.achievements) },
    userAchievement: {
      findMany: jest.fn(async (args: any) =>
        (data.unlockedIds || []).map((achievementId) => ({
          achievementId,
          unlockedAt: NOW,
          achievement: data.achievements.find((a) => a.id === achievementId),
        })),
      ),
      create: jest.fn(async (args: any) => created.push(args.data)),
    },
    dailyCheckIn: { findFirst: jest.fn(async () => null) },
    workoutRecord: {
      aggregate: jest.fn(async () => ({ _sum: { duration: 0 } })),
      count: jest.fn(async () => 0),
    },
    mealRecord: {
      count: jest.fn(async () => (data.meals || []).length),
      findMany: jest.fn(async () => data.meals || []),
    },
    weightRecord: { findFirst: jest.fn(async () => null) },
    waterRecord: {
      aggregate: jest.fn(async () => ({ _sum: { amount: 0 } })),
      findMany: jest.fn(async () => data.water || []),
    },
    userProfile: { findUnique: jest.fn(async () => (data.profile === undefined ? null : data.profile)) },
  };
  return { prisma, created };
}

const WATER = { id: 'water', name: '水分充足', condition: { type: 'consecutive_water_goal', days: 7 } };
const NUTRITION = { id: 'nutrition', name: '营养大师', condition: { type: 'consecutive_nutrition_goal', days: 14 } };
const MEALS = { id: 'meals', name: '饮食记录员', condition: { type: 'total_meals', count: 50 } };

describe('AchievementsService', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('unlocks the water achievement after 7 consecutive days at the profile target', async () => {
    const water = Array.from({ length: 7 }, (_, n) => [
      { recordDate: daysAgo(n, 9), amount: 1000 },
      { recordDate: daysAgo(n, 20), amount: 1500 },
    ]).flat();
    const { prisma, created } = prismaDouble({
      water,
      profile: { targetCalories: 2000, targetWater: 2500 },
      achievements: [WATER, NUTRITION],
    });
    const service = new AchievementsService(prisma as any);

    const result = await service.checkAndUnlockAchievements('user-1');

    expect(result.newUnlocks).toBe(1);
    expect(created).toEqual([{ userId: 'user-1', achievementId: 'water' }]);
    expect(prisma.waterRecord.findMany.mock.calls[0][0].where.userId).toBe('user-1');
  });

  it('unlocks the nutrition achievement after 14 days within 90%-110% of target calories', async () => {
    const meals = Array.from({ length: 14 }, (_, n) => ({ mealDate: daysAgo(n), totalCalories: 2000 }));
    const { prisma, created } = prismaDouble({
      meals,
      profile: { targetCalories: 2100, targetWater: 2000 },
      achievements: [NUTRITION],
    });
    const result = await new AchievementsService(prisma as any).checkAndUnlockAchievements('user-1');
    expect(result.newUnlocks).toBe(1);
    expect(created[0].achievementId).toBe('nutrition');
  });

  it('does not unlock streak achievements when a day in the middle is missed', async () => {
    const meals = Array.from({ length: 14 }, (_, n) => ({ mealDate: daysAgo(n), totalCalories: n === 5 ? 900 : 2000 }));
    const { prisma, created } = prismaDouble({ meals, profile: null, achievements: [NUTRITION] });
    const result = await new AchievementsService(prisma as any).checkAndUnlockAchievements('user-1');
    expect(result.newUnlocks).toBe(0);
    expect(created).toEqual([]);
  });

  it('reports progress for locked achievements instead of a fixed 0', async () => {
    const water = Array.from({ length: 3 }, (_, n) => ({ recordDate: daysAgo(n), amount: 2000 }));
    const meals = Array.from({ length: 25 }, (_, n) => ({ mealDate: daysAgo(n % 5), totalCalories: 400 }));
    const { prisma } = prismaDouble({
      water,
      meals,
      profile: { targetCalories: 2000, targetWater: 2000 },
      achievements: [WATER, NUTRITION, MEALS],
      unlockedIds: [],
    });

    const result = await new AchievementsService(prisma as any).getUserAchievements('user-1');

    const progress = Object.fromEntries(result.locked.map((a: any) => [a.id, a.progress]));
    expect(progress).toEqual({ water: 42, nutrition: 35, meals: 50 });
  });

  it('skips the data queries when every achievement is already unlocked', async () => {
    const { prisma } = prismaDouble({ achievements: [WATER], unlockedIds: ['water'] });
    const result = await new AchievementsService(prisma as any).getUserAchievements('user-1');
    expect(result.locked).toEqual([]);
    expect(prisma.mealRecord.findMany).not.toHaveBeenCalled();
  });
});
