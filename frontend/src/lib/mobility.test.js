import { describe, it, expect } from 'vitest'
import {
  readItem, readMobilityRoutine, mobilityRoutinesOf, withMobilityRoutine, readMobilitySession, mobilitySessionsOf, withMobilitySession,
  doseOf, itemSeconds, routineMinutes, suggestItems, presetItems, ROUTINE_PRESETS, mobilityTotals, mobilityWeeks, mobilityExerciseCounts, romSeries, MAX_ITEMS,
} from './mobility.js'
import { mobilityExercise } from './mobility-library.js'

const session = (d, extra = {}) => ({ d, min: 10, items: [{ id: 'mob-cat-cow' }], ...extra })

describe('items and routines', () => {
  it('reads a library item and an item of your own, and refuses what names nothing', () => {
    expect(readItem({ id: 'mob-cat-cow', reps: 12, sets: 2 })).toEqual({ id: 'mob-cat-cow', reps: 12, sets: 2 })
    expect(readItem({ name: '  Frog stretch ', sec: 45 })).toEqual({ name: 'Frog stretch', sec: 45 })
    expect(readItem({ id: 'mob-not-real' })).toBeNull()
    expect(readItem({})).toBeNull()
    expect(readItem(null)).toBeNull()
  })
  it('keeps a dose within bounds and prefers seconds to reps', () => {
    expect(readItem({ name: 'x', sec: 99999, sets: 99 })).toEqual({ name: 'x', sec: 1800, sets: 10 })
    expect(readItem({ name: 'x', sec: 20, reps: 10 })).toEqual({ name: 'x', sec: 20 })
    expect(readItem({ name: 'x', sec: -5 })).toEqual({ name: 'x' })
  })
  it('needs a name and at least one usable item', () => {
    expect(readMobilityRoutine({ name: '', items: [{ id: 'mob-cat-cow' }] })).toBeNull()
    expect(readMobilityRoutine({ name: 'A', items: [] })).toBeNull()
    expect(readMobilityRoutine({ name: 'A', items: [{}] })).toBeNull()
    expect(readMobilityRoutine({ name: 'A', items: [{ id: 'mob-cat-cow' }, 5] }).items).toHaveLength(1)
  })
  it('caps the number of items and the text length', () => {
    const many = Array.from({ length: MAX_ITEMS + 5 }, () => ({ id: 'mob-cat-cow' }))
    expect(readMobilityRoutine({ name: 'A', items: many }).items).toHaveLength(MAX_ITEMS)
    expect(readMobilityRoutine({ name: 'n'.repeat(500), items: many, note: 'x'.repeat(5000) }).note).toHaveLength(500)
  })
  it('stamps a routine, and a removal is a stamped empty entry that disappears from the list', () => {
    let map = withMobilityRoutine(undefined, 'r1', { name: 'Morning', items: [{ id: 'mob-cat-cow' }] }, 100)
    expect(map.r1._ts).toBe(100)
    expect(mobilityRoutinesOf({ mobilityRoutines: map }).map(r => r.name)).toEqual(['Morning'])
    map = withMobilityRoutine(map, 'r1', null, 200)
    expect(map.r1).toEqual({ _ts: 200 })
    expect(mobilityRoutinesOf({ mobilityRoutines: map })).toEqual([])
  })
  it('does not trust the stored map', () => {
    for (const bad of [null, [], 'x', { a: null, b: 3, c: { name: 'x' } }]) expect(mobilityRoutinesOf({ mobilityRoutines: bad })).toEqual([])
    expect(mobilityRoutinesOf(null)).toEqual([])
  })
})

