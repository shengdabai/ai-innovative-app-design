import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { UserInfo } from '../../common/decorators/user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: '获取用户资料' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取用户统计' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.usersService.getUserStats(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: '更新用户资料' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Put('subscription')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新订阅计划' })
  async updateSubscription(
    @CurrentUser('id') userId: string,
    @Body('plan') plan: 'MONTHLY' | 'YEARLY' | 'LIFETIME',
  ) {
    return this.usersService.updateSubscription(userId, plan);
  }

  @Delete('account')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除用户账户' })
  async deleteAccount(@CurrentUser('id') userId: string) {
    return this.usersService.deleteUser(userId);
  }
}
