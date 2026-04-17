import { IsString, IsOptional, IsArray, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMenuPlanDto {
  @ApiProperty({ description: '计划名称', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '开始日期 (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: '计划天数', default: 7, required: false })
  @IsOptional()
  @IsNumber()
  days?: number = 7;

  @ApiProperty({
    description: '可用食材列表',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableIngredients?: string[];
}