describe('sessions', () => {
  it('needs a real day and a duration', () => {
    expect(readMobilitySession({ d: 'x', min: 5 })).toBeNull()
    expect(readMobilitySession({ d: '2026-11-01', min: 0 })).toBeNull()
    expect(readMobilitySession(session('2026-11-01'))).toMatchObject({ d: '2026-11-01', min: 10 })
  })
  it('keeps effort 1 to 5, a note, the routine it came from, and which items were done', () => {
    const s = readMobilitySession(session('2026-11-01', { effort: 4, note: ' ok ', routineId: 'r1', routineName: 'Morning', items: [{ id: 'mob-cat-cow', done: false }, { name: 'Own', done: true }] }))
    expect(s).toMatchObject({ effort: 4, note: 'ok', routineId: 'r1', routineName: 'Morning' })
    expect(s.items).toEqual([{ id: 'mob-cat-cow', done: false }, { name: 'Own', done: true }])
    expect(readMobilitySession(session('2026-11-01', { effort: 9 })).effort).toBeUndefined()
    expect(readMobilitySession(session('2026-11-01', { effort: 0 })).effort).toBeUndefined()
  })
  it('keeps a range-of-motion reading only when it is a sensible number in a known unit', () => {
    const items = [{ id: 'mob-cat-cow', rom: { v: 12.34, unit: 'cm' } }, { id: 'mob-cat-cow', rom: { v: -3, unit: 'cm' } }, { id: 'mob-cat-cow', rom: { v: 5, unit: 'miles' } }]
    const s = readMobilitySession(session('2026-11-01', { items }))
    expect(s.items[0].rom).toEqual({ v: 12.3, unit: 'cm' })
    expect(s.items[1].rom).toBeUndefined()
    expect(s.items[2].rom).toBeUndefined()
  })
  it('lists newest day first, and later edits first within a day', () => {
    let m = withMobilitySession({}, 'a', session('2026-11-01'), 1)
    m = withMobilitySession(m, 'b', session('2026-11-03'), 2)
    m = withMobilitySession(m, 'c', session('2026-11-03'), 5)
    expect(mobilitySessionsOf({ mobilitySessions: m }).map(s => s.id)).toEqual(['c', 'b', 'a'])
    m = withMobilitySession(m, 'c', null, 9)
    expect(mobilitySessionsOf({ mobilitySessions: m }).map(s => s.id)).toEqual(['b', 'a'])
  })
})

describe('time', () => {
  it('uses the library dose when the item has none, and both sides', () => {
    expect(doseOf({ id: 'mob-neck-side-stretch' })).toEqual({ sets: 1, sides: true, sec: 30 })
    expect(doseOf({ id: 'mob-cat-cow' })).toEqual({ sets: 1, sides: false, reps: 10 })
    expect(doseOf({ id: 'mob-cat-cow', reps: 5, sets: 2 })).toEqual({ sets: 2, sides: false, reps: 5 })
    expect(doseOf({ name: 'Own' })).toEqual({ sets: 1, sides: false, sec: 30 })
  })
  it('adds up seconds including the change between exercises', () => {
    expect(itemSeconds({ id: 'mob-neck-side-stretch' })).toBe(30 * 2 + 10)
    expect(itemSeconds({ id: 'mob-cat-cow' })).toBe(10 * 3 + 10)
    expect(routineMinutes([{ id: 'mob-neck-side-stretch' }, { id: 'mob-cat-cow' }])).toBe(2)
    expect(routineMinutes([])).toBe(1)
  })
})

