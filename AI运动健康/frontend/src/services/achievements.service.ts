import { apiClient } from './api';

export class AchievementsService {
  private static instance: AchievementsService;

  static getInstance(): AchievementsService {
    if (!AchievementsService.instance) {
      AchievementsService.instance = new AchievementsService();
    }
    return AchievementsService.instance;
  }

  async getAchievements() {
    return apiClient.get('/achievements/list');
  }

  async getUserAchievements() {
    return apiClient.get('/achievements/my');
  }

  async getAchievementStats() {
    return apiClient.get('/achievements/stats');
  }

  async checkAndUnlockAchievements() {
    return apiClient.post('/achievements/check');
  }
}

export const achievementsService = AchievementsService.getInstance();
