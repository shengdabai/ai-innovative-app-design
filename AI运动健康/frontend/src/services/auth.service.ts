import { apiClient } from './api';
import * as SecureStore from 'expo-secure-store';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  phone?: string;
  nickname?: string;
  profile?: {
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    birthDate?: string;
    height?: number;
    weight?: number;
    targetWeight?: number;
    fitnessGoal?: 'LOSE_WEIGHT' | 'GAIN_MUSCLE' | 'MAINTAIN' | 'IMPROVE_HEALTH';
    activityLevel?: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  };
}

export interface AuthResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', dto);

    // 保存token
    await SecureStore.setItemAsync('accessToken', response.accessToken);
    await SecureStore.setItemAsync('refreshToken', response.refreshToken);

    return response;
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', dto);

    // 保存token
    await SecureStore.setItemAsync('accessToken', response.accessToken);
    await SecureStore.setItemAsync('refreshToken', response.refreshToken);

    return response;
  }

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }

  async getCurrentUser(): Promise<any> {
    return apiClient.get('/auth/me');
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('accessToken');
    return !!token;
  }
}

export const authService = AuthService.getInstance();
