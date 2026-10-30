// The service module is replaced so the test does not need a generated Prisma
// client or a database; only the controller and Nest's pipes are real.
jest.mock('./recipes.service', () => ({ RecipesService: class RecipesService {} }));

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { createControllerTestApp } from '../../common/testing/controller-test-app';

describe('RecipesController query parameters', () => {
  let app: INestApplication;
  const recipesService = { searchRecipes: jest.fn(async () => ({ items: [], total: 0 })) };

  beforeAll(async () => {
    app = await createControllerTestApp(RecipesController, [{ provide: RecipesService, useValue: recipesService }]);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /recipes/search uses page 1 and limit 20 when both are omitted', async () => {
    await request(app.getHttpServer()).get('/recipes/search?q=egg').expect(200);
    expect(recipesService.searchRecipes).toHaveBeenCalledWith('egg', 1, 20);
  });

  it('GET /recipes/search passes provided page and limit as numbers', async () => {
    await request(app.getHttpServer()).get('/recipes/search?q=egg&page=3&limit=5').expect(200);
    expect(recipesService.searchRecipes).toHaveBeenCalledWith('egg', 3, 5);
  });

  // main.ts registers a global ValidationPipe with transform: true. It turns a
  // non-numeric query value into NaN before the route pipes run, and
  // DefaultValuePipe treats NaN like a missing value, so the default applies.
  it('GET /recipes/search falls back to page 1 and limit 20 for non-numeric values', async () => {
    await request(app.getHttpServer()).get('/recipes/search?q=egg&page=abc&limit=xyz').expect(200);
    expect(recipesService.searchRecipes).toHaveBeenCalledWith('egg', 1, 20);
  });

  it('GET /recipes/search rejects a fractional page with 400', async () => {
    await request(app.getHttpServer()).get('/recipes/search?q=egg&page=1.5').expect(400);
    expect(recipesService.searchRecipes).not.toHaveBeenCalled();
  });
});
