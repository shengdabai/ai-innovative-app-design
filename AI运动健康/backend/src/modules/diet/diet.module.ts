import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DietController } from './diet.controller';
import { DietService } from './diet.service';
import { ImageRecognitionService } from './services/image-recognition.service';
import { NutritionCalculationService } from './services/nutrition-calculation.service';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [DietController],
  providers: [
    DietService,
    ImageRecognitionService,
    NutritionCalculationService,
  ],
  exports: [DietService],
})
export class DietModule {}
