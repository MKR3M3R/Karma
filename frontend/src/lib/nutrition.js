// Nutrition: your own foods, a diary of meals, water, plans and the shopping list they imply.
// Karma's own module, not a link to another app. It is a log and a calculator, not professional
// advice: nothing here tells anyone what to eat or scolds them for what they did.
//
// Stored like the mobility data: one stamped entry per record, so two devices that each added a
// meal keep both, an edit keeps its later version, and a removal is a stamped empty entry
// (lib/sync-merge.js STAMPED_MAPS, mirrored in api/sync-stamps.js). Tokens never reach these keys
// (api/tokens.js offers no nutrition category), the same as the photos.
//
//   S.nutritionFoods = { '<id>': { name, brand?, base, kcal, p, c, f, fiber?, _ts }, … }   yours, per 100 g or 100 ml
//   S.nutritionMeals = { '<id>': { d, slot, items: [Item], note?, _ts }, … }
//   S.nutritionWater = { '<YYYY-MM-DD>': { ml, _ts }, … }
//   S.nutritionPlans = { '<id>': { name, meals: [{ slot, items: [Item] }], note?, _ts }, … }
//   S.nutritionProfile = { goal?, kcal?, p?, c?, f?, water?, diet?, avoid? }   plain setting, all optional
//
//   Item = { name, base: 'g'|'ml', amt, per: { kcal, p, c, f, fiber? }, foodId? }
//   An item carries a copy of the food's figures, so editing or deleting a food never rewrites
//   what you ate. Nothing is a default: no targets, no goal, until the person sets them.
import { REFERENCE_FOODS, referenceFood, foodName } from './nutrition-foods.js'

export const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack']
export const BASES = ['g', 'ml']
export const GOALS = ['maintain', 'lose', 'gain']
export const DIETS = ['vegetarian', 'vegan', 'gluten-free', 'lactose-free']
export const MAX_NAME = 80
export const MAX_NOTE = 500
export const MAX_ITEMS = 40
export const MAX_AMT = 5000
export const MAX_WATER_ML = 10000
export const MAX_MEALS_PLAN = 8

const isMap = v => !!v && typeof v === 'object' && !Array.isArray(v)
const ISO = /^\d{4}-\d{2}-\d{2}$/
const text = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max) : '')
const num = (v, max, dp = 1) => {
  const n = Number(v)
  if (v === '' || v == null || !Number.isFinite(n) || n < 0 || n > max) return null
  const k = 10 ** dp
  return Math.round(n * k) / k
}
const r1 = n => Math.round(n * 10) / 10

/* ------------------------------------------------------------- foods ---- */

/** The figures of one food read back (per 100 g or ml): { name, brand?, base, kcal, p, c, f, fiber? } or null. */
export function readFood(raw) {
  if (!isMap(raw)) return null
  const name = text(raw.name, MAX_NAME)
  const kcal = num(raw.kcal, 1000, 0), p = num(raw.p, 100), c = num(raw.c, 100), f = num(raw.f, 100)
  if (!name || kcal == null || p == null || c == null || f == null) return null
  if (p + c + f > 100.5) return null   // more than 100 g of macros in 100 g of food
  const out = { name, base: BASES.includes(raw.base) ? raw.base : 'g', kcal, p, c, f }
  const fiber = num(raw.fiber, 100)
  if (fiber != null && fiber <= c + 0.5) out.fiber = fiber
  const brand = text(raw.brand, 60)
  if (brand) out.brand = brand
  return out
}

/** Why a food's figures were refused, as a code the screen words: 'name', 'numbers' or 'too-much'; null when fine. */
export function foodProblem(raw) {
  if (!isMap(raw) || !text(raw.name, MAX_NAME)) return 'name'
  const ok = [num(raw.kcal, 1000, 0), num(raw.p, 100), num(raw.c, 100), num(raw.f, 100)]
  if (ok.some(v => v == null)) return 'numbers'
  return ok[1] + ok[2] + ok[3] > 100.5 ? 'too-much' : null
}

