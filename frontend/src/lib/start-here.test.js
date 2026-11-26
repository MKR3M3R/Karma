import { describe, expect, it } from 'vitest'
import { startHereOf, startHereState, startHereWith, areaUsed, ESTABLISHED_WORKOUTS } from './start-here.js'
import { withMeal } from './nutrition.js'
import { withGoal } from './goals.js'

const meal = { d: '2026-11-20', slot: 'lunch', items: [{ name: 'x', base: 'g', amt: 100, per: { kcal: 1, p: 0, c: 0, f: 0 } }] }

describe('start here', () => {
  it('asks a new profile, once, and never an established one', () => {
    expect(startHereState({ workouts: [], routines: [] })).toEqual({ mode: 'ask' })
    expect(startHereState({ workouts: Array(ESTABLISHED_WORKOUTS).fill({ d: '2026-01-01' }) })).toBeNull()
    expect(startHereState({ workouts: [{}], startHere: { areas: [], dismissed: true } })).toBeNull()
  })
  it('"not now" (no areas, dismissed) ends the asking', () => {
    expect(startHereState({ workouts: [], startHere: startHereWith([], true) })).toBeNull()
  })
  it('points at chosen areas not yet used, and stops when all are', () => {
    const S = { workouts: [], routines: [], startHere: startHereWith(['mobility', 'nutrition', 'goals']) }
    expect(startHereState(S)).toEqual({ mode: 'point', pending: ['mobility', 'nutrition', 'goals'] })
    const used = { ...S, nutritionMeals: withMeal({}, 'a', meal) }
    expect(startHereState(used)).toEqual({ mode: 'point', pending: ['mobility', 'goals'] })
    const all = { ...used, mobilitySessions: { s: { d: '2026-11-20', min: 5, items: [{ id: 'mob-cat-cow', done: true }] , _ts: 1 } }, goals: withGoal({}, 'g', { type: 'workouts', target: 3, from: '2026-11-20' }) }
    expect(startHereState(all)).toBeNull()
  })
  it('a deleted record does not count as use', () => {
    expect(areaUsed({ nutritionMeals: { a: { _ts: 3 } } }, 'nutrition')).toBe(false)
    expect(areaUsed({ goals: { a: { _ts: 3 } } }, 'goals')).toBe(false)
  })
  it('ignores unknown areas and duplicates', () => {
    expect(startHereOf({ startHere: { areas: ['mobility', 'mobility', 'x'] } })).toEqual({ answered: true, areas: ['mobility'], dismissed: false })
    expect(startHereWith(['goals', 'goals', 'nope'])).toEqual({ areas: ['goals'] })
  })
  it('choosing nothing is valid and not a dismissal', () => {
    expect(startHereState({ workouts: [], startHere: startHereWith([]) })).toBeNull()
  })
})
