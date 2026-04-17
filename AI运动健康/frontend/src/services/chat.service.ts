import { apiClient } from './api';

export class ChatService {
  private static instance: ChatService;

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async sendMessage(message: string) {
    return apiClient.post('/chat/send', { message });
  }

  async getChatHistory(limit: number = 50) {
    return apiClient.get('/chat/history', { params: { limit } });
  }

  async clearChatHistory() {
    return apiClient.delete('/chat/history');
  }

  async getSuggestions() {
    return apiClient.get('/chat/suggestions');
  }
}

export const chatService = ChatService.getInstance();