/** Your own foods, by name, as { id, src: 'user', ... }. */
export function foodsOf(S) {
  const map = isMap(S?.nutritionFoods) ? S.nutritionFoods : {}
  const out = []
  for (const [id, e] of Object.entries(map)) {
    const food = readFood(e)
    if (food) out.push({ id, src: 'user', ...food, _ts: Number(e._ts) || 0 })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

/** The map with food `id` set (or cleared with null), stamped `now`. */
export function withFood(map, id, food, now = Date.now()) {
  const clean = food ? readFood(food) : null
  return { ...(isMap(map) ? map : {}), [id]: clean ? { ...clean, _ts: now } : { _ts: now } }
}

/** A food by id: yours, or a reference one (`ref-…`). */
export function foodById(S, id) {
  if (typeof id === 'string' && id.startsWith('ref-')) return referenceFood(id) || null
  return foodsOf(S).find(f => f.id === id) || null
}

const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Foods matching `q` (accents and case ignored) in the name or brand, yours first. Empty `q` lists yours then the reference. */
export function searchFoods(S, q, lang = 'en') {
  const needle = fold(q).trim()
  const hit = f => !needle || fold(foodName(f, lang)).includes(needle) || fold(f.brand).includes(needle)
  const mine = foodsOf(S).filter(hit)
  const ref = REFERENCE_FOODS.filter(f => hit(f) || (needle && fold(f.names.en).includes(needle)))
  return [...mine, ...ref]
}

/* ------------------------------------------------------------- items ---- */

const perOf = f => {
  const per = { kcal: f.kcal, p: f.p, c: f.c, f: f.f }
  if (f.fiber != null) per.fiber = f.fiber
  return per
}

/** An item from a food and an amount in its base unit (g or ml), or null for an unusable amount. */
export function itemFromFood(food, amt, lang = 'en') {
  const a = num(amt, MAX_AMT)
  if (!food || !a || a <= 0) return null
  return { name: foodName(food, lang), base: food.base, amt: a, per: perOf(food), ...(food.id ? { foodId: food.id } : {}) }
}

/** One item read back, or null. */
export function readItem(raw) {
  if (!isMap(raw)) return null
  const name = text(raw.name, MAX_NAME)
  const amt = num(raw.amt, MAX_AMT)
  const per = isMap(raw.per) ? raw.per : null
  const kcal = per && num(per.kcal, 1000, 0), p = per && num(per.p, 100), c = per && num(per.c, 100), f = per && num(per.f, 100)
  if (!name || !amt || amt <= 0 || kcal == null || p == null || c == null || f == null) return null
  const out = { name, base: BASES.includes(raw.base) ? raw.base : 'g', amt, per: { kcal, p, c, f } }
  const fiber = per && num(per.fiber, 100)
  if (fiber != null) out.per.fiber = fiber
  if (typeof raw.foodId === 'string' && raw.foodId.length <= 60) out.foodId = raw.foodId
  return out
}

/** What one item adds up to: { kcal, p, c, f, fiber? } for its amount (kcal whole, grams to a tenth). */
export function macrosOf(item) {
  const k = item.amt / 100
  const out = { kcal: Math.round(item.per.kcal * k), p: r1(item.per.p * k), c: r1(item.per.c * k), f: r1(item.per.f * k) }
  if (item.per.fiber != null) out.fiber = r1(item.per.fiber * k)
  return out
}

/** The sum of several items' macros; fibre only counts what carries it. */
export function sumMacros(items) {
  const t = { kcal: 0, p: 0, c: 0, f: 0 }
  let fiber = null
  for (const i of items) {
    const m = macrosOf(i)
    t.kcal += m.kcal; t.p += m.p; t.c += m.c; t.f += m.f
    if (m.fiber != null) fiber = (fiber || 0) + m.fiber
  }
  const out = { kcal: Math.round(t.kcal), p: r1(t.p), c: r1(t.c), f: r1(t.f) }
  if (fiber != null) out.fiber = r1(fiber)
  return out
}

/* ------------------------------------------------------------- meals ---- */

/** One stored meal read back: { d, slot, items, note? } or null (a meal needs a date and at least one item). */
export function readMeal(entry) {
  if (!isMap(entry) || !ISO.test(String(entry.d || ''))) return null
  const items = (Array.isArray(entry.items) ? entry.items : []).slice(0, MAX_ITEMS).map(readItem).filter(Boolean)
  if (!items.length) return null
  const out = { d: entry.d, slot: SLOTS.includes(entry.slot) ? entry.slot : 'snack', items }
  const note = text(entry.note, MAX_NOTE)
  if (note) out.note = note
  return out
}

/** Every meal, newest day first and in the day's order of slots, as { id, ...meal }. */
export function mealsOf(S) {
  const map = isMap(S?.nutritionMeals) ? S.nutritionMeals : {}
  const out = []
  for (const [id, e] of Object.entries(map)) {
    const m = readMeal(e)
    if (m) out.push({ id, ...m, _ts: Number(e._ts) || 0 })
  }
  return out.sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot) || a._ts - b._ts))
}

