// Mobility routines and sessions (lib/mobility-library.js holds the exercises).
//
// Stored like recovery sessions and activities: one stamped entry per routine or per session, so
// two devices that each added one keep both, an edit keeps its later version, and a removal is a
// stamped empty entry (lib/sync-merge.js STAMPED_MAPS):
//
//   S.mobilityRoutines = { '<id>': { name, items: [Item], goal?, tag?, note?, _ts }, … }
//   S.mobilitySessions = { '<id>': { d, min, items: [Done], routineId?, routineName?, effort?, note?, _ts }, … }
//
//   Item = { id }  or  { name }   (a library exercise, or one of your own by name), plus
//          { sec? | reps?, sets? }  how long or how many; absent means the library's own dose
//   Done = Item fields + { done: true|false, rom?: { v, unit } }   what was done in a session
//
// Everything that decides what is shown or suggested is a pure function here, with a test beside
// it. Nothing is invented: a stat is counted from the sessions the person logged.
import { MOBILITY_EXERCISES, MOBILITY_LEVELS, MOBILITY_REGIONS, mobilityExercise } from './mobility-library.js'

export const MAX_ITEMS = 40
export const MAX_NAME = 80
export const MAX_NOTE = 500
export const MAX_MIN = 600
export const MAX_SETS = 10
export const MAX_SEC = 1800
export const MAX_REPS = 200
export const EFFORT_MIN = 1
export const EFFORT_MAX = 5
export const ROM_UNITS = ['deg', 'cm', 'in']

const isMap = v => !!v && typeof v === 'object' && !Array.isArray(v)
const ISO = /^\d{4}-\d{2}-\d{2}$/
const text = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max) : '')
const posInt = (v, max) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) && n >= 1 ? Math.min(max, n) : null
}

/** One routine item read back: { id | name, sec? | reps?, sets? } or null when it names nothing usable. */
export function readItem(raw) {
  if (!isMap(raw)) return null
  const out = {}
  if (typeof raw.id === 'string' && mobilityExercise(raw.id)) out.id = raw.id
  else {
    const name = text(raw.name, MAX_NAME)
    if (!name) return null
    out.name = name
  }
  const sec = posInt(raw.sec, MAX_SEC), reps = posInt(raw.reps, MAX_REPS), sets = posInt(raw.sets, MAX_SETS)
  if (sec) out.sec = sec
  else if (reps) out.reps = reps
  if (sets && sets > 1) out.sets = sets
  return out
}

/** One stored routine read back: { name, items, goal?, tag?, note? } or null. */
export function readMobilityRoutine(entry) {
  if (!isMap(entry)) return null
  const name = text(entry.name, MAX_NAME)
  const items = (Array.isArray(entry.items) ? entry.items : []).slice(0, MAX_ITEMS).map(readItem).filter(Boolean)
  if (!name || !items.length) return null
  const out = { name, items }
  const goal = text(entry.goal, 60), tag = text(entry.tag, 20), note = text(entry.note, MAX_NOTE)
  if (goal) out.goal = goal
  if (tag) out.tag = tag
  if (note) out.note = note
  return out
}

/** Every routine, by name, as { id, ...routine }. */
export function mobilityRoutinesOf(S) {
  const map = isMap(S?.mobilityRoutines) ? S.mobilityRoutines : {}
  const out = []
  for (const [id, e] of Object.entries(map)) {
    const r = readMobilityRoutine(e)
    if (r) out.push({ id, ...r, _ts: Number(e._ts) || 0 })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

/** The map with `id` set to `routine` stamped `now`; null (or an unusable routine) clears it. */
export function withMobilityRoutine(map, id, routine, now = Date.now()) {
  const clean = routine ? readMobilityRoutine(routine) : null
  return { ...(isMap(map) ? map : {}), [id]: clean ? { ...clean, _ts: now } : { _ts: now } }
}

/** What one session logged for an exercise: the item plus done and an optional range-of-motion reading. */
function readDone(raw) {
  const item = readItem(raw)
  if (!item) return null
  const out = { ...item, done: raw.done !== false }
  const v = Number(raw?.rom?.v)
  if (isMap(raw.rom) && Number.isFinite(v) && v > 0 && v < 1000 && ROM_UNITS.includes(raw.rom.unit)) out.rom = { v: Math.round(v * 10) / 10, unit: raw.rom.unit }
  return out
}

/** One stored session read back: { d, min, items, routineId?, routineName?, effort?, note? } or null. */
export function readMobilitySession(entry) {
  if (!isMap(entry) || !ISO.test(String(entry.d || ''))) return null
  const min = posInt(entry.min, MAX_MIN)
  if (!min) return null
  const out = { d: entry.d, min, items: (Array.isArray(entry.items) ? entry.items : []).slice(0, MAX_ITEMS).map(readDone).filter(Boolean) }
  const rid = text(entry.routineId, 40), rname = text(entry.routineName, MAX_NAME), note = text(entry.note, MAX_NOTE)
  const effort = Math.round(Number(entry.effort))
  if (rid) out.routineId = rid
  if (rname) out.routineName = rname
  if (effort >= EFFORT_MIN && effort <= EFFORT_MAX) out.effort = effort
  if (note) out.note = note
  return out
}

/** Every session, newest day first, as { id, ...session }. */
export function mobilitySessionsOf(S) {
  const map = isMap(S?.mobilitySessions) ? S.mobilitySessions : {}
  const out = []
  for (const [id, e] of Object.entries(map)) {
    const s = readMobilitySession(e)
    if (s) out.push({ id, ...s, _ts: Number(e._ts) || 0 })
  }
  return out.sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : b._ts - a._ts))
}

