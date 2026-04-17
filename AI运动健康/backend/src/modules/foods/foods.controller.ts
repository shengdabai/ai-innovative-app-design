import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FoodsService } from './foods.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtOptionalGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('foods')
@Controller('foods')
@UseGuards(JwtOptionalGuard)
@ApiBearerAuth()
export class FoodsController {
  constructor(private foodsService: FoodsService) {}

  @Get('search')
  @ApiOperation({ summary: '搜索食物' })
  async searchFoods(
    @Query('q') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.foodsService.searchFoods(query, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取食物详情' })
  async getFood(@Query('id') id: string) {
    return this.foodsService.getFood(id);
  }

  @Get('categories/list')
  @ApiOperation({ summary: '获取食物分类列表' })
  async getCategories() {
    return this.foodsService.getCategories();
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '添加新食物（用户贡献）' })
  async createFood(@Body() foodData: any) {
    return this.foodsService.createFood(foodData);
  }
}
