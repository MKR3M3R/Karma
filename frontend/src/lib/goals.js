// Personal goals and a summary over a range, counted from what the person logged.
//
//   S.goals = { '<id>': { type, target, exId?, unit?, from, note?, _ts }, … }   stamped like the other maps
//
//   type 'workouts'  target = workouts per week
//   type 'mobility'  target = days with a mobility session per week
//   type 'meals'     target = days with food logged per week (a habit goal: it never counts calories)
//   type 'lift'      target = an estimated 1RM for exercise `exId`, in `unit`
//
// The weight of a body is not a goal type here: Body already has the weight goal (S.targetW).
// A goal is the person's own number; nothing is set for them and a missed week is not a failure,
// it is a week that did not reach. Everything shown is computed, nothing is stored but the goal.
import { weekKey, weekStartOf } from './format.js'
import { e1rmSeries } from './onerm.js'
import { mealsOf } from './nutrition.js'
import { mobilitySessionsOf } from './mobility.js'

export const GOAL_TYPES = ['workouts', 'mobility', 'meals', 'lift']
export const MAX_NOTE = 200
const WEEKLY = { workouts: 7, mobility: 7, meals: 7 }
const LB_PER_KG = 2.2046226218
const ISO = /^\d{4}-\d{2}-\d{2}$/
const isMap = v => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max) : '')
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }

/** One stored goal read back, or null. Weekly targets are whole numbers 1 to 7; a lift target is a positive weight. */
export function readGoal(entry) {
  if (!isMap(entry) || !GOAL_TYPES.includes(entry.type) || !ISO.test(String(entry.from || ''))) return null
  const target = Number(entry.target)
  if (!Number.isFinite(target) || target <= 0) return null
  const out = { type: entry.type, from: entry.from }
  if (entry.type === 'lift') {
    if (typeof entry.exId !== 'string' || !entry.exId || target > 2000 || (entry.unit !== 'kg' && entry.unit !== 'lb')) return null
    Object.assign(out, { target: Math.round(target * 10) / 10, exId: entry.exId, unit: entry.unit })
  } else {
    const n = Math.round(target)
    if (n < 1 || n > WEEKLY[entry.type]) return null
    out.target = n
  }
  const note = text(entry.note, MAX_NOTE)
  if (note) out.note = note
  return out
}

/** Every goal, oldest first, as { id, ...goal }. */
export function goalsOf(S) {
  const map = isMap(S?.goals) ? S.goals : {}
  const out = []
  for (const [id, e] of Object.entries(map)) {
    const g = readGoal(e)
    if (g) out.push({ id, ...g, _ts: Number(e._ts) || 0 })
  }
  return out.sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : a._ts - b._ts))
}

/** The map with goal `id` set (or cleared with null), stamped `now`. */
export function withGoal(map, id, goal, now = Date.now()) {
  const clean = goal ? readGoal(goal) : null
  return { ...(isMap(map) ? map : {}), [id]: clean ? { ...clean, _ts: now } : { _ts: now } }
}

/* ----------------------------------------------------------- counting -- */

/** How many workouts, or days with a mobility session, or days with food, fall in [from, to]. */
export function countIn(S, type, from, to) {
  if (type === 'workouts') return (Array.isArray(S?.workouts) ? S.workouts : []).filter(w => w.d >= from && w.d <= to).length
  if (type === 'mobility') return new Set(mobilitySessionsOf(S).filter(s => s.d >= from && s.d <= to).map(s => s.d)).size
  if (type === 'meals') return new Set(mealsOf(S).filter(m => m.d >= from && m.d <= to).map(m => m.d)).size
  return 0
}

const clamp = n => Math.max(0, Math.min(100, Math.round(n)))
const inUnit = (value, from, to) => (from === to ? value : from === 'kg' ? value * LB_PER_KG : value / LB_PER_KG)

/**
 * Where goal `g` stands on `today`.
 *  weekly types: { kind: 'week', done, target, pct, reached, weeks: [{ from, count, hit }] }  (the last 8 weeks, oldest first, the current one last)
 *  lift:         { kind: 'lift', current, baseline, target, unit, pct, reached }  (current null with no estimate yet)
 */
export function goalProgress(S, g, today) {
  if (g.type === 'lift') {
    const unit = S?.unit === 'lb' ? 'lb' : 'kg'
    const target = Math.round(inUnit(g.target, g.unit, unit) * 10) / 10
    const pts = e1rmSeries(S, g.exId)
    const current = pts.length ? Math.max(...pts.map(p => p.y)) : null
    const before = pts.filter(p => p.d < g.from)
    const baseline = before.length ? Math.max(...before.map(p => p.y)) : pts.length ? pts[0].y : null
    const reached = current != null && current >= target
    let pct = 0
    if (reached) pct = 100
    else if (current != null && baseline != null && target > baseline) pct = clamp(((current - baseline) / (target - baseline)) * 100)
    return { kind: 'lift', current: current == null ? null : Math.round(current * 10) / 10, baseline: baseline == null ? null : Math.round(baseline * 10) / 10, target, unit, pct, reached }
  }
  const start = weekKey(today, weekStartOf(S))
  const weeks = []
  for (let i = 7; i >= 0; i--) {
    const from = addDays(start, -7 * i)
    const count = countIn(S, g.type, from, addDays(from, 6))
    weeks.push({ from, count, hit: count >= g.target })
  }
  const done = weeks[weeks.length - 1].count
  return { kind: 'week', done, target: g.target, pct: clamp((done / g.target) * 100), reached: done >= g.target, weeks }
}

/* ------------------------------------------------------------- range -- */

export const RANGES = ['7d', '30d', '90d', '6m', '1y', 'all']
const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '6m': 182, '1y': 365 }

/** The first day of `range` ending on `today` (inclusive): the last 7 days include today. 'all' starts at the dawn of time. */
export function rangeFrom(range, today) {
  return range in RANGE_DAYS ? addDays(today, -(RANGE_DAYS[range] - 1)) : '0000-01-01'
}

/**
 * What the range holds, counted from the logs: workouts, mobility sessions and minutes, days with
 * food logged, and the change in body weight between the first and last weigh-in in the range
 * (null with fewer than two weigh-ins, so one reading never reads as a trend).
 */
export function rangeSummary(S, from, to) {
  const sessions = mobilitySessionsOf(S).filter(s => s.d >= from && s.d <= to)
  const weighIns = (Array.isArray(S?.bodyweight) ? S.bodyweight : []).filter(b => b && b.d >= from && b.d <= to && Number(b.w) > 0)
    .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (a.t || 0) - (b.t || 0)))
  const first = weighIns[0], last = weighIns[weighIns.length - 1]
  return {
    workouts: countIn(S, 'workouts', from, to),
    mobilitySessions: sessions.length,
    mobilityMinutes: sessions.reduce((n, s) => n + s.min, 0),
    foodDays: countIn(S, 'meals', from, to),
    weight: weighIns.length >= 2 ? { from: { d: first.d, w: first.w }, to: { d: last.d, w: last.w }, change: Math.round((last.w - first.w) * 10) / 10 } : null,
  }
}
