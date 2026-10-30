import {
  AchievementUserData,
  achievementProgress,
  countConsecutiveGoalDays,
  isConditionMet,
  isNutritionGoalMet,
  isWaterGoalMet,
  localDayKey,
  sumByLocalDay,
} from './achievement-progress';

const NOW = new Date(2026, 9, 31, 15, 30); // 2026-10-31 15:30 local time

function daysAgo(n: number, hour = 12): Date {
  return new Date(2026, 9, 31 - n, hour, 0);
}

function userData(overrides: Partial<AchievementUserData> = {}): AchievementUserData {
  return {
    consecutiveCheckIn: 0,
    totalWorkoutMinutes: 0,
    weeklyWorkoutCount: 0,
    totalMeals: 0,
    currentWeight: null,
    startWeight: null,
    consecutiveNutritionGoalDays: 0,
    consecutiveWaterGoalDays: 0,
    ...overrides,
  };
}

describe('sumByLocalDay', () => {
  it('groups records by local calendar day, including late-evening records', () => {
    const totals = sumByLocalDay(
      [
        { at: daysAgo(0, 8), amount: 500 },
        { at: daysAgo(0, 23), amount: 700 },
        { at: daysAgo(1, 0), amount: 300 },
      ],
      (r) => r.at,
      (r) => r.amount,
    );
    expect(totals.get(localDayKey(daysAgo(0)))).toBe(1200);
    expect(totals.get(localDayKey(daysAgo(1)))).toBe(300);
  });
});

describe('countConsecutiveGoalDays', () => {
  const met = (total: number) => total >= 2000;

  it('counts back from today when today is already met', () => {
    const totals = new Map([0, 1, 2].map((n) => [localDayKey(daysAgo(n)), 2000] as [string, number]));
    expect(countConsecutiveGoalDays(totals, met, NOW)).toBe(3);
  });

  it('does not break the streak because today is not finished yet', () => {
    const totals = new Map<string, number>([
      [localDayKey(daysAgo(0)), 500],
      [localDayKey(daysAgo(1)), 2100],
      [localDayKey(daysAgo(2)), 2500],
    ]);
    expect(countConsecutiveGoalDays(totals, met, NOW)).toBe(2);
  });

  it('stops at the first missed day', () => {
    const totals = new Map<string, number>([
      [localDayKey(daysAgo(0)), 2000],
      [localDayKey(daysAgo(1)), 1999],
      [localDayKey(daysAgo(2)), 2000],
    ]);
    expect(countConsecutiveGoalDays(totals, met, NOW)).toBe(1);
  });

  it('returns 0 when yesterday was missed as well', () => {
    const totals = new Map<string, number>([[localDayKey(daysAgo(2)), 3000]]);
    expect(countConsecutiveGoalDays(totals, met, NOW)).toBe(0);
  });

  it('caps the count at the lookback window', () => {
    const totals = new Map(Array.from({ length: 30 }, (_, n) => [localDayKey(daysAgo(n)), 2000] as [string, number]));
    expect(countConsecutiveGoalDays(totals, met, NOW, 10)).toBe(10);
  });

  it('crosses month boundaries', () => {
    const now = new Date(2026, 10, 1, 9, 0); // 1 Nov
    const totals = new Map<string, number>([
      [localDayKey(new Date(2026, 10, 1)), 2000],
      [localDayKey(new Date(2026, 9, 31)), 2000],
      [localDayKey(new Date(2026, 9, 30)), 2000],
    ]);
    expect(countConsecutiveGoalDays(totals, met, now)).toBe(3);
  });
});

