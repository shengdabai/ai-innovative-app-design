/**
 * 成就条件的度量与进度计算（纯函数，不访问数据库，便于单元测试）。
 */

/** 营养达标：当日摄入热量在目标热量的 90%–110% 之间。 */
export const NUTRITION_GOAL_MIN_RATIO = 0.9;
export const NUTRITION_GOAL_MAX_RATIO = 1.1;
/** 与 UserProfile 的默认值一致。 */
export const DEFAULT_TARGET_CALORIES = 2000;
export const DEFAULT_TARGET_WATER_ML = 2000;
/** 连续达标最多回看的天数，需不小于任何连续类成就要求的天数。 */
export const GOAL_STREAK_LOOKBACK_DAYS = 60;

export interface AchievementUserData {
  consecutiveCheckIn: number;
  totalWorkoutMinutes: number;
  weeklyWorkoutCount: number;
  totalMeals: number;
  currentWeight?: number | null;
  startWeight?: number | null;
  weeklyMealCount?: number;
  weeklyWaterAmount?: number;
  consecutiveNutritionGoalDays: number;
  consecutiveWaterGoalDays: number;
}

export interface AchievementCondition {
  type: string;
  days?: number;
  minutes?: number;
  count?: number;
  kg?: number;
}

/** 服务器本地时区的日期键，与其他模块里 setHours(0, 0, 0, 0) 的“今天”一致。 */
export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 把记录按本地日期汇总。 */
export function sumByLocalDay<T>(
  records: T[],
  dateOf: (record: T) => Date,
  valueOf: (record: T) => number,
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const record of records) {
    const key = localDayKey(dateOf(record));
    totals.set(key, (totals.get(key) || 0) + (valueOf(record) || 0));
  }
  return totals;
}

/**
 * 从今天往前数连续达标的天数。今天还没结束，所以今天未达标时从昨天开始数，
 * 今天未达标不会打断昨天及以前的连续记录。
 */
export function countConsecutiveGoalDays(
  dailyTotals: Map<string, number>,
  isGoalMet: (total: number) => boolean,
  now: Date,
  maxDays = GOAL_STREAK_LOOKBACK_DAYS,
): number {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!isGoalMet(dailyTotals.get(localDayKey(day)) || 0)) {
    day.setDate(day.getDate() - 1);
  }
  let streak = 0;
  while (streak < maxDays && isGoalMet(dailyTotals.get(localDayKey(day)) || 0)) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

export function isNutritionGoalMet(calories: number, targetCalories: number): boolean {
  if (!(targetCalories > 0)) return false;
  return (
    calories >= targetCalories * NUTRITION_GOAL_MIN_RATIO &&
    calories <= targetCalories * NUTRITION_GOAL_MAX_RATIO
  );
}

export function isWaterGoalMet(amountMl: number, targetWaterMl: number): boolean {
  if (!(targetWaterMl > 0)) return false;
  return amountMl >= targetWaterMl;
}

/**
 * 成就条件对应的当前值与目标值；未知条件返回 null。
 * 解锁判断与进度计算共用这一份定义。
 */
export function conditionMetric(
  condition: AchievementCondition,
  userData: AchievementUserData,
): { current: number; target: number | undefined } | null {
  switch (condition?.type) {
    case 'consecutive_check_in':
      return { current: userData.consecutiveCheckIn, target: condition.days };
    case 'total_workout_time':
      return { current: userData.totalWorkoutMinutes, target: condition.minutes };
    case 'weekly_workout':
      return { current: userData.weeklyWorkoutCount, target: condition.count };
    case 'total_meals':
      return { current: userData.totalMeals, target: condition.count };
    case 'consecutive_nutrition_goal':
      return { current: userData.consecutiveNutritionGoalDays, target: condition.days };
    case 'consecutive_water_goal':
      return { current: userData.consecutiveWaterGoalDays, target: condition.days };
    case 'weight_loss':
      if (!userData.startWeight || !userData.currentWeight) return { current: 0, target: condition.kg };
      return { current: userData.startWeight - userData.currentWeight, target: condition.kg };
    default:
      return null;
  }
}

export function isConditionMet(condition: AchievementCondition, userData: AchievementUserData): boolean {
  const metric = conditionMetric(condition, userData);
  const target = metric?.target ?? 0;
  if (!metric || !(target > 0)) return false;
  return metric.current >= target;
}

/** 0–100 的整数进度；未知条件为 0。 */
export function achievementProgress(condition: AchievementCondition, userData: AchievementUserData): number {
  const metric = conditionMetric(condition, userData);
  const target = metric?.target ?? 0;
  if (!metric || !(target > 0)) return 0;
  const ratio = Math.max(0, metric.current || 0) / target;
  return Math.min(100, Math.floor(ratio * 100));
}