/** The map with `id` set to `session` stamped `now`; null (or an unusable session) clears it. */
export function withMobilitySession(map, id, session, now = Date.now()) {
  const clean = session ? readMobilitySession(session) : null
  return { ...(isMap(map) ? map : {}), [id]: clean ? { ...clean, _ts: now } : { _ts: now } }
}

/* ------------------------------------------------------------ time ---- */

const TRANSITION_SEC = 10
const SECONDS_PER_REP = 3

/** An item's dose with the library's own filling in what the item leaves out: { sec? | reps?, sets, sides }. */
export function doseOf(item) {
  const ex = item.id ? mobilityExercise(item.id) : null
  const base = ex ? ex.dose : { sec: 30 }
  const out = { sets: item.sets || 1, sides: !!base.sides }
  if (item.sec) out.sec = item.sec
  else if (item.reps) out.reps = item.reps
  else if (base.sec) out.sec = base.sec
  else out.reps = base.reps
  return out
}

/** Seconds an item takes, counting both sides and a short change between exercises. */
export function itemSeconds(item) {
  const d = doseOf(item)
  const one = d.sec ? d.sec : d.reps * SECONDS_PER_REP
  return (one * (d.sides ? 2 : 1) + TRANSITION_SEC) * d.sets
}

/** A routine's length in whole minutes (at least 1). */
export const routineMinutes = items => Math.max(1, Math.round(items.reduce((n, i) => n + itemSeconds(i), 0) / 60))

/* ---------------------------------------------------------- suggest ---- */

// Where an exercise sits in a routine: raise and wake up, then move, then hold, then settle.
const FLOW = ['preparation', 'activation', 'body-awareness', 'joint-mobility', 'dynamic-flexibility', 'motor-control', 'joint-stability',
  'balance', 'coordination', 'static-flexibility', 'stretching', 'recovery']
const flowIndex = ex => FLOW.indexOf(ex.cat)
const LEVEL_RANK = Object.fromEntries(MOBILITY_LEVELS.map((l, i) => [l, i]))

/** The ready-made routines the screen offers; `tag` picks the exercises, `minutes` sizes them. */
export const ROUTINE_PRESETS = [
  { key: 'morning', label: 'Morning routine', tag: 'morning', minutes: 8 },
  { key: 'beginner', label: 'Mobility for beginners', tag: null, minutes: 10, maxLevel: 'beginner' },
  { key: 'general', label: 'General mobility', tag: null, minutes: 15 },
  { key: 'prep', label: 'Before exercise', tag: 'warmup', minutes: 8 },
  { key: 'recover', label: 'After exercise', tag: 'cooldown', minutes: 10 },
  { key: 'desk', label: 'Desk break', tag: 'desk', minutes: 5 },
  { key: 'flex', label: 'Flexibility', tag: null, minutes: 15, cats: ['static-flexibility', 'stretching'] },
  { key: 'relax', label: 'Wind down', tag: 'evening', minutes: 10, cats: ['recovery', 'stretching', 'body-awareness', 'static-flexibility'] },
]

/**
 * Exercises for a routine, as items: { tag?, cats?, regions?, minutes = 10, level = 'beginner', avoid = [] }.
 * `level` is the most demanding exercise offered (a beginner never gets an advanced one); `regions`
 * are what the person wants to work on (none means everywhere); `avoid` holds regions or exercise
 * ids to leave out, for a limitation the person chose to share. The result is in routine order and
 * fits the time. Deterministic: the same options give the same routine.
 */