describe('daily goal checks', () => {
  it('nutrition goal is met within 90%-110% of target calories', () => {
    expect(isNutritionGoalMet(1800, 2000)).toBe(true);
    expect(isNutritionGoalMet(2200, 2000)).toBe(true);
    expect(isNutritionGoalMet(1799, 2000)).toBe(false);
    expect(isNutritionGoalMet(2201, 2000)).toBe(false);
    expect(isNutritionGoalMet(0, 0)).toBe(false);
  });

  it('water goal is met at or above the target', () => {
    expect(isWaterGoalMet(2000, 2000)).toBe(true);
    expect(isWaterGoalMet(1999, 2000)).toBe(false);
    expect(isWaterGoalMet(5000, 0)).toBe(false);
  });
});

describe('isConditionMet', () => {
  it('unlocks the consecutive nutrition and water achievements from their streaks', () => {
    const nutrition = { type: 'consecutive_nutrition_goal', days: 14 };
    const water = { type: 'consecutive_water_goal', days: 7 };
    expect(isConditionMet(nutrition, userData({ consecutiveNutritionGoalDays: 13 }))).toBe(false);
    expect(isConditionMet(nutrition, userData({ consecutiveNutritionGoalDays: 14 }))).toBe(true);
    expect(isConditionMet(water, userData({ consecutiveWaterGoalDays: 6 }))).toBe(false);
    expect(isConditionMet(water, userData({ consecutiveWaterGoalDays: 7 }))).toBe(true);
  });

  it('keeps the existing rules for the other condition types', () => {
    expect(isConditionMet({ type: 'consecutive_check_in', days: 3 }, userData({ consecutiveCheckIn: 3 }))).toBe(true);
    expect(isConditionMet({ type: 'total_workout_time', minutes: 100 }, userData({ totalWorkoutMinutes: 99 }))).toBe(false);
    expect(isConditionMet({ type: 'weekly_workout', count: 5 }, userData({ weeklyWorkoutCount: 5 }))).toBe(true);
    expect(isConditionMet({ type: 'total_meals', count: 50 }, userData({ totalMeals: 50 }))).toBe(true);
    expect(isConditionMet({ type: 'weight_loss', kg: 5 }, userData({ startWeight: 80, currentWeight: 75 }))).toBe(true);
    expect(isConditionMet({ type: 'weight_loss', kg: 5 }, userData({ startWeight: 80, currentWeight: null }))).toBe(false);
    expect(isConditionMet({ type: 'unknown' }, userData())).toBe(false);
  });
});

describe('achievementProgress', () => {
  it('reports the share of the target reached, as an integer 0-100', () => {
    expect(achievementProgress({ type: 'consecutive_check_in', days: 30 }, userData({ consecutiveCheckIn: 10 }))).toBe(33);
    expect(achievementProgress({ type: 'total_workout_time', minutes: 500 }, userData({ totalWorkoutMinutes: 250 }))).toBe(50);
    expect(achievementProgress({ type: 'consecutive_water_goal', days: 7 }, userData({ consecutiveWaterGoalDays: 3 }))).toBe(42);
    expect(achievementProgress({ type: 'consecutive_nutrition_goal', days: 14 }, userData({ consecutiveNutritionGoalDays: 7 }))).toBe(50);
    expect(achievementProgress({ type: 'weight_loss', kg: 10 }, userData({ startWeight: 80, currentWeight: 77 }))).toBe(30);
  });

  it('caps at 100 and never goes below 0', () => {
    expect(achievementProgress({ type: 'total_meals', count: 50 }, userData({ totalMeals: 80 }))).toBe(100);
    expect(achievementProgress({ type: 'weight_loss', kg: 5 }, userData({ startWeight: 70, currentWeight: 74 }))).toBe(0);
    expect(achievementProgress({ type: 'weight_loss', kg: 5 }, userData())).toBe(0);
  });

  it('is 0 for unknown or malformed conditions', () => {
    expect(achievementProgress({ type: 'unknown', days: 3 }, userData({ consecutiveCheckIn: 3 }))).toBe(0);
    expect(achievementProgress({ type: 'consecutive_check_in' }, userData({ consecutiveCheckIn: 3 }))).toBe(0);
    expect(achievementProgress(null as any, userData())).toBe(0);
  });
});
