import { apiClient } from './api';

export class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async getDashboard() {
    return apiClient.get('/analytics/dashboard');
  }

  async getWeightChart(days: number = 30) {
    return apiClient.get('/analytics/weight-chart', { params: { days } });
  }

  async getNutritionChart(days: number = 30) {
    return apiClient.get('/analytics/nutrition-chart', { params: { days } });
  }

  async recordWeight(data: { weight: number; bodyFat?: number; notes?: string }) {
    return apiClient.post('/analytics/weight', data);
  }

  async getWeightRecords(limit: number = 30) {
    return apiClient.get('/analytics/weight', { params: { limit } });
  }

  async recordWorkout(data: {
    workoutType: string;
    duration: number;
    caloriesBurned?: number;
    notes?: string;
  }) {
    return apiClient.post('/analytics/workout', data);
  }

  async getWorkoutRecords(params?: { startDate?: string; endDate?: string }) {
    return apiClient.get('/analytics/workout', { params });
  }

  async recordWater(amount: number) {
    return apiClient.post('/analytics/water', { amount });
  }

  async getWaterRecords(date?: string) {
    return apiClient.get('/analytics/water', { params: { date } });
  }
}

export const analyticsService = AnalyticsService.getInstance();
