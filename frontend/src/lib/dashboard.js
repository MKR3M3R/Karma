// What Home shows about the parts of Karma beyond the lifts (nutrition, mobility), counted from
// what the person logged and nothing else. A part shows only once it has been used (a record
// exists), so someone who only trains never sees an empty card asking them to do more, and
// nothing here is a target the app set: a target appears only when the person set one.
// Pure, one test beside it (dashboard.test.js).
import { dayOf, profileOf } from './nutrition.js'
import { mobilityTotals, mobilitySessionsOf } from './mobility.js'

const isMap = v => !!v && typeof v === 'object' && !Array.isArray(v)
const live = map => (isMap(map) ? Object.values(map).some(e => isMap(e) && Object.keys(e).some(k => k !== '_ts')) : false)

const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }

/** Whether the person has ever used nutrition (any food, meal, water or plan still there). */
export const nutritionUsed = S => live(S?.nutritionMeals) || live(S?.nutritionWater) || live(S?.nutritionFoods) || live(S?.nutritionPlans)
/** Whether the person has ever used mobility (any session or routine still there). */
export const mobilityUsed = S => live(S?.mobilitySessions) || live(S?.mobilityRoutines)

/**
 * The extras for `today` (YYYY-MM-DD):
 *   nutrition: null | { kcal, p, water, logged, targets: { kcal?, p?, water? } }
 *   mobility:  null | { today (sessions today), days (days with a session in the last 7), last (ISO of the latest session or null) }
 *   windDown:  a workout is logged today, mobility is in use and none was done today
 */
export function todaySummary(S, today) {
  let nutrition = null
  if (nutritionUsed(S)) {
    const day = dayOf(S, today), prof = profileOf(S), targets = {}
    for (const k of ['kcal', 'p', 'water']) if (prof[k]) targets[k] = prof[k]
    nutrition = { kcal: day.totals.kcal, p: day.totals.p, water: day.water, logged: day.logged, targets }
  }
  let mobility = null, windDown = false
  if (mobilityUsed(S)) {
    const sessions = mobilitySessionsOf(S)
    const t = mobilityTotals(S, addDays(today, -6), today)
    const todayN = sessions.filter(s => s.d === today).length
    mobility = { today: todayN, days: t.days, last: sessions[0]?.d || null }
    const trained = Array.isArray(S?.workouts) && S.workouts.some(w => w.d === today)
    windDown = trained && todayN === 0
  }
  return { nutrition, mobility, windDown }
}
