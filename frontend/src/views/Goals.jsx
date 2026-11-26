import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { uid, todayISO, fmtNum, exerciseNameText } from '../lib/format.js'
import { EXIDX } from '../lib/exercises.js'
import { GOAL_TYPES, goalsOf, withGoal, goalProgress, rangeSummary, rangeFrom, RANGES } from '../lib/goals.js'
import { gt } from '../lib/goals-ui.js'
import { fmtDate } from '../lib/format.js'
import Icon from '../components/Icon.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { Button, Segmented, Stepper, TextField, Section, Row } from '../components/ui.jsx'
import { confirmSheet, exercisePicker } from '../sheets.jsx'

// Goals and Progress (Stats → More → Goals; lib/goals.js has the logic): your own targets, each
// shown against what you logged, and a summary of any range across training, mobility, food and
// body weight. Nothing is preset, and a week that did not reach is just that.

const ui = () => useUI.getState()
const exName = id => (EXIDX[id] ? exerciseNameText(EXIDX[id]) : id)
const WEEKLY_MAX = 7

function Chip({ on, onClick, children }) {
  return <button type="button" className={'chip nocap' + (on ? ' on' : '')} aria-pressed={!!on} onClick={onClick}>{children}</button>
}

function Bar({ pct, label }) {
  return <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}
    style={{ height: 8, borderRadius: 4, background: 'var(--fill, rgba(127,127,127,.2))', overflow: 'hidden', margin: '8px 0' }}>
    <div style={{ width: pct + '%', height: '100%', background: 'var(--accent, currentColor)' }} />
  </div>
}

function GoalSheet({ id = null, close }) {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const had = id ? goalsOf(S).find(g => g.id === id) : null
  const unit = S.unit === 'lb' ? 'lb' : 'kg'
  const [type, setType] = useState(had?.type || 'workouts')
  const [n, setN] = useState(had && had.type !== 'lift' ? had.target : 3)
  const [exId, setExId] = useState(had?.exId || null)
  const [w, setW] = useState(had?.type === 'lift' ? String(had.unit === unit ? had.target : Math.round(had.target * (unit === 'lb' ? 2.2046226218 : 1 / 2.2046226218) * 10) / 10) : '')
  const [note, setNote] = useState(had?.note || '')
  const lift = type === 'lift'
  const target = lift ? Number(String(w).replace(',', '.')) : n
  const ready = lift ? !!exId && target > 0 : true
  const save = () => {
    if (!ready) return
    const goal = { type, target, from: had?.from || todayISO(), note, ...(lift ? { exId, unit } : {}) }
    update(s => { s.goals = withGoal(s.goals, id || uid(), goal) })
    close(); ui().toast(gt('saved'))
  }
  const remove = () => confirmSheet({ title: gt('deleteGoal'), message: gt('type_' + had.type), confirmText: t('Delete'), danger: true,
    onConfirm: () => { update(s => { s.goals = withGoal(s.goals, id, null) }); close() } })
  return <>
    <h3>{had ? gt('editGoal') : gt('newGoal')}</h3>
    <div className="chips" style={{ flexWrap: 'wrap', margin: '8px 0 12px' }}>
      {GOAL_TYPES.map(x => <Chip key={x} on={type === x} onClick={() => !had && setType(x)}>{gt('type_' + x)}</Chip>)}
    </div>
    {type === 'meals' && <div className="muted small" style={{ marginBottom: 10 }}>{gt('typeHint_meals')}</div>}
    <div className="small muted" style={{ marginBottom: 6 }}>{gt('target')}</div>
    {lift ? <>
      <Button variant="tinted" size="sm" onClick={() => exercisePicker(ex => { setExId(ex.id) }, { title: gt('pickExercise') })}>{exId ? exName(exId) + ' · ' + gt('changeExercise') : gt('pickExercise')}</Button>
      <label className="small muted" style={{ display: 'block', marginTop: 12 }}>{gt('liftTarget', unit)}
        <TextField value={w} inputMode="decimal" onChange={e => setW(e.target.value)} aria-label={gt('liftTarget', unit)} /></label>
      {!exId && <div className="small muted" style={{ marginTop: 6 }}>{gt('noExercise')}</div>}
    </> : <Stepper value={n} min={1} max={WEEKLY_MAX} step={1} decimal={false} ariaLabel={gt('target')} onChange={setN} />}
    <label className="small muted" style={{ display: 'block', marginTop: 12 }}>{gt('note')}
      <TextField value={note} maxLength={200} onChange={e => setNote(e.target.value)} aria-label={gt('note')} /></label>
    <div className="row" style={{ gap: 8, marginTop: 16 }}>
      <Button variant="primary" disabled={!ready} onClick={save}>{t('Save')}</Button>
      {had && <Button variant="ghost" className="dim" onClick={remove}>{t('Delete')}</Button>}
      <Button variant="ghost" className="dim" onClick={close}>{gt('cancel')}</Button>
    </div>
  </>
}
const goalSheet = (id = null) => ui().openSheet(close => <GoalSheet id={id} close={close} />)

