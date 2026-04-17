import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private recipesService: RecipesService) {}

  @Get('search')
  @ApiOperation({ summary: '搜索菜谱' })
  async searchRecipes(
    @Query('q') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.recipesService.searchRecipes(query, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取菜谱详情' })
  async getRecipe(@Query('id') id: string) {
    return this.recipesService.getRecipe(id);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建新菜谱' })
  async createRecipe(@Body() recipeData: any) {
    return this.recipesService.createRecipe(recipeData);
  }
}
