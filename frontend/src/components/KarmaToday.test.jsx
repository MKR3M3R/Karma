// @vitest-environment happy-dom
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useStore } from '../store/useStore.js'
import KarmaToday from './KarmaToday.jsx'
import { withMeal } from '../lib/nutrition.js'
import { withMobilitySession } from '../lib/mobility.js'
import { todayISO } from '../lib/format.js'

const nav = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => nav }))

let host, root
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; nav.mockClear(); host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host) })
afterEach(() => { act(() => root.unmount()); host.remove() })
const mount = extra => {
  useStore.setState(s => ({ S: { ...s.S, workouts: [], nutritionMeals: {}, nutritionWater: {}, nutritionFoods: {}, nutritionPlans: {}, nutritionProfile: {}, mobilitySessions: {}, mobilityRoutines: {}, ...extra }, user: null }))
  act(() => root.render(<KarmaToday />))
}

describe('KarmaToday', () => {
  it('is not on Home for someone who has used neither', () => {
    mount({})
    expect(host.innerHTML).toBe('')
  })
  it('shows what was logged today and opens Nutrition', () => {
    const d = todayISO()
    mount({ nutritionMeals: withMeal({}, 'a', { d, slot: 'lunch', items: [{ name: 'x', base: 'g', amt: 100, per: { kcal: 200, p: 20, c: 10, f: 5 } }] }) })
    expect(host.textContent).toContain('200 kcal')
    act(() => { host.querySelector('button').click() })
    expect(nav).toHaveBeenCalledWith('/nutrition')
  })
  it('says "Nothing logged today" without scolding when used before but not today', () => {
    mount({ nutritionMeals: withMeal({}, 'a', { d: '2020-01-01', slot: 'lunch', items: [{ name: 'x', base: 'g', amt: 100, per: { kcal: 200, p: 20, c: 10, f: 5 } }] }) })
    expect(host.textContent).toContain('Nothing logged today')
  })
  it('offers winding down after a workout when mobility is in use', () => {
    const d = todayISO()
    mount({ workouts: [{ id: 'w', d }], mobilitySessions: withMobilitySession({}, 'a', { d: '2020-01-01', min: 5, items: [{ id: 'mob-cat-cow', done: true }] }) })
    expect(host.textContent).toContain('Wind down after training')
  })
})
