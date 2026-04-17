import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuPlanDto } from './dto/create-menu-plan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('menu')
@Controller('menu')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MenuController {
  constructor(private menuService: MenuService) {}

  @Post('plans')
  @ApiOperation({ summary: '创建菜单计划' })
  async createMenuPlan(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMenuPlanDto,
  ) {
    return this.menuService.createMenuPlan(userId, dto);
  }

  @Get('plans')
  @ApiOperation({ summary: '获取菜单计划列表' })
  async getMenuPlans(@CurrentUser('id') userId: string) {
    return this.menuService.getMenuPlans(userId);
  }

  @Get('plans/:id')
  @ApiOperation({ summary: '获取菜单计划详情' })
  async getMenuPlan(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.menuService.getMenuPlan(userId, id);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除菜单计划' })
  async deleteMenuPlan(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.menuService.deleteMenuPlan(userId, id);
  }

  @Get('recipes/:id')
  @ApiOperation({ summary: '获取菜谱详情' })
  async getRecipe(@Param('id') id: string) {
    return this.menuService.getRecipe(id);
  }

  @Get('recipes')
  @ApiOperation({ summary: '搜索菜谱' })
  async searchRecipes(
    @Query('q') query: string,
    @Query('taste') taste?: string,
    @Query('maxCalories') maxCalories?: number,
    @Query('minProtein') minProtein?: number,
    @Query('difficulty') difficulty?: number,
  ) {
    return this.menuService.searchRecipes(query, {
      taste: taste ? taste.split(',') as any : undefined,
      maxCalories,
      minProtein,
      difficulty,
    });
  }
}
