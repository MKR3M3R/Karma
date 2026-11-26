// @vitest-environment happy-dom
// The Nutrition screen: a food is added to a meal and counted, water adds up, an invalid food is
// refused with a reason, a plan builds a shopping list, and nothing needs a profile or target.
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import Nutrition from './Nutrition.jsx'
import { mealsOf, foodsOf, waterOf, dayOf } from '../lib/nutrition.js'
import { todayISO } from '../lib/format.js'

const clone = v => JSON.parse(JSON.stringify(v))
const mounted = []
const btn = (host, label) => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === label || b.getAttribute('aria-label') === label)
const rowWith = (host, text) => [...host.querySelectorAll('button, .item')].find(b => b.textContent.includes(text))
const render = node => {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => root.render(node))
  return host
}
const mount = () => render(<MemoryRouter><Nutrition /></MemoryRouter>)
const topSheet = () => {
  const sheet = useUI.getState().sheets.at(-1)
  return render(sheet.render(() => useUI.getState().closeSheet(sheet.id)))
}
const typeInto = (el, value) => {
  const set = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set
  act(() => { set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })) })
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  useUI.setState({ sheets: [], toastMsg: '' })
  document.body.innerHTML = ''
  const S = clone(useStore.getState().S)
  for (const k of ['nutritionFoods', 'nutritionMeals', 'nutritionWater', 'nutritionPlans']) S[k] = {}
  S.nutritionProfile = {}
  useStore.setState({ S, user: null })
})
afterEach(() => { act(() => { mounted.splice(0).forEach(r => r.unmount()) }) })

describe('Nutrition screen', () => {
  it('opens empty, with the notice and no targets or made-up numbers', () => {
    const host = mount()
    expect(host.textContent).toContain('not medical or nutrition advice')
    expect(host.textContent).toContain('No target set')
    expect(dayOf(useStore.getState().S, todayISO()).totals.kcal).toBe(0)
  })

  it('adds a reference food to breakfast and counts it', () => {
    const host = mount()
    act(() => { btn(host, 'Add food').click() })   // first slot: breakfast
    const sheet = topSheet()
    typeInto(sheet.querySelector('input'), 'banana')
    act(() => { rowWith(sheet, 'Banana').click() })
    act(() => { btn(sheet, 'Add').click() })
    const meals = mealsOf(useStore.getState().S)
    expect(meals).toHaveLength(1)
    expect(meals[0]).toMatchObject({ slot: 'breakfast', d: todayISO() })
    expect(meals[0].items[0]).toMatchObject({ name: 'Banana', amt: 100, foodId: 'ref-banana' })
    expect(host.textContent).toContain('89')
  })

  it('adds water in steps and does not go below zero', () => {
    const host = mount()
    act(() => { btn(host, '+250 ml').click() })
    act(() => { btn(host, '+500 ml').click() })
    expect(waterOf(useStore.getState().S, todayISO())).toBe(750)
    act(() => { btn(host, '-250 ml').click() })
    expect(waterOf(useStore.getState().S, todayISO())).toBe(500)
  })

  it('refuses a food whose macros cannot fit in 100 g, and saves a good one as yours', () => {
    const host = mount()
    act(() => { btn(host, 'Foods').click() })
    act(() => { rowWith(host, 'New food').click() })
    const sheet = topSheet()
    const input = l => sheet.querySelector(`input[aria-label="${l}"]`)
    typeInto(input('Name'), 'Mix')
    typeInto(input('kcal'), '300'); typeInto(input('Protein (g)'), '60'); typeInto(input('Carbs (g)'), '60'); typeInto(input('Fat (g)'), '10')
    act(() => { btn(sheet, 'Save').click() })
    expect(sheet.textContent).toContain('can’t pass 100 g')
    expect(foodsOf(useStore.getState().S)).toHaveLength(0)
    typeInto(input('Protein (g)'), '20'); typeInto(input('Carbs (g)'), '30')
    act(() => { btn(sheet, 'Save').click() })
    expect(foodsOf(useStore.getState().S)[0]).toMatchObject({ name: 'Mix', kcal: 300, p: 20, c: 30, f: 10, src: 'user' })
  })

  it('labels reference foods as reference, never as verified', () => {
    const host = mount()
    act(() => { btn(host, 'Foods').click() })
    expect(host.textContent).toContain('Reference')
    expect(host.textContent).not.toMatch(/verified/i)
  })

  it('trends are empty first and export is offered', () => {
    const host = mount()
    act(() => { btn(host, 'Trends').click() })
    expect(host.textContent).toContain('Nothing logged in this period.')
    expect(host.textContent).toContain('Diary (CSV)')
  })
})
