import { describe, expect, it } from 'vitest'
import { todaySummary, nutritionUsed, mobilityUsed } from './dashboard.js'
import { withMeal, withWater } from './nutrition.js'
import { withMobilitySession } from './mobility.js'

const T = '2026-11-26'
const meal = d => ({ d, slot: 'lunch', items: [{ name: 'x', base: 'g', amt: 100, per: { kcal: 200, p: 20, c: 10, f: 5 } }] })
const sess = d => ({ d, min: 5, items: [{ id: 'mob-cat-cow', done: true }] })

describe('todaySummary', () => {
  it('shows nothing for someone who only trains', () => {
    expect(todaySummary({ workouts: [{ d: T }] }, T)).toEqual({ nutrition: null, mobility: null, windDown: false })
    expect(nutritionUsed({})).toBe(false)
    expect(mobilityUsed({})).toBe(false)
  })
  it('a record that was deleted (stamped empty) does not count as use', () => {
    expect(nutritionUsed({ nutritionMeals: { a: { _ts: 5 } }, nutritionWater: { [T]: { _ts: 5 } } })).toBe(false)
    expect(mobilityUsed({ mobilitySessions: { a: { _ts: 5 } } })).toBe(false)
  })
  it('nutrition appears once used, with today only and the targets the person set', () => {
    const S = { nutritionMeals: withMeal(withMeal({}, 'a', meal(T)), 'b', meal('2026-11-25')), nutritionWater: withWater({}, T, 500), nutritionProfile: { kcal: 2000 } }
    expect(todaySummary(S, T).nutrition).toEqual({ kcal: 200, p: 20, water: 500, logged: true, targets: { kcal: 2000 } })
  })
  it('used earlier but nothing today: zeros, not logged, no target invented', () => {
    const S = { nutritionMeals: withMeal({}, 'b', meal('2026-11-20')) }
    expect(todaySummary(S, T).nutrition).toEqual({ kcal: 0, p: 0, water: 0, logged: false, targets: {} })
  })
  it('mobility counts days in the last 7 and the latest session', () => {
    let m = withMobilitySession({}, 'a', sess('2026-11-26'))
    m = withMobilitySession(m, 'b', sess('2026-11-24'))
    m = withMobilitySession(m, 'c', sess('2026-11-24'))
    m = withMobilitySession(m, 'd', sess('2026-11-10'))
    expect(todaySummary({ mobilitySessions: m }, T).mobility).toEqual({ today: 1, days: 2, last: '2026-11-26' })
  })
  it('suggests winding down only after a workout today, with mobility in use and none done today', () => {
    const used = withMobilitySession({}, 'a', sess('2026-11-20'))
    expect(todaySummary({ workouts: [{ d: T }], mobilitySessions: used }, T).windDown).toBe(true)
    expect(todaySummary({ workouts: [], mobilitySessions: used }, T).windDown).toBe(false)
    expect(todaySummary({ workouts: [{ d: T }] }, T).windDown).toBe(false)
    expect(todaySummary({ workouts: [{ d: T }], mobilitySessions: withMobilitySession(used, 'b', sess(T)) }, T).windDown).toBe(false)
  })
})
