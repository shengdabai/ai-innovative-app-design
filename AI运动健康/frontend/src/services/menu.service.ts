import { apiClient } from './api';

export class MenuService {
  private static instance: MenuService;

  static getInstance(): MenuService {
    if (!MenuService.instance) {
      MenuService.instance = new MenuService();
    }
    return MenuService.instance;
  }

  async createMenuPlan(data: {
    name?: string;
    startDate: string;
    days?: number;
    availableIngredients?: string[];
  }) {
    return apiClient.post('/menu/plans', data);
  }

  async getMenuPlans() {
    return apiClient.get('/menu/plans');
  }

  async getMenuPlan(id: string) {
    return apiClient.get(`/menu/plans/${id}`);
  }

  async deleteMenuPlan(id: string) {
    return apiClient.delete(`/menu/plans/${id}`);
  }

  async getRecipe(id: string) {
    return apiClient.get(`/menu/recipes/${id}`);
  }

  async searchRecipes(query: string, filters?: {
    taste?: string;
    maxCalories?: number;
    minProtein?: number;
  }) {
    return apiClient.get('/menu/recipes', { params: { q: query, ...filters } });
  }
}

export const menuService = MenuService.getInstance();
