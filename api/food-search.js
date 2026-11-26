const USDA = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const OFF = 'https://world.openfoodfacts.org/cgi/search.pl';
const OFF_PRODUCT = 'https://world.openfoodfacts.org/api/v2/product/';
const MAX_RESULTS = 12;
const OFF_MIN_INTERVAL_MS = 7000;
const offCache = new Map();
let offNextAt = 0;

const finite = value => Number.isFinite(Number(value)) ? Number(value) : null;
function fdcFood(food) {
  const nutrients = Array.isArray(food?.foodNutrients) ? food.foodNutrients : [];
  const find = (number, name) => finite(nutrients.find(n => String(n.nutrientNumber) === number || n.nutrientName?.toLowerCase() === name)?.value);
  const kcal = find('1008', 'energy');
  const p = find('1003', 'protein');
  const c = find('1005', 'carbohydrate, by difference');
  const f = find('1004', 'total lipid (fat)');
  if (!food.fdcId || !food.description || kcal == null || p == null || c == null || f == null) return null;
  return { id: `usda-${food.fdcId}`, src: 'external', source: 'USDA FoodData Central', name: String(food.description).slice(0, 120), brand: String(food.brandOwner || food.brandName || '').slice(0, 80), base: 'g', kcal: Math.round(kcal), p, c, f, ...(find('1079', 'fiber, total dietary') != null ? { fiber: find('1079', 'fiber, total dietary') } : {}) };
}
function offFood(product) {
  const n = product?.nutriments || {};
  const kcal = finite(n['energy-kcal_100g'] ?? (finite(n['energy_100g']) == null ? null : Number(n['energy_100g']) / 4.184));
  const p = finite(n.proteins_100g), c = finite(n.carbohydrates_100g), f = finite(n.fat_100g);
  const name = String(product?.product_name || product?.product_name_en || '').trim();
  if (!product?.code || !name || kcal == null || p == null || c == null || f == null) return null;
  const code = String(product.code);
  return { id: `off-${code.slice(0, 32)}`, src: 'external', source: 'Open Food Facts', name: name.slice(0, 120), brand: String(product.brands || '').slice(0, 80), ...(/^\d{8,14}$/.test(code) ? { barcode: code } : {}), base: 'g', kcal: Math.round(kcal), p, c, f, ...(finite(n.fiber_100g) != null ? { fiber: finite(n.fiber_100g) } : {}) };
}

/** Search public food sources. The USDA key is only ever sent server-to-server. */
export async function searchExternalFoods(query, { usdaKey = '', fetchImpl = globalThis.fetch, timeoutMs = 5000, now = Date.now } = {}) {
  const q = String(query || '').trim().slice(0, 80);
  if (q.length < 2) return { foods: [], available: { usda: !!usdaKey, openFoodFacts: true } };
  const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(timeoutMs) : undefined;
  const isBarcode = /^\d{8,14}$/.test(q);
  const offUrl = isBarcode
    ? new URL(`${OFF_PRODUCT}${q}.json?fields=code,product_name,product_name_en,brands,nutriments`)
    : new URL(OFF);
  if (!isBarcode) offUrl.search = new URLSearchParams({ search_terms: q, search_simple: '1', action: 'process', json: '1', page_size: String(MAX_RESULTS), fields: 'code,product_name,product_name_en,brands,nutriments' });
  const cacheKey = q.toLocaleLowerCase();
  const cached = offCache.get(cacheKey);
  const hit = cached && now() - cached.at < 10 * 60_000 ? cached.foods : null;
  if (cached && !hit) offCache.delete(cacheKey);
  const useOff = hit !== null || now() >= offNextAt;
  if (useOff && !hit) offNextAt = now() + OFF_MIN_INTERVAL_MS;
  const requests = [];
  if (useOff && !hit) requests.push(['off', fetchImpl(offUrl, { headers: { Accept: 'application/json', 'User-Agent': 'Karma/1.0 (food search; https://github.com/MKR3M3R/Karma)' }, signal })]);
  if (usdaKey) requests.push(['usda', fetchImpl(`${USDA}?api_key=${encodeURIComponent(usdaKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ query: q, pageSize: MAX_RESULTS, dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'] }), signal })]);
  const settled = await Promise.allSettled(requests.map(async ([provider, request]) => {
    const r = await request;
    if (!r.ok) throw new Error(`${provider} ${r.status}`);
    return r.json();
  }));
  const results = Object.fromEntries(requests.map(([provider], index) => [provider, settled[index]]));
  const foods = hit ? [...hit] : [];
  let offFailed = false;
  if (!hit && useOff && results.off?.status === 'fulfilled') {
    const products = isBarcode
      ? (results.off.value.status === 1 && results.off.value.product ? [results.off.value.product] : [])
      : (Array.isArray(results.off.value.products) ? results.off.value.products : []);
    const found = products.map(offFood).filter(Boolean);
    if (offCache.size >= 100) offCache.delete(offCache.keys().next().value);
    offCache.set(cacheKey, { at: now(), foods: found });
    foods.push(...found);
  } else if (!hit && useOff) offFailed = results.off?.status !== 'fulfilled';
  const usdaResult = results.usda;
  if (usdaResult?.status === 'fulfilled') foods.push(...(Array.isArray(usdaResult.value.foods) ? usdaResult.value.foods.map(fdcFood).filter(Boolean) : []));
  const skippedByRateLimit = !useOff;
  return { foods: foods.slice(0, MAX_RESULTS * 2), available: { usda: !!usdaKey, openFoodFacts: !skippedByRateLimit && !offFailed }, partial: offFailed || skippedByRateLimit || usdaResult?.status === 'rejected' };
}

export { fdcFood, offFood };
