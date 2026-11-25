// @vitest-environment happy-dom
// The Mobility screen: a ready-made routine runs and saves a session, the library opens an exercise,
// the progress tab starts empty and then shows what was saved. No profile is needed for any of it.
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import Mobility from './Mobility.jsx'
import { mobilitySessionsOf } from '../lib/mobility.js'

const clone = v => JSON.parse(JSON.stringify(v))
const mounted = []
const btn = (host, label) => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === label)

function mount() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => root.render(<MemoryRouter><Mobility /></MemoryRouter>))
  return host
}
function topSheet() {
  const sheet = useUI.getState().sheets.at(-1)
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
  return host
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [], toastMsg: '' })
  document.body.innerHTML = ''
  const S = clone(useStore.getState().S)
  S.mobilityRoutines = {}
  S.mobilitySessions = {}
  useStore.setState({ S, user: null })
})
afterEach(() => { act(() => { mounted.splice(0).forEach(r => r.unmount()) }) })

describe('Mobility screen', () => {
  it('shows the notice and the ready-made routines without any profile', () => {
    const host = mount()
    expect(host.textContent).toContain('not treatment')
    expect(host.textContent).toContain('Morning routine')
  })

  it('runs a ready-made routine and saves only what was marked done', () => {
    const host = mount()
    act(() => { [...host.querySelectorAll('button')].find(b => b.textContent.includes('Morning routine')).click() })
    const run = topSheet()
    act(() => { btn(run, 'Done').click() })
    expect(useStore.getState().S.mobilitySessions && mobilitySessionsOf(useStore.getState().S)).toHaveLength(0)
    // skip every remaining step, then finish
    for (let i = 0; i < 40 && btn(run, 'Skip'); i++) act(() => { btn(run, 'Skip').click() })
    act(() => { btn(run, 'Finish').click() })
    const sessions = mobilitySessionsOf(useStore.getState().S)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].items.filter(i => i.done)).toHaveLength(1)
  })

  it('opens an exercise from the library with its cautions', () => {
    const host = mount()
    act(() => { btn(host, 'Library').click() })
    act(() => { host.querySelector('.list .item').click() })
    const sheet = topSheet()
    expect(sheet.textContent).toContain('Caution')
    expect(sheet.textContent).toContain('Common mistakes')
  })

  it('progress is empty first, then lists the saved session', () => {
    const host = mount()
    act(() => { btn(host, 'Progress').click() })
    expect(host.textContent).toContain('No sessions yet')
    act(() => {
      useStore.getState().update(s => { s.mobilitySessions = { x: { d: new Date().toISOString().slice(0, 10), min: 5, routineName: 'Mine', items: [{ id: 'mob-cat-cow', sets: 1, reps: 8, done: true }], _ts: 1 } } })
    })
    expect(host.textContent).toContain('Mine')
  })
})
