// 通用类型
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 用户类型
export interface User {
  id: string;
  email: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  profile?: UserProfile;
  subscription?: Subscription;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate?: string;
  height?: number;
  weight?: number;
  targetWeight?: number;
  fitnessGoal: 'LOSE_WEIGHT' | 'GAIN_MUSCLE' | 'MAINTAIN' | 'IMPROVE_HEALTH';
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  tastePreference: TastePreference[];
  allergies: string[];
  dislikedFoods: string[];
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetWater: number;
}

export type TastePreference = 'SPICY' | 'SWEET' | 'SALTY' | 'LIGHT' | 'SOUR' | 'BITTER';

export interface Subscription {
  id: string;
  userId: string;
  plan: 'FREE' | 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
  startDate: string;
  endDate?: string;
}

// 饮食记录类型
export interface MealRecord {
  id: string;
  userId: string;
  mealType: MealType;
  imageUrl?: string;
  notes?: string;
  identifiedFoods: IdentifiedFood[];
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  mealDate: string;
  createdAt: string;
  updatedAt: string;
}

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface IdentifiedFood {
  name: string;
  weight?: number;
  confidence?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface DailySummary {
  date: string;
  total: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  meals: {
    breakfast: MealNutrition;
    lunch: MealNutrition;
    dinner: MealNutrition;
    snack: MealNutrition;
  };
  targets?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  progress?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface MealNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number;
}

// 菜单类型
export interface MenuPlan {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  meals: DayMenu[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DayMenu {
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

export interface MealSuggestion {
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

// 菜谱类型
export interface Recipe {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  taste: TastePreference[];
  difficulty: number;
  prepTime: number;
  cookTime: number;
  servings: number;
  tags: string[];
}

export interface RecipeIngredient {
  foodId?: string;
  name: string;
  amount: number;
  unit: string;
}

// 分析数据类型
export interface DashboardData {
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

// 成就类型
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  condition: any;
}

export type AchievementCategory = 'CHECK_IN' | 'WORKOUT' | 'NUTRITION' | 'WEIGHT' | 'SOCIAL';

export interface UserAchievement {
  achievement: Achievement;
  unlockedAt: string;
}

// 聊天类型
export interface ChatMessage {
  id: string;
  userId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}
