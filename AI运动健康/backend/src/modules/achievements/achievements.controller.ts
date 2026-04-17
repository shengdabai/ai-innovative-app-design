import {
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('achievements')
@Controller('achievements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AchievementsController {
  constructor(private achievementsService: AchievementsService) {}

  @Get('list')
  @ApiOperation({ summary: '获取所有成就列表' })
  async getAchievements() {
    return this.achievementsService.getAchievements();
  }

  @Get('my')
  @ApiOperation({ summary: '获取我的成就' })
  async getUserAchievements(@CurrentUser('id') userId: string) {
    return this.achievementsService.getUserAchievements(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取成就统计' })
  async getAchievementStats(@CurrentUser('id') userId: string) {
    return this.achievementsService.getAchievementStats(userId);
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '检查并解锁新成就' })
  async checkAndUnlockAchievements(@CurrentUser('id') userId: string) {
    return this.achievementsService.checkAndUnlockAchievements(userId);
  }

  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '初始化成就列表（仅管理员）' })
  async initializeAchievements() {
    return this.achievementsService.initializeAchievements();
  }
}
