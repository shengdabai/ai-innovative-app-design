import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DietController } from './diet.controller';
import { DietService } from './diet.service';
import { ImageRecognitionService } from './services/image-recognition.service';
import { NutritionCalculationService } from './services/nutrition-calculation.service';

@Module({
  imports: [
    // Memory storage: ImageRecognitionService reads file.buffer, and nothing
    // keeps the photo afterwards. Disk storage (`dest`) gave no buffer and left
    // every upload in ./uploads.
    MulterModule.register({
      storage: memoryStorage(),
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
