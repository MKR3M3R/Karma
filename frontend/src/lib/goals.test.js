import { describe, expect, it } from 'vitest'
import { readGoal, goalsOf, withGoal, goalProgress, countIn, rangeFrom, rangeSummary, RANGES } from './goals.js'
import { withMeal } from './nutrition.js'
import { withMobilitySession } from './mobility.js'

const TODAY = '2026-11-26'   // a Thursday; the week (Monday start) began 2026-11-23
const base = { unit: 'kg', weekStart: 1, workouts: [], bodyweight: [] }
const meal = d => ({ d, slot: 'lunch', items: [{ name: 'x', base: 'g', amt: 100, per: { kcal: 100, p: 1, c: 1, f: 1 } }] })
const sess = d => ({ d, min: 5, items: [{ id: 'mob-cat-cow', done: true }] })

describe('goal records', () => {
  it('reads valid goals and refuses impossible ones', () => {
    expect(readGoal({ type: 'workouts', target: 3, from: TODAY })).toEqual({ type: 'workouts', target: 3, from: TODAY })
    expect(readGoal({ type: 'workouts', target: 8, from: TODAY })).toBeNull()
    expect(readGoal({ type: 'workouts', target: 0, from: TODAY })).toBeNull()
    expect(readGoal({ type: 'nope', target: 3, from: TODAY })).toBeNull()
    expect(readGoal({ type: 'workouts', target: 3, from: 'x' })).toBeNull()
    expect(readGoal({ type: 'lift', target: 100, from: TODAY })).toBeNull()
    expect(readGoal({ type: 'lift', target: 100, exId: 'squat', unit: 'kg', from: TODAY, note: ' hi ' })).toMatchObject({ target: 100, exId: 'squat', note: 'hi' })
  })
  it('stores stamped, lists oldest first, removal is a stamped empty entry', () => {
    let m = withGoal({}, 'b', { type: 'meals', target: 5, from: '2026-11-10' }, 1)
    m = withGoal(m, 'a', { type: 'workouts', target: 3, from: '2026-11-01' }, 2)
    expect(goalsOf({ goals: m }).map(g => g.id)).toEqual(['a', 'b'])
    m = withGoal(m, 'a', null, 9)
    expect(m.a).toEqual({ _ts: 9 })
    expect(goalsOf({ goals: m }).map(g => g.id)).toEqual(['b'])
  })
})

describe('weekly goals', () => {
  const S = { ...base, workouts: [{ d: '2026-11-23' }, { d: '2026-11-25' }, { d: '2026-11-16' }, { d: '2026-11-17' }, { d: '2026-11-18' }] }
  it('counts the current week and marks which of the last 8 weeks reached', () => {
    const p = goalProgress(S, { type: 'workouts', target: 3, from: '2026-10-01' }, TODAY)
    expect(p.kind).toBe('week')
    expect(p.done).toBe(2)
    expect(p.pct).toBe(67)
    expect(p.reached).toBe(false)
    expect(p.weeks).toHaveLength(8)
    expect(p.weeks.at(-1)).toMatchObject({ from: '2026-11-23', count: 2, hit: false })
    expect(p.weeks.at(-2)).toMatchObject({ from: '2026-11-16', count: 3, hit: true })
  })
  it('respects a Sunday week start', () => {
    const p = goalProgress({ ...S, weekStart: 0 }, { type: 'workouts', target: 1, from: '2026-10-01' }, TODAY)
    expect(p.weeks.at(-1).from).toBe('2026-11-22')
  })
  it('counts mobility and meals as days, not sessions or entries', () => {
    let m = withMobilitySession({}, 'a', sess('2026-11-24'))
    m = withMobilitySession(m, 'b', sess('2026-11-24'))
    let f = withMeal({}, 'a', meal('2026-11-24'))
    f = withMeal(f, 'b', meal('2026-11-24'))
    f = withMeal(f, 'c', meal('2026-11-25'))
    const S2 = { ...base, mobilitySessions: m, nutritionMeals: f }
    expect(countIn(S2, 'mobility', '2026-11-23', '2026-11-29')).toBe(1)
    expect(countIn(S2, 'meals', '2026-11-23', '2026-11-29')).toBe(2)
  })
  it('reached at or above the target', () => {
    expect(goalProgress(S, { type: 'workouts', target: 2, from: '2026-10-01' }, TODAY)).toMatchObject({ reached: true, pct: 100 })
  })
})

describe('lift goals', () => {
  const W = [
    { d: '2026-01-01', start: 1, entries: [{ id: 'bench', sets: [{ w: 80, r: 5, done: true }] }] },
    { d: '2026-01-15', start: 3, entries: [{ id: 'bench', sets: [{ w: 90, r: 5, done: true }] }] },
  ]   // estimates 93.3 then 105
  const goal = (target, from = '2026-01-10') => ({ type: 'lift', exId: 'bench', target, unit: 'kg', from })
  it('has no number before any estimate, and never invents one', () => {
    const p = goalProgress({ ...base }, goal(100), TODAY)
    expect(p).toMatchObject({ kind: 'lift', current: null, baseline: null, pct: 0, reached: false })
  })
  it('measures from the best estimate before the goal was set', () => {
    const p = goalProgress({ ...base, workouts: W }, goal(120), TODAY)
    expect(p).toMatchObject({ current: 105, baseline: 93.3, target: 120 })
    expect(p.pct).toBe(44)   // (105 - 93.3) / (120 - 93.3)
    expect(p.reached).toBe(false)
  })
  it('is reached at or above the target', () => {
    expect(goalProgress({ ...base, workouts: W }, goal(100), TODAY)).toMatchObject({ reached: true, pct: 100 })
  })
  it('falls back to the first estimate when nothing came before the goal', () => {
    expect(goalProgress({ ...base, workouts: W }, goal(120, '2025-01-01'), TODAY).baseline).toBe(93.3)
  })
  it('converts the target into the profile unit', () => {
    const p = goalProgress({ ...base, unit: 'lb' }, goal(100), TODAY)
    expect(p.target).toBeCloseTo(220.5, 1)
    expect(p.unit).toBe('lb')
  })
})

describe('range', () => {
  it('starts the last 7 days on the day six before today', () => {
    expect(rangeFrom('7d', TODAY)).toBe('2026-11-20')
    expect(rangeFrom('all', TODAY)).toBe('0000-01-01')
    expect(RANGES).toEqual(['7d', '30d', '90d', '6m', '1y', 'all'])
  })
  it('summarises only what was logged; weight needs two weigh-ins', () => {
    const S = { ...base, workouts: [{ d: '2026-11-20' }, { d: '2026-10-01' }], bodyweight: [{ d: '2026-11-20', w: 80 }, { d: '2026-11-25', w: 79.2 }], mobilitySessions: withMobilitySession({}, 'a', sess('2026-11-21')) }
    const r = rangeSummary(S, '2026-11-20', TODAY)
    expect(r).toMatchObject({ workouts: 1, mobilitySessions: 1, mobilityMinutes: 5, foodDays: 0 })
    expect(r.weight).toEqual({ from: { d: '2026-11-20', w: 80 }, to: { d: '2026-11-25', w: 79.2 }, change: -0.8 })
    expect(rangeSummary({ ...S, bodyweight: [{ d: '2026-11-20', w: 80 }] }, '2026-11-20', TODAY).weight).toBeNull()
  })
})
