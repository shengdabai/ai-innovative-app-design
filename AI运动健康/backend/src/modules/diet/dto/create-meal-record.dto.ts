import { IsEnum, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MealType } from '@prisma/client';

export interface FoodItemDto {
  name: string;
  weight?: number;
  confidence?: number;
}

export class CreateMealRecordDto {
  @ApiProperty({ enum: MealType, description: '餐次类型' })
  @IsEnum(MealType)
  mealType: MealType;

  @ApiProperty({ required: false, description: '图片URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false, description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    required: false,
    description: '识别到的食物列表',
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  foods?: FoodItemDto[];
}