function GoalCard({ g, S, today }) {
  const p = goalProgress(S, g, today)
  const title = g.type === 'lift' ? exName(g.exId) : gt('type_' + g.type)
  const line = p.kind === 'lift'
    ? (p.current == null ? gt('liftNoData') : `${gt('liftNow', fmtNum(p.current) + ' ' + p.unit)} → ${fmtNum(p.target)} ${p.unit}`)
    : gt('thisWeek', p.done, p.target)
  return <div className="card" style={{ marginBottom: 12 }}>
    <Row title={title} subtitle={g.type === 'lift' ? gt('type_lift') : gt('perWeek', g.target)} value={p.reached ? gt('reached') : p.pct + '%'}
      accessory="chevron" onClick={() => goalSheet(g.id)} />
    <div style={{ padding: '0 14px 12px' }}>
      <Bar pct={p.pct} label={title} />
      <div className="small">{line}</div>
      {p.kind === 'lift' && p.baseline != null && <div className="muted small">{gt('liftStart', fmtNum(p.baseline) + ' ' + p.unit)}</div>}
      {p.kind === 'week' && <>
        <div className="muted small" style={{ marginTop: 8 }}>{gt('weeksHit')}</div>
        <div className="row" style={{ gap: 4, marginTop: 4 }} role="img" aria-label={p.weeks.map(x => x.count).join(', ')}>
          {p.weeks.map(x => <div key={x.from} title={fmtDate(x.from, true) + ': ' + x.count} style={{ flex: 1, height: 10, borderRadius: 2, background: x.hit ? 'var(--accent, currentColor)' : 'var(--fill, rgba(127,127,127,.25))' }} />)}
        </div>
      </>}
      {g.note && <div className="muted small" style={{ marginTop: 8 }}>{g.note}</div>}
    </div>
  </div>
}

function GoalsTab() {
  const S = useStore(s => s.S)
  const goals = useMemo(() => goalsOf(S), [S.goals])
  const today = todayISO()
  return <>
    {goals.length === 0 ? <EmptyState icon="target" text={gt('none')} /> : goals.map(g => <GoalCard key={g.id} g={g} S={S} today={today} />)}
    <Section><Row icon="plus" title={gt('newGoal')} onClick={() => goalSheet()} /></Section>
  </>
}

function ProgressTab() {
  const S = useStore(s => s.S)
  const [range, setRange] = useState('30d')
  const today = todayISO()
  const r = useMemo(() => rangeSummary(S, rangeFrom(range, today), today), [S.workouts, S.mobilitySessions, S.nutritionMeals, S.bodyweight, range])
  const any = r.workouts || r.mobilitySessions || r.foodDays || r.weight
  const stat = (label, v) => <div className="stat" style={{ flex: '1 1 40%' }}><div className="mono" style={{ fontSize: 22 }}>{v}</div><div className="small muted">{label}</div></div>
  return <>
    <div className="chips" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
      {RANGES.map(x => <Chip key={x} on={range === x} onClick={() => setRange(x)}>{gt('r' + x)}</Chip>)}
    </div>
    {!any ? <EmptyState icon="note" text={gt('nothing')} /> : <>
      <Section>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', padding: 12 }}>
          {stat(gt('workouts'), r.workouts)}{stat(gt('mobilitySessions'), r.mobilitySessions)}
          {stat(gt('mobilityMinutes'), r.mobilityMinutes)}{stat(gt('foodDays'), r.foodDays)}
        </div>
      </Section>
      <Section title={gt('weight')}>
        {r.weight ? <Row title={gt('weightChange', fmtNum(r.weight.from.w) + ' ' + S.unit, fmtNum(r.weight.to.w) + ' ' + S.unit, (r.weight.change > 0 ? '+' : '') + fmtNum(r.weight.change))}
          subtitle={fmtDate(r.weight.from.d, true) + ' → ' + fmtDate(r.weight.to.d, true)} />
          : <div className="muted small" style={{ padding: '10px 14px' }}>{gt('weightNone')}</div>}
      </Section>
    </>}
  </>
}

export default function Goals() {
  const nav = useNavigate()
  const [tab, setTab] = useState('goals')
  return <div className="narrow goals">
    <div className="hdr">
      <button className="iconbtn" data-back="/stats" onClick={() => nav('/stats')} aria-label={t('Stats')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginInlineStart: 12 }}><h1>{t('Goals')}</h1><div className="sub">{gt('subtitle')}</div></div>
    </div>
    <Segmented value={tab} onChange={setTab} options={[{ value: 'goals', label: gt('tabGoals') }, { value: 'progress', label: gt('tabProgress') }]} />
    <div style={{ height: 12 }} />
    {tab === 'goals' ? <GoalsTab /> : <ProgressTab />}
  </div>
}
