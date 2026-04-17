import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ChatRole } from '@prisma/client';
import OpenAI from 'openai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  message: string;
  suggestions?: string[];
}

/**
 * AI健身对话教练服务
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private openai: OpenAI | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * 发送消息并获取AI回复
   */
  async chat(userId: string, message: string): Promise<ChatResponse> {
    // 保存用户消息
    await this.prisma.chatMessage.create({
      data: {
        userId,
        role: ChatRole.USER,
        content: message,
      },
    });

    // 获取用户上下文
    const context = await this.getUserContext(userId);

    // 获取历史对话
    const history = await this.getRecentChatHistory(userId, 10);

    // 构建系统提示
    const systemPrompt = this.buildSystemPrompt(context);

    // 调用AI
    const response = await this.callAI(systemPrompt, history, message);

    // 保存AI回复
    await this.prisma.chatMessage.create({
      data: {
        userId,
        role: ChatRole.ASSISTANT,
        content: response.message,
      },
    });

    return response;
  }

  /**
   * 获取聊天历史
   */
  async getChatHistory(
    userId: string,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages
      .reverse()
      .map((msg) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
      }));
  }

  /**
   * 清除聊天历史
   */
  async clearChatHistory(userId: string) {
    await this.prisma.chatMessage.deleteMany({
      where: { userId },
    });

    return { success: true };
  }

  /**
   * 获取用户上下文
   */
  private async getUserContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user || !user.profile) {
      return { hasProfile: false };
    }

    const profile = user.profile;

    // 获取最近的数据
    const today = new Date(new Date().toDateString());

    const [latestWeight, todayMeals, weekMeals] = await Promise.all([
      this.prisma.weightRecord.findFirst({
        where: { userId },
        orderBy: { recordDate: 'desc' },
      }),
      this.prisma.mealRecord.findMany({
        where: { userId, mealDate: { gte: today } },
      }),
      this.prisma.mealRecord.findMany({
        where: {
          userId,
          mealDate: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // 计算今日营养摄入
    const todayNutrition = todayMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totalCalories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return {
      hasProfile: true,
      profile: {
        gender: profile.gender,
        goal: profile.fitnessGoal,
        activityLevel: profile.activityLevel,
        targetWeight: profile.targetWeight,
        currentWeight: latestWeight?.weight,
        targetCalories: profile.targetCalories,
        allergies: profile.allergies,
        dislikedFoods: profile.dislikedFoods,
        tastePreference: profile.tastePreference,
      },
      todayNutrition: {
        calories: Math.round(todayNutrition.calories),
        protein: Math.round(todayNutrition.protein),
        carbs: Math.round(todayNutrition.carbs),
        fat: Math.round(todayNutrition.fat),
      },
      mealsLogged: todayMeals.length,
      mealsThisWeek: weekMeals.length,
    };
  }

  /**
   * 获取最近聊天历史
   */
  private async getRecentChatHistory(
    userId: string,
    count: number,
  ): Promise<ChatMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: count * 2, // 获取更多以确保有足够的上下文
    });

    return messages
      .reverse()
      .map((msg) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
      }));
  }

  /**
   * 构建系统提示
   */
  private buildSystemPrompt(context: any): string {
    if (!context.hasProfile) {
      return `你是AI健身教练助手"小智"。

当前用户还没有完善个人资料。

你的职责：
1. 引导用户完善个人资料（性别、身高、体重、目标等）
2. 回答健身和营养相关的基础问题
3. 语气友好、专业、鼓励性

请用简短的回复，不要超过200字。`;
    }

    const goalTexts = {
      LOSE_WEIGHT: '减脂',
      GAIN_MUSCLE: '增肌',
      MAINTAIN: '保持',
      IMPROVE_HEALTH: '改善健康',
    };

    const genderText = context.profile.gender === 'MALE' ? '男生' : '女生';

    return `你是AI健身教练助手"小智"。

用户信息：
- 性别：${genderText}
- 目标：${goalTexts[context.profile.goal] || '保持健康'}
- 活动水平：${context.profile.activityLevel}
- 目标体重：${context.profile.targetWeight || '未设置'}kg
- 当前体重：${context.profile.currentWeight || '未知'}kg
- 目标热量：${context.profile.targetCalories}kcal
- 过敏源：${context.profile.allergies?.join(', ') || '无'}
- 不喜欢的食物：${context.profile.dislikedFoods?.join(', ') || '无'}
- 口味偏好：${context.profile.tastePreference?.join(', ') || '无'}

今日数据：
- 已记录餐数：${context.mealsLogged}餐
- 已摄入热量：${context.todayNutrition.calories}kcal
- 蛋白质：${context.todayNutrition.protein}g
- 碳水：${context.todayNutrition.carbs}g
- 脂肪：${context.todayNutrition.fat}g

你的职责：
1. 根据用户目标提供专业的健身和营养建议
2. 鼓励用户坚持健康习惯
3. 回答问题时考虑用户的具体情况
4. 语气友好、专业、鼓励性
5. 回复要简洁，不要超过200字

重要提醒：
- 如果用户询问健康问题，请在回复末尾加上"⚠️ 本建议仅供参考，如有健康问题请咨询专业医生"`;
  }

  /**
   * 调用AI生成回复
   */
  private async callAI(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string,
  ): Promise<ChatResponse> {
    if (!this.openai) {
      return {
        message: '抱歉，AI服务暂时不可用。请稍后再试。',
        suggestions: [
          '查看我的饮食记录',
          '获取运动建议',
          '了解营养知识',
        ],
      };
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.8,
        max_tokens: 500,
      });

      const message = completion.choices[0]?.message?.content || '抱歉，我没有理解您的问题。';

      return { message };
    } catch (error) {
      this.logger.error(`AI调用失败: ${error.message}`);
      return {
        message: '抱歉，服务暂时出现问题，请稍后再试。',
        suggestions: [
          '查看今日饮食记录',
          '获取运动建议',
          '我的目标进度',
        ],
      };
    }
  }

  /**
   * 获取快捷建议
   */
  async getSuggestions(userId: string): Promise<string[]> {
    const context = await this.getUserContext(userId);

    const suggestions: string[] = [];

    if (!context.hasProfile) {
      return ['完善我的个人资料', '如何制定减脂计划？', '新手健身应该从哪里开始？'];
    }

    // 基于用户状态生成建议
    if (context.mealsLogged < 3) {
      suggestions.push('记录今天的饮食', '推荐今天吃什么');
    }

    if (context.todayNutrition.calories < context.profile.targetCalories * 0.5) {
      suggestions.push('今天的热量摄入偏低，加餐推荐');
    }

    if (context.profile.goal === 'LOSE_WEIGHT') {
      suggestions.push('减脂期间如何安排饮食？', '有效的减脂运动推荐');
    } else if (context.profile.goal === 'GAIN_MUSCLE') {
      suggestions.push('增肌需要多少蛋白质？', '力量训练入门指南');
    }

    suggestions.push(
      '分析我的饮食习惯',
      '如何突破体重平台期？',
      '健康零食推荐',
    );

    return suggestions.slice(0, 6);
  }
}
