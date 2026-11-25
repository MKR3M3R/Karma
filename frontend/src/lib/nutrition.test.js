import { describe, expect, it } from 'vitest'
import {
  readFood, foodProblem, foodsOf, withFood, foodById, searchFoods, itemFromFood, readItem, macrosOf, sumMacros,
  readMeal, mealsOf, withMeal, dayOf, waterOf, withWater, addWater, profileOf, dayProgress, nutritionDays, nutritionAverages,
  readPlan, plansOf, withPlan, planTotals, planToMeals, shoppingList, shoppingText, exportNutrition, nutritionCSV,
} from './nutrition.js'
import { REFERENCE_FOODS } from './nutrition-foods.js'

const rice = { name: 'Rice', base: 'g', kcal: 130, p: 2.7, c: 28, f: 0.3 }
const itemOf = (name, amt, per = { kcal: 100, p: 10, c: 10, f: 1 }) => ({ name, base: 'g', amt, per })

describe('reference foods', () => {
  it('are all consistent: macros fit in 100 g, ids unique, marked reference', () => {
    expect(new Set(REFERENCE_FOODS.map(f => f.id)).size).toBe(REFERENCE_FOODS.length)
    for (const f of REFERENCE_FOODS) {
      expect(f.src).toBe('reference')
      expect(f.p + f.c + f.f).toBeLessThanOrEqual(100.5)
      expect(readFood(f)).not.toBeNull()
    }
  })
})

describe('foods', () => {
  it('reads a valid food and refuses impossible ones', () => {
    expect(readFood(rice)).toEqual(rice)
    expect(readFood({ ...rice, name: '' })).toBeNull()
    expect(readFood({ ...rice, kcal: -1 })).toBeNull()
    expect(readFood({ ...rice, p: 60, c: 60 })).toBeNull()
    expect(readFood({ ...rice, kcal: 'abc' })).toBeNull()
    expect(foodProblem({ ...rice, p: 60, c: 60 })).toBe('too-much')
    expect(foodProblem({ ...rice, name: ' ' })).toBe('name')
    expect(foodProblem({ ...rice, f: '' })).toBe('numbers')
    expect(foodProblem(rice)).toBeNull()
  })
  it('stores yours stamped, marks them as yours, and removal is a stamped empty entry', () => {
    const m = withFood({}, 'a', rice, 5)
    expect(m.a._ts).toBe(5)
    expect(foodsOf({ nutritionFoods: m })[0]).toMatchObject({ id: 'a', src: 'user', name: 'Rice' })
    const gone = withFood(m, 'a', null, 9)
    expect(gone.a).toEqual({ _ts: 9 })
    expect(foodsOf({ nutritionFoods: gone })).toEqual([])
  })
  it('finds by id, yours or reference', () => {
    const S = { nutritionFoods: withFood({}, 'a', rice) }
    expect(foodById(S, 'a').name).toBe('Rice')
    expect(foodById(S, 'ref-egg').src).toBe('reference')
    expect(foodById(S, 'ref-nope')).toBeNull()
  })
  it('searches without caring for accents, in either language, yours first', () => {
    const S = { nutritionFoods: withFood({}, 'a', { ...rice, name: 'Arroz da casa' }) }
    const r = searchFoods(S, 'arroz', 'pt')
    expect(r[0].id).toBe('a')
    expect(r.some(f => f.id === 'ref-rice-white')).toBe(true)
    expect(searchFoods({}, 'feijao', 'pt').some(f => f.id === 'ref-black-beans')).toBe(true)
    expect(searchFoods({}, 'chicken', 'pt').some(f => f.id === 'ref-chicken-breast')).toBe(true)
    expect(searchFoods({}, 'zzzz')).toEqual([])
  })
})