/** The map with meal `id` set (or cleared with null), stamped `now`. */
export function withMeal(map, id, meal, now = Date.now()) {
  const clean = meal ? readMeal(meal) : null
  return { ...(isMap(map) ? map : {}), [id]: clean ? { ...clean, _ts: now } : { _ts: now } }
}

/** One day: its meals by slot and the totals, counted only from what was logged. */
export function dayOf(S, d) {
  const meals = mealsOf(S).filter(m => m.d === d)
  const items = meals.flatMap(m => m.items)
  return { d, meals, totals: sumMacros(items), logged: items.length > 0, water: waterOf(S, d) }
}

/* ------------------------------------------------------------- water ---- */

/** Millilitres logged for day `d` (0 when none). */
export function waterOf(S, d) {
  const e = isMap(S?.nutritionWater) ? S.nutritionWater[d] : null
  const ml = isMap(e) ? Math.round(Number(e.ml)) : 0
  return Number.isFinite(ml) && ml > 0 ? Math.min(ml, MAX_WATER_ML) : 0
}

/** The map with day `d`'s water set to `ml` (0 or less clears it), stamped `now`. */
export function withWater(map, d, ml, now = Date.now()) {
  const v = Math.round(Number(ml))
  const base = isMap(map) ? map : {}
  if (!ISO.test(String(d))) return base
  return { ...base, [d]: Number.isFinite(v) && v > 0 ? { ml: Math.min(v, MAX_WATER_ML), _ts: now } : { _ts: now } }
}

/** The map with `delta` ml added to day `d` (negative takes away, never below 0). */
export const addWater = (map, d, delta, now = Date.now()) => withWater(map, d, (isMap(map) && waterOf({ nutritionWater: map }, d)) + delta, now)

/* ----------------------------------------------------------- profile ---- */

/** The optional profile read back; every field may be absent and nothing is defaulted. */
export function profileOf(S) {
  const raw = isMap(S?.nutritionProfile) ? S.nutritionProfile : {}
  const out = {}
  if (GOALS.includes(raw.goal)) out.goal = raw.goal
  for (const [k, max, dp] of [['kcal', 10000, 0], ['p', 1000, 0], ['c', 2000, 0], ['f', 1000, 0], ['water', MAX_WATER_ML, 0]]) {
    const v = num(raw[k], max, dp)
    if (v) out[k] = v
  }
  const diet = (Array.isArray(raw.diet) ? raw.diet : []).filter(x => DIETS.includes(x))
  if (diet.length) out.diet = [...new Set(diet)]
  const avoid = (Array.isArray(raw.avoid) ? raw.avoid : []).map(x => text(x, 40)).filter(Boolean).slice(0, 20)
  if (avoid.length) out.avoid = avoid
  return out
}

