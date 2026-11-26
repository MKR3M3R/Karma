import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { todayISO, fmtDate } from '../lib/format.js'
import { todaySummary } from '../lib/dashboard.js'
import { dt } from '../lib/dashboard-ui.js'
import { nt } from '../lib/nutrition-ui.js'
import CardHead from './CardHead.jsx'
import { Row } from './ui.jsx'

// Home's card for the parts of Karma beyond the lifts. It only exists once nutrition or mobility
// has been used (lib/dashboard.js), shows what was logged and the targets the person set, and
// never scolds: an empty day reads "Nothing logged today".
export default function KarmaToday() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const { nutrition: n, mobility: m, windDown } = todaySummary(S, todayISO())
  if (!n && !m) return null
  const kcal = n && (n.targets.kcal ? `${n.kcal} ${nt('kcal')} ${dt('ofTarget', n.targets.kcal)}` : `${n.kcal} ${nt('kcal')}`)
  const water = n && n.water > 0 && (n.targets.water ? `${n.water} ${dt('ofTarget', n.targets.water)} ml` : `${n.water} ml`)
  return <div className="card karma-today">
    <CardHead icon="heart" tint="var(--green)" eyebrow={dt('eyebrow')} title={dt('title')} />
    {n && <Row title={dt('meals')} subtitle={n.logged || water ? [n.logged && kcal, water && dt('water') + ' ' + water].filter(Boolean).join(' · ') : dt('mealsNone')}
      accessory="chevron" onClick={() => nav('/nutrition')} />}
    {m && <Row title={dt('mobility')} subtitle={m.today ? dt('mobilityToday') : dt('mobilityWeek', m.days) + (m.last ? ' · ' + dt('mobilityLast', fmtDate(m.last, true)) : '')}
      accessory="chevron" onClick={() => nav('/mobility')} />}
    {windDown && <Row icon="stretch" title={dt('windDown')} subtitle={dt('windDownSub')} accessory="chevron" onClick={() => nav('/mobility')} />}
  </div>
}