describe('items and macros', () => {
  it('scales by amount and keeps its own copy of the figures', () => {
    const item = itemFromFood({ ...rice, id: 'a' }, 200)
    expect(item).toMatchObject({ name: 'Rice', amt: 200, foodId: 'a' })
    expect(macrosOf(item)).toEqual({ kcal: 260, p: 5.4, c: 56, f: 0.6 })
    expect(itemFromFood(rice, 0)).toBeNull()
    expect(itemFromFood(rice, 99999)).toBeNull()
    expect(itemFromFood(null, 10)).toBeNull()
  })
  it('reads items back and drops unusable ones', () => {
    expect(readItem(itemOf('x', 50))).toMatchObject({ name: 'x', amt: 50 })
    expect(readItem({ ...itemOf('x', 50), amt: 0 })).toBeNull()
    expect(readItem({ name: 'x', amt: 5 })).toBeNull()
  })
  it('sums, counting fibre only when something carries it', () => {
    const a = itemOf('a', 100, { kcal: 100, p: 10, c: 10, f: 1 })
    const b = itemOf('b', 50, { kcal: 200, p: 0, c: 20, f: 10, fiber: 4 })
    expect(sumMacros([a])).toEqual({ kcal: 100, p: 10, c: 10, f: 1 })
    expect(sumMacros([a, b])).toEqual({ kcal: 200, p: 10, c: 20, f: 6, fiber: 2 })
    expect(sumMacros([])).toEqual({ kcal: 0, p: 0, c: 0, f: 0 })
  })
})

describe('meals and days', () => {
  const S = { nutritionMeals: {} }
  S.nutritionMeals = withMeal(S.nutritionMeals, 'm1', { d: '2026-11-20', slot: 'lunch', items: [itemOf('a', 100)] }, 1)
  S.nutritionMeals = withMeal(S.nutritionMeals, 'm2', { d: '2026-11-20', slot: 'breakfast', items: [itemOf('b', 200)] }, 2)
  S.nutritionMeals = withMeal(S.nutritionMeals, 'm3', { d: '2026-11-21', slot: 'dinner', items: [itemOf('c', 100)] }, 3)
  it('refuses a meal with no items or a bad date', () => {
    expect(readMeal({ d: '2026-11-20', slot: 'lunch', items: [] })).toBeNull()
    expect(readMeal({ d: 'x', items: [itemOf('a', 1)] })).toBeNull()
    expect(readMeal({ d: '2026-11-20', slot: 'weird', items: [itemOf('a', 1)] }).slot).toBe('snack')
  })
  it('lists newest day first, breakfast before lunch', () => {
    expect(mealsOf(S).map(m => m.id)).toEqual(['m3', 'm2', 'm1'])
  })
  it('totals a day from what was logged only', () => {
    const d = dayOf(S, '2026-11-20')
    expect(d.totals.kcal).toBe(300)
    expect(d.logged).toBe(true)
    expect(dayOf(S, '2026-01-01')).toMatchObject({ logged: false, totals: { kcal: 0 }, water: 0 })
  })
  it('removing a meal leaves a stamped empty entry', () => {
    const m = withMeal(S.nutritionMeals, 'm1', null, 10)
    expect(m.m1).toEqual({ _ts: 10 })
    expect(mealsOf({ nutritionMeals: m }).some(x => x.id === 'm1')).toBe(false)
  })
})

describe('water', () => {
  it('adds, subtracts and never goes below zero or past the cap', () => {
    let m = addWater({}, '2026-11-20', 250, 1)
    m = addWater(m, '2026-11-20', 250, 2)
    expect(waterOf({ nutritionWater: m }, '2026-11-20')).toBe(500)
    m = addWater(m, '2026-11-20', -1000, 3)
    expect(waterOf({ nutritionWater: m }, '2026-11-20')).toBe(0)
    expect(m['2026-11-20']).toEqual({ _ts: 3 })
    expect(waterOf({ nutritionWater: withWater({}, '2026-11-20', 99999) }, '2026-11-20')).toBe(10000)
    expect(withWater({}, 'bad', 100)).toEqual({})
  })
})

describe('profile and progress', () => {
  it('has no defaults: an empty profile is empty', () => {
    expect(profileOf({})).toEqual({})
    expect(profileOf({ nutritionProfile: { goal: 'x', kcal: -5, diet: ['nope'] } })).toEqual({})
  })
  it('reads what was set', () => {
    expect(profileOf({ nutritionProfile: { goal: 'maintain', kcal: 2000, p: 120, water: 2500, diet: ['vegan', 'vegan'], avoid: [' peanuts '] } }))
      .toEqual({ goal: 'maintain', kcal: 2000, p: 120, water: 2500, diet: ['vegan'], avoid: ['peanuts'] })
  })
  it('shows a number beside a target, and null where none was set', () => {
    const S = { nutritionProfile: { kcal: 400 }, nutritionMeals: withMeal({}, 'm', { d: '2026-11-20', slot: 'lunch', items: [itemOf('a', 100)] }) }
    const p = dayProgress(S, '2026-11-20')
    expect(p.kcal).toEqual({ value: 100, target: 400, pct: 25 })
    expect(p.p).toEqual({ value: 10, target: null, pct: null })
  })
})

