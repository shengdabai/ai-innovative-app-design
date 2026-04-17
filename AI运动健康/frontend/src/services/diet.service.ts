import { apiClient } from './api';

export interface MealRecord {
  id: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  imageUrl?: string;
  notes?: string;
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealDate: string;
}

export class DietService {
  private static instance: DietService;

  static getInstance(): DietService {
    if (!DietService.instance) {
      DietService.instance = new DietService();
    }
    return DietService.instance;
  }

  async createMealRecord(data: {
    mealType: string;
    imageUrl?: string;
    notes?: string;
    imageFile?: any;
  }) {
    const formData = new FormData();
    formData.append('mealType', data.mealType);
    if (data.notes) formData.append('notes', data.notes);
    if (data.imageFile) formData.append('image', data.imageFile);

    return apiClient.post('/diet/meals', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async getMealRecords(params?: {
    startDate?: string;
    endDate?: string;
    mealType?: string;
    page?: number;
    limit?: number;
  }) {
    return apiClient.get('/diet/meals', { params });
  }

  async getDailySummary(date: string) {
    return apiClient.get(`/diet/summary/${date}`);
  }

  async getTodaySummary() {
    return apiClient.get('/diet/summary');
  }

  async getDietTrends(days: number = 30) {
    return apiClient.get('/diet/trends', { params: { days } });
  }

  async getNutritionAdvice() {
    return apiClient.get('/diet/advice');
  }

  async deleteMealRecord(id: string) {
    return apiClient.delete(`/diet/meals/${id}`);
  }
}

export const dietService = DietService.getInstance();
