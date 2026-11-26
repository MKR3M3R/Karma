import test from 'node:test';
import assert from 'node:assert/strict';
import { fdcFood, offFood, searchExternalFoods } from '../food-search.js';

test('external nutrition results are normalized and incomplete labels are excluded', () => {
  assert.deepEqual(offFood({ code: '5901234123457', product_name: 'Feijão', brands: 'Marca', nutriments: { 'energy-kcal_100g': 132, proteins_100g: 8.9, carbohydrates_100g: 23.7, fat_100g: 0.5, fiber_100g: 8.7 } }), {
    id: 'off-5901234123457', src: 'external', source: 'Open Food Facts', name: 'Feijão', brand: 'Marca', barcode: '5901234123457', base: 'g', kcal: 132, p: 8.9, c: 23.7, f: 0.5, fiber: 8.7,
  });
  assert.equal(offFood({ code: '123', product_name: 'No nutrition', nutriments: {} }), null);
  assert.deepEqual(fdcFood({ fdcId: 4, description: 'Banana', foodNutrients: [
    { nutrientNumber: '1008', value: 89 }, { nutrientNumber: '1003', value: 1.1 }, { nutrientNumber: '1005', value: 22.8 }, { nutrientNumber: '1004', value: 0.3 },
  ] }), { id: 'usda-4', src: 'external', source: 'USDA FoodData Central', name: 'Banana', brand: '', base: 'g', kcal: 89, p: 1.1, c: 22.8, f: 0.3 });
});

test('search keeps USDA key server-side and still returns Open Food Facts when USDA fails', async () => {
  const calls = [];
  const result = await searchExternalFoods('banana', { usdaKey: 'private-key', fetchImpl: async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('nal.usda.gov')) return { ok: false, status: 403 };
    return { ok: true, json: async () => ({ products: [{ code: '123', product_name: 'Banana chips', nutriments: { 'energy-kcal_100g': 519, proteins_100g: 2.3, carbohydrates_100g: 58, fat_100g: 33 } }] }) };
  } });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.headers['User-Agent'].startsWith('Karma/'), true);
  assert.equal(calls[1].url.includes('api_key=private-key'), true);
  assert.equal(result.available.usda, true);
  assert.equal(result.partial, true);
  assert.deepEqual(result.foods.map(f => f.id), ['off-123']);
});

test('short food searches do not call either provider', async () => {
  const result = await searchExternalFoods('a', { fetchImpl: () => { throw new Error('should not fetch'); } });
  assert.deepEqual(result.foods, []);
});

test('a barcode query uses the Open Food Facts product endpoint', async () => {
  let requested = '';
  const result = await searchExternalFoods('5449000000996', { now: () => Date.now() + 20_000, fetchImpl: async url => {
    requested = String(url);
    return { ok: true, json: async () => ({ status: 1, product: { code: '5449000000996', product_name: 'Cola', nutriments: { 'energy-kcal_100g': 42, proteins_100g: 0, carbohydrates_100g: 10.6, fat_100g: 0 } } }) };
  } });
  assert.match(requested, /api\/v2\/product\/5449000000996\.json/);
  assert.equal(result.foods[0].barcode, '5449000000996');
  assert.equal(result.foods[0].name, 'Cola');
});

test('a cached Open Food Facts result does not hide a USDA result', async () => {
  const calls = [];
  const fetchImpl = async url => {
    calls.push(String(url));
    if (String(url).includes('api.nal.usda.gov/fdc')) return { ok: true, json: async () => ({ foods: [{ fdcId: 42, description: 'USDA lentils', foodNutrients: [
      { nutrientNumber: '1008', value: 116 }, { nutrientNumber: '1003', value: 9 },
      { nutrientNumber: '1005', value: 20 }, { nutrientNumber: '1004', value: 0.4 },
    ] }] }) };
    return { ok: true, json: async () => ({ products: [{ code: '12345678', product_name: 'OFF lentils', nutriments: {
      'energy-kcal_100g': 110, proteins_100g: 8, carbohydrates_100g: 18, fat_100g: 0.5,
    } }] }) };
  };
  const options = { usdaKey: 'server-secret', fetchImpl, now: () => 9_000_000_000_000 };
  await searchExternalFoods('lentils-cache-regression', options);
  calls.length = 0;
  const result = await searchExternalFoods('lentils-cache-regression', options);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /api\.nal\.usda\.gov\/fdc/);
  assert.deepEqual(result.foods.map(food => food.source).sort(), ['Open Food Facts', 'USDA FoodData Central']);
});
