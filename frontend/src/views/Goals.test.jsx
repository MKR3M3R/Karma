// @vitest-environment happy-dom
// The Goals screen: a weekly goal is created and shows this week's count from the logs, a lift goal
// needs an exercise, progress over a range counts only what was logged, and nothing is preset.
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import Goals from './Goals.jsx'
import { goalsOf } from '../lib/goals.js'
import { todayISO } from '../lib/format.js'

const clone = v => JSON.parse(JSON.stringify(v))
const mounted = []
const btn = (host, label) => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === label || b.getAttribute('aria-label') === label)
const render = node => { const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host); mounted.push(root); act(() => root.render(node)); return host }
const mount = () => render(<MemoryRouter><Goals /></MemoryRouter>)
const topSheet = () => { const sheet = useUI.getState().sheets.at(-1); return render(sheet.render(() => useUI.getState().closeSheet(sheet.id))) }

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [], toastMsg: '' })
  document.body.innerHTML = ''
  const S = clone(useStore.getState().S)
  S.goals = {}; S.workouts = []; S.bodyweight = []
  useStore.setState({ S, user: null })
})
afterEach(() => { act(() => { mounted.splice(0).forEach(r => r.unmount()) }) })

describe('Goals screen', () => {
  it('starts with no goals and none preset', () => {
    const host = mount()
    expect(host.textContent).toContain('No goals yet')
    expect(goalsOf(useStore.getState().S)).toEqual([])
  })

  it('creates a weekly workouts goal and shows this week from the logs', () => {
    useStore.setState(s => ({ S: { ...s.S, workouts: [{ id: 'w', d: todayISO(), start: 1, entries: [] }] } }))
    const host = mount()
    act(() => { btn(host, 'New goal').click() })
    const sheet = topSheet()
    act(() => { btn(sheet, 'Save').click() })   // default: 3 per week
    const g = goalsOf(useStore.getState().S)
    expect(g).toHaveLength(1)
    expect(g[0]).toMatchObject({ type: 'workouts', target: 3 })
    expect(host.textContent).toContain('This week: 1 of 3')
  })

  it('a lift goal cannot be saved without an exercise', () => {
    const host = mount()
    act(() => { btn(host, 'New goal').click() })
    const sheet = topSheet()
    act(() => { btn(sheet, 'Lift an estimated 1RM').click() })
    expect(btn(sheet, 'Save').disabled).toBe(true)
    expect(sheet.textContent).toContain('Choose an exercise first.')
  })

  it('progress shows only what was logged, and weight needs two weigh-ins', () => {
    useStore.setState(s => ({ S: { ...s.S, workouts: [{ id: 'w', d: todayISO(), start: 1, entries: [] }], bodyweight: [{ d: todayISO(), w: 80, t: 1 }] } }))
    const host = mount()
    act(() => { btn(host, 'Progress').click() })
    expect(host.textContent).toContain('Needs two weigh-ins in this period.')
    expect(host.textContent).toContain('Workouts')
    act(() => { btn(host, '7 days').click() })
    expect(host.textContent).toContain('Workouts')
  })
})
