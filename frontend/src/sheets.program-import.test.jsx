// @vitest-environment happy-dom
// A training programme file (JSON or CSV) picked under Plan > Import a plan file goes through the
// same import sheet as a plan file: previewed first, added as new routines, nothing overwritten.
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { importPlanFile } from './sheets.jsx'

const clone = v => JSON.parse(JSON.stringify(v))
const mounted = []

function renderTop() {
  const sheet = useUI.getState().sheets.at(-1)
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => root.render(sheet.render(() => useUI.getState().closeSheet(sheet.id))))
  return host
}
const buttonFor = (host, label) => [...host.querySelectorAll('button')].find(b => b.textContent === label)
const pick = (text, name) => importPlanFile(new File([text], name))
const sheetOpened = () => vi.waitFor(() => expect(useUI.getState().sheets.length).toBeGreaterThan(0))
const toastShown = () => vi.waitFor(() => expect(useUI.getState().toastMsg).not.toBe(''))

const program = {
  schema_version: '1.0', type: 'training_program',
  program: { name: 'Base', days: [
    { name: 'Treino A', exercises: [{ name: 'Barbell Bench Press', sets: 4, reps: '8-12', rest_seconds: 90, load: 40 }, { name: 'Exercicio inventado xyz', sets: 3, reps: 10 }] },
    { name: 'Treino B', exercises: [{ name: 'Barbell Squat', sets: 5, reps: 5 }] },
  ] },
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [], toastMsg: '' })
  document.body.innerHTML = ''
  const S = clone(useStore.getState().S)
  S.routines = [{ id: 'mine', name: 'Minha ficha', emoji: null, ex: [] }]
  S.week = {}
  S.customEx = []
  useStore.setState({ S, user: null })
})
afterEach(() => { act(() => { mounted.splice(0).forEach(r => r.unmount()) }) })

describe('importing a programme file from the Plan menu', () => {
  it('a JSON programme opens the preview, then adds its days as new routines', async () => {
    pick(JSON.stringify(program), 'ficha.json')
    await sheetOpened()
    const host = renderTop()
    act(() => { buttonFor(host, 'Add to my plan').click() })
    const S = useStore.getState().S
    expect(S.routines.map(r => r.name)).toEqual(['Minha ficha', 'Treino A', 'Treino B'])
    expect(S.routines[1].ex).toHaveLength(2)
    expect(S.routines[1].ex[0]).toMatchObject({ sets: 4, reps: 12, repsMin: 8, restSec: 90, weight: 40 })
    expect(S.customEx.map(c => c.n)).toEqual(['Exercicio inventado xyz'])
    expect(S.routines[0].id).toBe('mine')
  })

  it('a CSV does the same', async () => {
    pick('Dia,Exercício,Séries,Reps\nTreino A,Barbell Bench Press,4,8-12\nTreino A,Barbell Curl,3,10\n', 'ficha.csv')
    await sheetOpened()
    const host = renderTop()
    act(() => { buttonFor(host, 'Add to my plan').click() })
    const S = useStore.getState().S
    expect(S.routines.map(r => r.name)).toEqual(['Minha ficha', 'Treino A'])
    expect(S.routines[1].ex).toHaveLength(2)
  })

  it('says so when a value had to be adjusted', async () => {
    const bad = clone(program)
    bad.program.days[0].exercises[0].sets = 99
    pick(JSON.stringify(bad), 'ficha.json')
    await sheetOpened()
    await toastShown()
    expect(useUI.getState().toastMsg).toBe('1 values were adjusted to fit the app’s limits.')
  })

  it('refuses a CSV with no exercise column, and adds nothing', async () => {
    pick('a,b\nx,y\n', 'ficha.csv')
    await toastShown()
    expect(useUI.getState().toastMsg).toBe('Couldn’t find an “Exercise” column in that CSV.')
    expect(useUI.getState().sheets).toHaveLength(0)
    expect(useStore.getState().S.routines).toHaveLength(1)
  })

  it('a programme with no usable exercise is refused', async () => {
    pick(JSON.stringify({ ...program, program: { name: 'x', days: [{ name: 'A', exercises: [{ sets: 3 }] }] } }), 'ficha.json')
    await toastShown()
    expect(useUI.getState().toastMsg).toBe('The programme has no exercises to import.')
    expect(useUI.getState().sheets).toHaveLength(0)
  })

  it('a plan file still goes the old way', async () => {
    pick(JSON.stringify({ opengym_plan: 1, unit: 'kg', week: {}, routines: [], customEx: [] }), 'plan.json')
    await sheetOpened()
    expect(useUI.getState().sheets).toHaveLength(1)
  })
})
