import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import vision from '@google-cloud/vision';
import axios from 'axios';

interface RecognizedFood {
  name: string;
  confidence: number;
  estimatedWeight?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface RecognitionResult {
  foods: RecognizedFood[];
  rawLabels: string[];
}

/**
 * 图像识别服务 - 支持多种识别方案
 */
@Injectable()
export class ImageRecognitionService {
  private readonly logger = new Logger(ImageRecognitionService.name);
  private visionClient: any;

  constructor(private configService: ConfigService) {
    // 初始化 Google Vision 客户端
    try {
      const credentialsBase64 = this.configService.get<string>(
        'GOOGLE_CREDENTIALS_BASE64',
      );
      if (credentialsBase64) {
        const credentials = JSON.parse(
          Buffer.from(credentialsBase64, 'base64').toString(),
        );
        this.visionClient = new vision.ImageAnnotatorClient({
          credentials,
        });
      }
    } catch (error) {
      this.logger.warn('Google Vision 初始化失败，将使用备用方案');
    }
  }

  /**
   * 识别食物图片
   */
  async recognizeFood(
    image: Express.Multer.File,
  ): Promise<RecognitionResult> {
    try {
      // 优先使用 Google Vision API
      if (this.visionClient) {
        return await this.recognizeWithGoogleVision(image);
      }

      // 备用方案：使用 OpenAI Vision
      return await this.recognizeWithOpenAI(image);
    } catch (error) {
      this.logger.error(`食物识别失败: ${error.message}`);
      return { foods: [], rawLabels: [] };
    }
  }

  /**
   * 使用 Google Vision API 识别
   */
  private async recognizeWithGoogleVision(
    image: Express.Multer.File,
  ): Promise<RecognitionResult> {
    try {
      const [result] = await this.visionClient.labelDetection({
        image: { content: image.buffer },
      });

      const labels = result.labelAnnotations || [];

      // 过滤出食物相关标签
      const foodLabels = labels
        .filter((label: any) =>
          this.isFoodRelated(label.description.toLowerCase()),
        )
        .map((label: any) => ({
          name: label.description,
          confidence: label.score,
        }));

      // 转换为食物项
      const foods = await this.convertLabelsToFoods(foodLabels);

      return {
        foods,
        rawLabels: labels.map((l: any) => l.description),
      };
    } catch (error) {
      this.logger.error(`Google Vision 识别失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 使用 OpenAI Vision API 识别
   */
  private async recognizeWithOpenAI(
    image: Express.Multer.File,
  ): Promise<RecognitionResult> {
    try {
      const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!openaiApiKey) {
        throw new Error('OpenAI API Key 未配置');
      }

      const base64Image = image.buffer.toString('base64');

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `请分析这张图片中的食物，以JSON格式返回。
                  返回格式：
                  {
                    "foods": [
                      {"name": "食物名称", "confidence": 0.95, "estimatedWeight": 100}
                    ]
                  }
                  请尽量准确识别食物种类和预估重量（克）。`,
                },
                {
                  type: 'image_url',
                  image_url: { url: `data:${image.mimetype};base64,${base64Image}` },
                },
              ],
            },
          ],
          max_tokens: 500,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiApiKey}`,
          },
        },
      );

      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const foods = await this.convertLabelsToFoods(parsed.foods || []);
        return { foods, rawLabels: [] };
      }

      return { foods: [], rawLabels: [] };
    } catch (error) {
      this.logger.error(`OpenAI Vision 识别失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 判断是否是食物相关标签
   */
  private isFoodRelated(label: string): boolean {
    const foodKeywords = [
      'food',
      'dish',
      'meal',
      'cuisine',
      '蔬菜',
      '水果',
      '肉类',
      '米饭',
      '面条',
      'bread',
      'meat',
      'vegetable',
      'fruit',
      'rice',
      'noodle',
      'soup',
      '汤',
      'salad',
      '沙拉',
      'chicken',
      '鸡肉',
      'beef',
      '牛肉',
      'pork',
      '猪肉',
      'fish',
      '鱼',
      'egg',
      '蛋',
      'tofu',
      '豆腐',
    ];

    return foodKeywords.some((keyword) => label.includes(keyword));
  }

  /**
   * 将标签转换为食物项（需要连接营养数据库）
   */
  private async convertLabelsToFoods(
    labels: Array<{ name: string; confidence: number }>,
  ): Promise<RecognizedFood[]> {
    // 这里需要查询营养数据库
    // 简化实现，返回基本结构
    return labels.map((label) => ({
      name: label.name,
      confidence: label.confidence,
      estimatedWeight: 100, // 默认100g，后续可通过AI模型预估
    }));
  }

  /**
   * 批量识别
   */
  async recognizeBatch(
    images: Express.Multer.File[],
  ): Promise<RecognitionResult[]> {
    const results = await Promise.all(
      images.map((img) => this.recognizeFood(img)),
    );
    return results;
  }
}
