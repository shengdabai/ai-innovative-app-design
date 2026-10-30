// The service module is replaced so the test does not need a generated Prisma
// client or a database; only the controller and Nest's pipes are real.
jest.mock('./menu.service', () => ({ MenuService: class MenuService {} }));

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { createControllerTestApp } from '../../common/testing/controller-test-app';

describe('MenuController query parameters', () => {
  let app: INestApplication;
  const menuService = { searchRecipes: jest.fn(async () => []) };

  beforeAll(async () => {
    app = await createControllerTestApp(MenuController, [{ provide: MenuService, useValue: menuService }]);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const noFilters = { taste: undefined, maxCalories: undefined, minProtein: undefined, difficulty: undefined };

  it('GET /menu/recipes passes undefined filters when they are omitted', async () => {
    await request(app.getHttpServer()).get('/menu/recipes?q=salad').expect(200);
    expect(menuService.searchRecipes).toHaveBeenCalledWith('salad', noFilters);
  });

  it('GET /menu/recipes passes provided filters as numbers', async () => {
    await request(app.getHttpServer())
      .get('/menu/recipes?q=salad&taste=SPICY,SOUR&maxCalories=450.5&minProtein=12.5&difficulty=3')
      .expect(200);
    expect(menuService.searchRecipes).toHaveBeenCalledWith('salad', {
      taste: ['SPICY', 'SOUR'],
      maxCalories: 450.5,
      minProtein: 12.5,
      difficulty: 3,
    });
  });

  // main.ts registers a global ValidationPipe with transform: true. It turns a
  // non-numeric query value into NaN before the route pipes run, and
  // DefaultValuePipe(undefined) maps NaN back to undefined, so the filter is skipped.
  it('GET /menu/recipes drops non-numeric filters instead of passing NaN', async () => {
    await request(app.getHttpServer())
      .get('/menu/recipes?q=salad&maxCalories=abc&minProtein=xyz&difficulty=hard')
      .expect(200);
    expect(menuService.searchRecipes).toHaveBeenCalledWith('salad', noFilters);
  });

  it('GET /menu/recipes rejects a fractional difficulty with 400', async () => {
    await request(app.getHttpServer()).get('/menu/recipes?q=salad&difficulty=2.5').expect(400);
    expect(menuService.searchRecipes).not.toHaveBeenCalled();
  });
});
