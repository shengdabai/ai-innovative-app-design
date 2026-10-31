// The providers' modules are replaced so the test needs neither a generated
// Prisma client nor image-recognition credentials. DietModule itself is real,
// so its MulterModule options decide how the uploaded photo reaches the service.
jest.mock('./diet.service', () => ({ DietService: class DietService {} }));
jest.mock('./services/image-recognition.service', () => ({
  ImageRecognitionService: class ImageRecognitionService {},
}));
jest.mock('./services/nutrition-calculation.service', () => ({
  NutritionCalculationService: class NutritionCalculationService {},
}));

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DietModule } from './diet.module';
import { DietService } from './diet.service';
import { createTestApp, TEST_USER_ID } from '../../common/testing/controller-test-app';

describe('DietModule meal photo upload', () => {
  let app: INestApplication;
  const dietService = { createMealRecord: jest.fn(async () => ({ id: 'meal-1' })) };

  beforeAll(async () => {
    app = await createTestApp({ imports: [DietModule] }, (builder) =>
      builder.overrideProvider(DietService).useValue(dietService),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ImageRecognitionService reads image.buffer. Disk storage (multer `dest`)
  // gives the file a path but no buffer, so recognition always failed.
  it('POST /diet/meals passes the photo bytes in memory, not as a file on disk', async () => {
    const photo = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    await request(app.getHttpServer())
      .post('/diet/meals')
      .field('mealType', 'LUNCH')
      .attach('image', photo, { filename: 'meal.jpg', contentType: 'image/jpeg' })
      .expect(201);

    expect(dietService.createMealRecord).toHaveBeenCalledTimes(1);
    const [userId, dto, image] = dietService.createMealRecord.mock.calls[0] as unknown as [
      string,
      { mealType: string },
      Express.Multer.File,
    ];
    expect(userId).toBe(TEST_USER_ID);
    expect(dto).toEqual(expect.objectContaining({ mealType: 'LUNCH' }));
    expect(image.fieldname).toBe('image');
    expect(Buffer.isBuffer(image.buffer)).toBe(true);
    expect(image.buffer.equals(photo)).toBe(true);
    expect(image.path).toBeUndefined();
  });

  it('POST /diet/meals still rejects a photo larger than 5 MB with 413', async () => {
    await request(app.getHttpServer())
      .post('/diet/meals')
      .field('mealType', 'LUNCH')
      .attach('image', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'big.jpg', contentType: 'image/jpeg' })
      .expect(413);
    expect(dietService.createMealRecord).not.toHaveBeenCalled();
  });
});