describe('history', () => {
  const S = { nutritionMeals: {}, nutritionWater: {} }
  S.nutritionMeals = withMeal(S.nutritionMeals, 'a', { d: '2026-11-20', slot: 'lunch', items: [itemOf('a', 100)] })
  S.nutritionMeals = withMeal(S.nutritionMeals, 'b', { d: '2026-11-22', slot: 'lunch', items: [itemOf('a', 300)] })
  S.nutritionWater = withWater(S.nutritionWater, '2026-11-21', 1000)
  it('lists days with anything logged, oldest first', () => {
    expect(nutritionDays(S, '2026-11-01', '2026-11-30').map(x => x.d)).toEqual(['2026-11-20', '2026-11-21', '2026-11-22'])
  })
  it('averages over days with food, not over empty ones', () => {
    expect(nutritionAverages(S, '2026-11-01', '2026-11-30')).toMatchObject({ days: 2, kcal: 200, water: 1000 })
    expect(nutritionAverages(S, '2026-01-01', '2026-01-31')).toBeNull()
  })
})

describe('plans and shopping', () => {
  const plan = { name: 'Week A', meals: [
    { slot: 'breakfast', items: [itemOf('Oats', 50), itemOf('Milk', 200)] },
    { slot: 'lunch', items: [itemOf('Oats', 25)] },
  ] }
  it('needs a name and a meal', () => {
    expect(readPlan({ name: '', meals: plan.meals })).toBeNull()
    expect(readPlan({ name: 'x', meals: [] })).toBeNull()
    expect(readPlan({ name: 'x', meals: [{ slot: 'lunch', items: [] }] })).toBeNull()
  })
  it('stores, totals and turns into diary meals', () => {
    const S = { nutritionPlans: withPlan({}, 'p', plan, 1) }
    const p = plansOf(S)[0]
    expect(p.name).toBe('Week A')
    expect(planTotals(p).kcal).toBe(275)
    const meals = planToMeals(p, '2026-12-01')
    expect(meals).toHaveLength(2)
    expect(meals[0]).toMatchObject({ d: '2026-12-01', slot: 'breakfast' })
    meals[0].items[0].amt = 999
    expect(plansOf(S)[0].meals[0].items[0].amt).toBe(50)
  })
  it('adds the same food up across meals and days', () => {
    const list = shoppingList([plan], 7)
    expect(list).toEqual([
      { key: 'n:milk|g', name: 'Milk', base: 'g', amt: 1400 },
      { key: 'n:oats|g', name: 'Oats', base: 'g', amt: 525 },
    ])
    expect(shoppingText(list)).toBe('- Milk: 1.4 kg\n- Oats: 525 g')
    expect(shoppingList([plan], 0)[1].amt).toBe(75)
  })
})

describe('export', () => {
  const S = {
    nutritionFoods: withFood({}, 'a', rice, 4),
    nutritionMeals: withMeal({}, 'm', { d: '2026-11-20', slot: 'lunch', items: [itemFromFood(rice, 100)] }, 5),
    nutritionWater: withWater({}, '2026-11-20', 500, 6),
    nutritionProfile: { kcal: 2000 },
  }
  it('is one document with no stamps and nothing else of the profile', () => {
    const x = exportNutrition(S)
    expect(x.karma_nutrition).toBe(1)
    expect(x.foods[0]).toEqual({ id: 'a', ...rice })
    expect(JSON.stringify(x)).not.toContain('_ts')
    expect(x.water).toEqual([{ d: '2026-11-20', ml: 500 }])
    expect(x.profile).toEqual({ kcal: 2000 })
  })
  it('writes the diary as CSV and quotes what needs it', () => {
    const csv = nutritionCSV({ nutritionMeals: withMeal({}, 'm', { d: '2026-11-20', slot: 'lunch', items: [itemOf('Rice, "white"', 100)] }) })
    expect(csv.split('\n')[0]).toBe('date,meal,food,amount,unit,kcal,protein_g,carbs_g,fat_g')
    expect(csv.split('\n')[1]).toBe('2026-11-20,lunch,"Rice, ""white""",100,g,100,10,10,1')
  })
})
