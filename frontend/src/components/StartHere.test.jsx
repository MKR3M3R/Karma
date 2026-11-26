// @vitest-environment happy-dom
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import StartHere from './StartHere.jsx'

const nav = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => nav }))

let host, root
const mounted = []
const btn = (h, label) => [...h.querySelectorAll('button')].find(b => b.textContent.trim().startsWith(label))
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; nav.mockClear(); useUI.setState({ sheets: [], toastMsg: '' }); document.body.innerHTML = ''; host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host) })
afterEach(() => { act(() => { root.unmount(); mounted.splice(0).forEach(r => r.unmount()) }) })
const mount = extra => {
  useStore.setState(s => ({ S: { ...s.S, workouts: [], routines: [], startHere: undefined, mobilityProfile: undefined, mobilitySessions: {}, nutritionMeals: {}, nutritionWater: {}, nutritionFoods: {}, nutritionPlans: {}, goals: {}, ...extra }, user: null }))
  act(() => root.render(<StartHere />))
}
const sheet = () => { const sh = useUI.getState().sheets.at(-1); const h = document.createElement('div'); document.body.appendChild(h); const r = createRoot(h); mounted.push(r); act(() => r.render(sh.render(() => useUI.getState().closeSheet(sh.id)))); return h }

describe('StartHere', () => {
  it('asks a new profile and "Not now" ends it without storing anything else', () => {
    mount({})
    expect(host.textContent).toContain('Make Karma yours')
    act(() => { btn(host, 'Not now').click() })
    expect(host.innerHTML).toBe('')
    expect(useStore.getState().S.startHere).toEqual({ areas: [], dismissed: true })
    expect(useStore.getState().S.mobilityProfile).toBeUndefined()
  })
  it('saves the chosen areas, and a level only if one is picked', () => {
    mount({})
    act(() => { btn(host, 'Choose').click() })
    const h = sheet()
    act(() => { btn(h, 'Mobility').click() })
    act(() => { btn(h, 'Nutrition').click() })
    act(() => { btn(h, 'Save').click() })
    expect(useStore.getState().S.startHere).toEqual({ areas: ['mobility', 'nutrition'] })
    expect(useStore.getState().S.mobilityProfile).toBeUndefined()
    expect(host.textContent).toContain('Next up')
  })
  it('points at the chosen area and opens it', () => {
    mount({ startHere: { areas: ['goals'] } })
    act(() => { btn(host, 'Goals').click() })
    expect(nav).toHaveBeenCalledWith('/goals')
  })
  it('is gone once everything chosen has been used', () => {
    mount({ startHere: { areas: ['goals'] }, goals: { g: { type: 'workouts', target: 3, from: '2026-11-20', _ts: 1 } } })
    expect(host.innerHTML).toBe('')
  })
})
