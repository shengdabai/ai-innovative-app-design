import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '获取用户仪表盘数据' })
  async getDashboard(@CurrentUser('id') userId: string) {
    return this.analyticsService.getDashboard(userId);
  }

  @Get('weight-chart')
  @ApiOperation({ summary: '获取体重趋势图表' })
  async getWeightChart(
    @CurrentUser('id') userId: string,
    @Query('days', ParseIntPipe) days: number = 30,
  ) {
    return this.analyticsService.getWeightChart(userId, days);
  }

  @Get('nutrition-chart')
  @ApiOperation({ summary: '获取营养摄入图表' })
  async getNutritionChart(
    @CurrentUser('id') userId: string,
    @Query('days', ParseIntPipe) days: number = 30,
  ) {
    return this.analyticsService.getNutritionChart(userId, days);
  }

  @Post('weight')
  @ApiOperation({ summary: '记录体重' })
  async recordWeight(
    @CurrentUser('id') userId: string,
    @Body('weight') weight: number,
    @Body('bodyFat') bodyFat?: number,
    @Body('notes') notes?: string,
  ) {
    return this.analyticsService.recordWeight(userId, weight, bodyFat, notes);
  }

  @Get('weight')
  @ApiOperation({ summary: '获取体重记录' })
  async getWeightRecords(
    @CurrentUser('id') userId: string,
    @Query('limit', ParseIntPipe) limit: number = 30,
  ) {
    return this.analyticsService.getWeightRecords(userId, limit);
  }

  @Post('workout')
  @ApiOperation({ summary: '记录运动' })
  async recordWorkout(
    @CurrentUser('id') userId: string,
    @Body('workoutType') workoutType: string,
    @Body('duration') duration: number,
    @Body('caloriesBurned') caloriesBurned?: number,
    @Body('notes') notes?: string,
  ) {
    return this.analyticsService.recordWorkout(
      userId,
      workoutType,
      duration,
      caloriesBurned,
      notes,
    );
  }

  @Get('workout')
  @ApiOperation({ summary: '获取运动记录' })
  async getWorkoutRecords(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getWorkoutRecords(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Post('water')
  @ApiOperation({ summary: '记录饮水' })
  async recordWater(
    @CurrentUser('id') userId: string,
    @Body('amount') amount: number,
  ) {
    return this.analyticsService.recordWater(userId, amount);
  }

  @Get('water')
  @ApiOperation({ summary: '获取饮水记录' })
  async getWaterRecords(
    @CurrentUser('id') userId: string,
    @Query('date') date?: string,
  ) {
    return this.analyticsService.getWaterRecords(
      userId,
      date ? new Date(date) : new Date(),
    );
  }
}