describe('suggestions', () => {
  const secs = items => items.reduce((n, i) => n + itemSeconds(i), 0)
  it('fits the time and is deterministic', () => {
    const a = suggestItems({ minutes: 5 }), b = suggestItems({ minutes: 5 })
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(0)
    expect(secs(a)).toBeLessThanOrEqual(300)
  })
  it('never gives a beginner something harder than beginner', () => {
    for (const p of ROUTINE_PRESETS) for (const i of presetItems(p.key, { level: 'beginner' })) expect(mobilityExercise(i.id).level, p.key + i.id).toBe('beginner')
  })
  it('can give an intermediate person intermediate work', () => {
    const levels = new Set(suggestItems({ minutes: 20, level: 'intermediate' }).map(i => mobilityExercise(i.id).level))
    expect(levels.has('intermediate')).toBe(true)
  })
  it('favours the regions the person asked for', () => {
    const items = suggestItems({ minutes: 4, regions: ['ankles'] })
    expect(mobilityExercise(items[0].id).regions.some(r => r === 'ankles') || items.some(i => mobilityExercise(i.id).regions.includes('ankles'))).toBe(true)
    expect(items.filter(i => mobilityExercise(i.id).regions.includes('ankles')).length).toBeGreaterThanOrEqual(2)
  })
  it('leaves out an avoided region or exercise', () => {
    const items = suggestItems({ minutes: 30, level: 'advanced', avoid: ['knees', 'mob-cat-cow'] })
    expect(items.length).toBeGreaterThan(0)
    for (const i of items) {
      expect(i.id).not.toBe('mob-cat-cow')
      expect(mobilityExercise(i.id).regions).not.toContain('knees')
    }
  })
  it('puts warm-up and wake-up work before holds, and rest last', () => {
    const cats = suggestItems({ minutes: 30, level: 'intermediate' }).map(i => mobilityExercise(i.id).cat)
    const flow = ['preparation', 'activation', 'body-awareness', 'joint-mobility', 'dynamic-flexibility', 'motor-control', 'joint-stability', 'balance', 'coordination', 'static-flexibility', 'stretching', 'recovery']
    const idx = cats.map(c => flow.indexOf(c))
    expect(idx).toEqual([...idx].sort((a, b) => a - b))
  })
  it('every preset gives a usable routine for a beginner, with no profile at all', () => {
    for (const p of ROUTINE_PRESETS) {
      const items = presetItems(p.key)
      expect(items.length, p.key).toBeGreaterThan(0)
      expect(readMobilityRoutine({ name: p.label, items }), p.key).not.toBeNull()
    }
    expect(presetItems('nope')).toEqual([])
  })
  it('a beginner preset stays beginner even for an advanced profile', () => {
    for (const i of presetItems('beginner', { level: 'advanced' })) expect(mobilityExercise(i.id).level).toBe('beginner')
  })
})

describe('what the sessions add up to', () => {
  let m = {}
  m = withMobilitySession(m, 'a', session('2026-11-02', { min: 10, effort: 2, items: [{ id: 'mob-cat-cow', done: true, rom: { v: 20, unit: 'deg' } }, { name: 'Frog', done: false }] }), 1)
  m = withMobilitySession(m, 'b', session('2026-11-02', { min: 5, effort: 4, items: [{ id: 'mob-cat-cow', done: true }] }), 2)
  m = withMobilitySession(m, 'c', session('2026-11-10', { min: 15, items: [{ id: 'mob-cat-cow', done: true, rom: { v: 28, unit: 'deg' } }, { name: 'Frog', done: true }] }), 3)
  const S = { mobilitySessions: m }
  it('counts only the range asked for', () => {
    expect(mobilityTotals(S, '2026-11-01', '2026-11-07')).toEqual({ sessions: 2, days: 1, minutes: 15, exercises: 2, effort: 3 })
    expect(mobilityTotals(S, '2026-11-01', '2026-11-30')).toMatchObject({ sessions: 3, days: 2, minutes: 30, exercises: 4 })
    expect(mobilityTotals({}, '2026-11-01', '2026-11-30')).toEqual({ sessions: 0, days: 0, minutes: 0, exercises: 0, effort: null })
  })
  it('says how many days per week, oldest week first, with empty weeks counted as zero', () => {
    const w = mobilityWeeks(S, '2026-11-12', 3)
    expect(w).toHaveLength(3)
    expect(w.map(x => x.days)).toEqual([0, 1, 1])
    expect(w[2].to).toBe('2026-11-12')
  })
  it('counts exercises done, not skipped, and keeps your own apart from the library', () => {
    expect(mobilityExerciseCounts(S, '2026-11-01', '2026-11-30')).toEqual([
      { key: 'mob-cat-cow', id: 'mob-cat-cow', times: 3 }, { key: 'n:frog', name: 'Frog', times: 1 },
    ])
  })
  it('follows range of motion over time, in one unit', () => {
    expect(romSeries(S, 'mob-cat-cow')).toEqual({ points: [{ d: '2026-11-02', v: 20, unit: 'deg' }, { d: '2026-11-10', v: 28, unit: 'deg' }], unit: 'deg', change: 8 })
    expect(romSeries(S, 'mob-other')).toEqual({ points: [], unit: null, change: null })
  })
  it('does not mix units into the change', () => {
    const mixed = withMobilitySession(m, 'd', session('2026-11-11', { items: [{ id: 'mob-cat-cow', rom: { v: 30, unit: 'cm' } }] }), 4)
    const r = romSeries({ mobilitySessions: mixed }, 'mob-cat-cow')
    expect(r.unit).toBe('cm')
    expect(r.change).toBeNull()
  })
})
