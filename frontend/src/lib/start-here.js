// A light, optional start: pick the parts of Karma you want to use, and Home points at the ones
// you have not tried yet until you have, or until you put the card away. Nothing is collected
// that you did not choose: no body data, no profile fields. Choosing an experience level only
// sets the level mobility suggestions use, and only if you pick one.
//
//   S.startHere = { areas: ['training'|'mobility'|'nutrition'|'goals', …], dismissed?: true }   a plain setting
import { nutritionUsed, mobilityUsed } from './dashboard.js'
import { goalsOf } from './goals.js'

export const AREAS = [
  { id: 'training', path: '/plan' },
  { id: 'mobility', path: '/mobility' },
  { id: 'nutrition', path: '/nutrition' },
  { id: 'goals', path: '/goals' },
]
export const AREA_IDS = AREAS.map(a => a.id)
export const LEVELS = ['beginner', 'intermediate', 'advanced']
// A profile with this many workouts already knows its way around: it is never asked unprompted.
export const ESTABLISHED_WORKOUTS = 5

const isMap = v => !!v && typeof v === 'object' && !Array.isArray(v)

/** The setting read back: { answered, areas, dismissed }. `answered` is false until the person has chosen or said "not now". */
export function startHereOf(S) {
  const raw = isMap(S?.startHere) ? S.startHere : null
  if (!raw) return { answered: false, areas: [], dismissed: false }
  const areas = [...new Set((Array.isArray(raw.areas) ? raw.areas : []).filter(a => AREA_IDS.includes(a)))]
  return { answered: true, areas, dismissed: raw.dismissed === true }
}

/** Whether an area has been used (so it needs no pointing at). */
export function areaUsed(S, id) {
  if (id === 'training') return (Array.isArray(S?.workouts) && S.workouts.length > 0) || (Array.isArray(S?.routines) && S.routines.length > 0)
  if (id === 'mobility') return mobilityUsed(S)
  if (id === 'nutrition') return nutritionUsed(S)
  if (id === 'goals') return goalsOf(S).length > 0
  return true
}

/** What the Home card should do: 'ask' (never answered, not an established profile), 'point' (chosen areas not yet used), or null. */
export function startHereState(S) {
  const s = startHereOf(S)
  if (!s.answered) return Array.isArray(S?.workouts) && S.workouts.length >= ESTABLISHED_WORKOUTS ? null : { mode: 'ask' }
  if (s.dismissed) return null
  const pending = s.areas.filter(a => !areaUsed(S, a))
  return pending.length ? { mode: 'point', pending } : null
}

/** The setting for a choice of areas (and a clean slate for "dismissed"). */
export const startHereWith = (areas, dismissed = false) => ({ areas: [...new Set((areas || []).filter(a => AREA_IDS.includes(a)))], ...(dismissed ? { dismissed: true } : {}) })