export function suggestItems({ tag = null, cats = null, regions = [], minutes = 10, level = 'beginner', avoid = [] } = {}) {
  const maxRank = LEVEL_RANK[level] ?? 0
  const want = new Set(regions.filter(r => MOBILITY_REGIONS.includes(r)))
  const skip = new Set(avoid)
  const fits = ex => (LEVEL_RANK[ex.level] ?? 0) <= maxRank
    && !skip.has(ex.id) && !ex.regions.some(r => skip.has(r))
    && (!tag || ex.tags.includes(tag))
    && (!cats || cats.includes(ex.cat))
  const pool = MOBILITY_EXERCISES.filter(fits)
  // Matching a wanted region first, then the library's own order, so the pick is stable.
  const score = ex => (want.size ? ex.regions.filter(r => want.has(r)).length : 0)
  const ranked = pool.map((ex, i) => ({ ex, i })).sort((a, b) => score(b.ex) - score(a.ex) || a.i - b.i).map(x => x.ex)
  // Over-weighting one region is avoided by taking one exercise per category before a second.
  const chosen = []
  const budget = Math.max(1, minutes) * 60
  let used = 0
  for (const pass of [0, 1, 2]) {
    const seen = new Map()
    for (const ex of ranked) {
      if (chosen.includes(ex)) continue
      const n = seen.get(ex.cat) || 0
      if (n > pass) continue
      seen.set(ex.cat, n + 1)
      const cost = itemSeconds({ id: ex.id })
      if (used + cost > budget) continue
      chosen.push(ex)
      used += cost
    }
  }
  chosen.sort((a, b) => flowIndex(a) - flowIndex(b))
  return chosen.map(ex => ({ id: ex.id }))
}

/** A preset as items, shaped by what the person shared (level, regions, time, avoided). */
export function presetItems(key, opts = {}) {
  const p = ROUTINE_PRESETS.find(x => x.key === key)
  if (!p) return []
  const level = p.maxLevel && (LEVEL_RANK[opts.level] ?? 0) > LEVEL_RANK[p.maxLevel] ? p.maxLevel : opts.level || 'beginner'
  return suggestItems({ tag: p.tag, cats: p.cats, regions: opts.regions || [], minutes: opts.minutes || p.minutes, level, avoid: opts.avoid || [] })
}

/* ------------------------------------------------------------ stats ---- */

const addDays = (iso, n) => {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Counts from the sessions in [from, to]: sessions, days with one, minutes, exercises done, average effort. */
export function mobilityTotals(S, from, to) {
  const list = mobilitySessionsOf(S).filter(s => s.d >= from && s.d <= to)
  const efforts = list.map(s => s.effort).filter(Boolean)
  return {
    sessions: list.length,
    days: new Set(list.map(s => s.d)).size,
    minutes: list.reduce((n, s) => n + s.min, 0),
    exercises: list.reduce((n, s) => n + s.items.filter(i => i.done).length, 0),
    effort: efforts.length ? Math.round((efforts.reduce((a, b) => a + b, 0) / efforts.length) * 10) / 10 : null,
  }
}

/** Days with a session per week for the last `weeks` weeks ending on `endISO`: [{ from, to, days }], oldest first. */
export function mobilityWeeks(S, endISO, weeks = 8) {
  const days = new Set(mobilitySessionsOf(S).map(s => s.d))
  const out = []
  for (let w = weeks - 1; w >= 0; w--) {
    const to = addDays(endISO, -7 * w), from = addDays(to, -6)
    let n = 0
    for (let i = 0; i < 7; i++) if (days.has(addDays(from, i))) n++
    out.push({ from, to, days: n })
  }
  return out
}

/** How many times each exercise was done in [from, to], most done first: [{ key, id?, name?, times }]. */
export function mobilityExerciseCounts(S, from, to) {
  const m = new Map()
  for (const s of mobilitySessionsOf(S)) {
    if (s.d < from || s.d > to) continue
    for (const i of s.items) {
      if (!i.done) continue
      const key = i.id || 'n:' + i.name.toLowerCase()
      const cur = m.get(key) || { key, ...(i.id ? { id: i.id } : { name: i.name }), times: 0 }
      cur.times++
      m.set(key, cur)
    }
  }
  return [...m.values()].sort((a, b) => b.times - a.times || a.key.localeCompare(b.key))
}

/** The range-of-motion readings for one exercise over time, oldest first, with the change from first to last. */
export function romSeries(S, key) {
  const pts = []
  for (const s of mobilitySessionsOf(S).slice().reverse()) {
    for (const i of s.items) {
      if (!i.rom || (i.id || 'n:' + i.name.toLowerCase()) !== key) continue
      pts.push({ d: s.d, v: i.rom.v, unit: i.rom.unit })
    }
  }
  const unit = pts.length ? pts[pts.length - 1].unit : null
  // Readings in another unit are not mixed into the change.
  const same = pts.filter(p => p.unit === unit)
  return { points: pts, unit, change: same.length >= 2 ? Math.round((same[same.length - 1].v - same[0].v) * 10) / 10 : null }
}