/** A day's numbers beside the targets the person set. `target` is null where none was set; `pct` is only a number to show, never a verdict. */
export function dayProgress(S, d) {
  const day = dayOf(S, d), prof = profileOf(S)
  const row = (value, target) => ({ value, target: target || null, pct: target ? Math.round((value / target) * 100) : null })
  return {
    kcal: row(day.totals.kcal, prof.kcal), p: row(day.totals.p, prof.p), c: row(day.totals.c, prof.c), f: row(day.totals.f, prof.f),
    water: row(day.water, prof.water), logged: day.logged,
  }
}

/* ----------------------------------------------------------- history ---- */

/** Days in [from, to] with something logged, oldest first: [{ d, kcal, p, c, f, water }]. */
export function nutritionDays(S, from, to) {
  const days = new Map()
  for (const m of mealsOf(S)) {
    if (m.d < from || m.d > to) continue
    days.set(m.d, [...(days.get(m.d) || []), ...m.items])
  }
  const water = isMap(S?.nutritionWater) ? Object.keys(S.nutritionWater).filter(d => d >= from && d <= to && waterOf(S, d) > 0) : []
  for (const d of water) if (!days.has(d)) days.set(d, [])
  return [...days.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([d, items]) => ({ d, ...sumMacros(items), water: waterOf(S, d), meals: items.length > 0 }))
}

/** Averages over the days that have food logged (an empty day is not a zero): { days, kcal, p, c, f, water } or null with no such day. */
export function nutritionAverages(S, from, to) {
  const list = nutritionDays(S, from, to).filter(x => x.meals)
  if (!list.length) return null
  const avg = k => Math.round(list.reduce((n, x) => n + x[k], 0) / list.length)
  const wet = nutritionDays(S, from, to).filter(x => x.water > 0)
  return { days: list.length, kcal: avg('kcal'), p: avg('p'), c: avg('c'), f: avg('f'), water: wet.length ? Math.round(wet.reduce((n, x) => n + x.water, 0) / wet.length) : 0 }
}

/* ------------------------------------------------------------- plans ---- */

/** One stored plan read back: { name, meals: [{ slot, items }], note? } or null. */
export function readPlan(entry) {
  if (!isMap(entry)) return null
  const name = text(entry.name, MAX_NAME)
  const meals = (Array.isArray(entry.meals) ? entry.meals : []).slice(0, MAX_MEALS_PLAN).map(m => {
    const items = (Array.isArray(m?.items) ? m.items : []).slice(0, MAX_ITEMS).map(readItem).filter(Boolean)
    return items.length ? { slot: SLOTS.includes(m.slot) ? m.slot : 'snack', items } : null
  }).filter(Boolean)
  if (!name || !meals.length) return null
  const out = { name, meals }
  const note = text(entry.note, MAX_NOTE)
  if (note) out.note = note
  return out
}

