import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender, FitnessGoal, ActivityLevel, TastePreference } from '@prisma/client';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ required: false, enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  targetWeight?: number;

  @ApiProperty({ required: false, enum: FitnessGoal })
  @IsOptional()
  @IsEnum(FitnessGoal)
  fitnessGoal?: FitnessGoal;

  @ApiProperty({ required: false, enum: ActivityLevel })
  @IsOptional()
  @IsEnum(ActivityLevel)
  activityLevel?: ActivityLevel;

  @ApiProperty({ required: false, enum: TastePreference, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(TastePreference, { each: true })
  tastePreference?: TastePreference[];

  @ApiProperty({ required: false, isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiProperty({ required: false, isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dislikedFoods?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  targetCalories?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  targetProtein?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  targetCarbs?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  targetFat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  targetWater?: number;
}
