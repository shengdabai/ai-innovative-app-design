import { NutritionUtil } from './nutrition.util';

describe('NutritionUtil.assessNutritionBalance', () => {
  const targets = { protein: 100, carbs: 200, fat: 60 };

  it('reports every macro as a strength when all are within range', () => {
    const result = NutritionUtil.assessNutritionBalance(
      { protein: 100, carbs: 200, fat: 60 },
      targets,
    );
    expect(result.score).toBe(100);
    expect(result.suggestions).toEqual([]);
    expect(result.strengths).toHaveLength(3);
  });

  it('splits macros into suggestions and strengths', () => {
    // protein low (-15), carbs in range, fat high (-15)
    const result = NutritionUtil.assessNutritionBalance(
      { protein: 50, carbs: 200, fat: 90 },
      targets,
    );
    expect(result.score).toBe(70);
    expect(result.suggestions).toHaveLength(2);
    expect(result.strengths).toEqual(['碳水化合物摄入适中']);
  });

  it('returns no strengths when every macro is out of range', () => {
    const result = NutritionUtil.assessNutritionBalance(
      { protein: 10, carbs: 10, fat: 10 },
      targets,
    );
    expect(result.strengths).toEqual([]);
    expect(result.suggestions).toHaveLength(3);
    expect(result.score).toBe(65);
  });
});