/** Every plan, by name, as { id, ...plan }. */
export function plansOf(S) {
  const map = isMap(S?.nutritionPlans) ? S.nutritionPlans : {}
  const out = []
  for (const [id, e] of Object.entries(map)) {
    const p = readPlan(e)
    if (p) out.push({ id, ...p, _ts: Number(e._ts) || 0 })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

/** The map with plan `id` set (or cleared with null), stamped `now`. */
export function withPlan(map, id, plan, now = Date.now()) {
  const clean = plan ? readPlan(plan) : null
  return { ...(isMap(map) ? map : {}), [id]: clean ? { ...clean, _ts: now } : { _ts: now } }
}

/** What one day of the plan adds up to. */
export const planTotals = plan => sumMacros(plan.meals.flatMap(m => m.items))

/** The plan's meals as diary meals for day `d` (not saved: the caller gives each an id and stores it). */
export const planToMeals = (plan, d) => plan.meals.map(m => ({ d, slot: m.slot, items: m.items.map(i => ({ ...i, per: { ...i.per } })) }))

/* ---------------------------------------------------------- shopping ---- */

/** What to buy for `days` days of these plans: one line per food with its amounts added up, by name. */
export function shoppingList(plans, days = 1) {
  const n = Math.max(1, Math.min(31, Math.round(Number(days)) || 1))
  const lines = new Map()
  for (const plan of plans) for (const m of plan.meals) for (const i of m.items) {
    const key = (i.foodId || 'n:' + fold(i.name)) + '|' + i.base
    const cur = lines.get(key) || { key, name: i.name, base: i.base, amt: 0 }
    cur.amt += i.amt * n
    lines.set(key, cur)
  }
  return [...lines.values()].map(l => ({ ...l, amt: Math.round(l.amt) })).sort((a, b) => a.name.localeCompare(b.name))
}

/** The shopping list as plain text, one "- name: amount" line each, to copy or share. */
export const shoppingText = list => list.map(l => `- ${l.name}: ${l.amt >= 1000 ? r1(l.amt / 1000) + (l.base === 'g' ? ' kg' : ' l') : l.amt + ' ' + l.base}`).join('\n')

/* ------------------------------------------------------------ export ---- */

export const NUTRITION_FILE = 'karma_nutrition'

/** Everything nutrition as one document: your foods, meals, water, plans and profile (nothing else of the profile's data). */
export function exportNutrition(S) {
  const strip = ({ _ts, ...rest }) => rest
  return {
    [NUTRITION_FILE]: 1,
    profile: profileOf(S),
    foods: foodsOf(S).map(({ src, ...f }) => strip(f)),
    meals: mealsOf(S).map(strip),
    water: Object.keys(isMap(S?.nutritionWater) ? S.nutritionWater : {}).filter(d => waterOf(S, d) > 0).sort().map(d => ({ d, ml: waterOf(S, d) })),
    plans: plansOf(S).map(strip),
  }
}

const csvCell = v => {
  const s = String(v ?? '')
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

/** The diary as CSV, one row per item: date, meal, food, amount, unit, kcal, protein, carbs, fat. */
export function nutritionCSV(S) {
  const rows = [['date', 'meal', 'food', 'amount', 'unit', 'kcal', 'protein_g', 'carbs_g', 'fat_g']]
  for (const m of mealsOf(S).slice().reverse()) for (const i of m.items) {
    const x = macrosOf(i)
    rows.push([m.d, m.slot, i.name, i.amt, i.base, x.kcal, x.p, x.c, x.f])
  }
  return rows.map(r => r.map(csvCell).join(',')).join('\n') + '\n'
}

/* ------------------------------------------------------------- misc ---- */

/** Whether a food's name or brand contains one of the profile's "avoid" words (accents and case ignored). */
export function avoidHit(profile, food, lang = 'en') {
  const words = (profile?.avoid || []).map(fold).filter(Boolean)
  if (!words.length) return false
  const hay = fold(foodName(food, lang)) + ' ' + fold(food.names?.en) + ' ' + fold(food.names?.pt) + ' ' + fold(food.brand)
  return words.some(w => hay.includes(w))
}

/** What clearing all nutrition data sets: every record becomes a stamped empty entry (so it stays deleted on other devices), the profile empties. */
export function clearedNutrition(S, now = Date.now()) {
  const wipe = map => Object.fromEntries(Object.keys(isMap(map) ? map : {}).map(k => [k, { _ts: now }]))
  return {
    nutritionFoods: wipe(S?.nutritionFoods), nutritionMeals: wipe(S?.nutritionMeals),
    nutritionWater: wipe(S?.nutritionWater), nutritionPlans: wipe(S?.nutritionPlans), nutritionProfile: {},
  }
}
