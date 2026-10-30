// The service module is replaced so the test does not need a generated Prisma
// client or a database; only the controller and Nest's pipes are real.
jest.mock('./analytics.service', () => ({ AnalyticsService: class AnalyticsService {} }));

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { createControllerTestApp, TEST_USER_ID } from '../../common/testing/controller-test-app';

describe('AnalyticsController query parameters', () => {
  let app: INestApplication;
  const analyticsService = {
    getWeightChart: jest.fn(async () => []),
    getNutritionChart: jest.fn(async () => []),
    getWeightRecords: jest.fn(async () => []),
  };

  beforeAll(async () => {
    app = await createControllerTestApp(AnalyticsController, [
      { provide: AnalyticsService, useValue: analyticsService },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const cases: Array<{ path: string; param: string; method: keyof typeof analyticsService; fallback: number; given: number }> = [
    { path: '/analytics/weight-chart', param: 'days', method: 'getWeightChart', fallback: 30, given: 7 },
    { path: '/analytics/nutrition-chart', param: 'days', method: 'getNutritionChart', fallback: 30, given: 14 },
    { path: '/analytics/weight', param: 'limit', method: 'getWeightRecords', fallback: 30, given: 5 },
  ];

  describe.each(cases)('GET $path', ({ path, param, method, fallback, given }) => {
    it(`uses ${param}=${fallback} when ${param} is omitted`, async () => {
      await request(app.getHttpServer()).get(path).expect(200);
      expect(analyticsService[method]).toHaveBeenCalledWith(TEST_USER_ID, fallback);
    });

    it(`passes a provided ${param} as a number`, async () => {
      await request(app.getHttpServer()).get(`${path}?${param}=${given}`).expect(200);
      expect(analyticsService[method]).toHaveBeenCalledWith(TEST_USER_ID, given);
    });

    // main.ts registers a global ValidationPipe with transform: true. It turns a
    // non-numeric query value into NaN before the route pipes run, and
    // DefaultValuePipe treats NaN like a missing value, so the default applies.
    it(`falls back to ${param}=${fallback} for a non-numeric ${param}`, async () => {
      await request(app.getHttpServer()).get(`${path}?${param}=abc`).expect(200);
      expect(analyticsService[method]).toHaveBeenCalledWith(TEST_USER_ID, fallback);
    });
  });
});
