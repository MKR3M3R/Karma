import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { getLang } from '../lib/i18n-core.js'
import { uid, todayISO, fmtDate } from '../lib/format.js'
import { tappable } from '../lib/use-sheet-keyboard.js'
import {
  MOBILITY_EXERCISES, MOBILITY_CATEGORIES, MOBILITY_REGIONS, MOBILITY_LEVELS, mobilityText, mobilityExercise,
} from '../lib/mobility-library.js'
import {
  ROUTINE_PRESETS, presetItems, suggestItems, doseOf, routineMinutes,
  mobilityRoutinesOf, withMobilityRoutine, mobilitySessionsOf, withMobilitySession,
  mobilityTotals, mobilityWeeks, mobilityExerciseCounts, romSeries, MAX_ITEMS, EFFORT_MIN, EFFORT_MAX,
} from '../lib/mobility.js'
import { mt } from '../lib/mobility-ui.js'
import Icon from '../components/Icon.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { Button, Segmented, Stepper, TextField, TextArea, Section, Row } from '../components/ui.jsx'
import { confirmSheet } from '../sheets.jsx'

// Mobility (Stats → More → Mobility; lib/mobility.js has the logic, lib/mobility-library.js the
// exercises): ready-made and own routines, a library to browse, a runner that logs a session, and
// what the sessions add up to. Nothing here needs a profile: the preferences only shape suggestions.

const ui = () => useUI.getState()
const lang = () => getLang()

/* ------------------------------------------------------------ helpers -- */

const itemName = i => (i.id ? mobilityText(mobilityExercise(i.id), lang()).name : i.name)
const doseLabel = item => {
  const d = doseOf(item)
  const one = d.sec ? mt('sec', d.sec) : mt('reps', d.reps)
  return [d.sets > 1 ? mt('sets', d.sets) + ' · ' : '', one, d.sides ? ' · ' + mt('eachSide') : ''].join('')
}
const profileOf = S => {
  const p = S.mobilityProfile && typeof S.mobilityProfile === 'object' ? S.mobilityProfile : {}
  return {
    level: MOBILITY_LEVELS.includes(p.level) ? p.level : 'beginner',
    minutes: Number.isFinite(p.minutes) && p.minutes >= 3 && p.minutes <= 60 ? Math.round(p.minutes) : 10,
    focus: (Array.isArray(p.focus) ? p.focus : []).filter(r => MOBILITY_REGIONS.includes(r)),
    avoid: (Array.isArray(p.avoid) ? p.avoid : []).filter(r => MOBILITY_REGIONS.includes(r)),
  }
}
const suggestOpts = S => { const p = profileOf(S); return { level: p.level, minutes: p.minutes, regions: p.focus, avoid: p.avoid } }
const toggle = (list, v) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v])

function Chip({ on, onClick, children }) {
  return <button type="button" className={'chip nocap' + (on ? ' on' : '')} aria-pressed={!!on} onClick={onClick}>{children}</button>
}

/* ------------------------------------------------------- exercise sheet -- */

function ExerciseSheet({ ex, close, onAdd }) {
  const x = mobilityText(ex, lang())
  const list = (title, items) => <div style={{ marginTop: 12 }}>
    <div className="small muted">{title}</div>
    <ul style={{ margin: '4px 0 0', paddingInlineStart: 18, lineHeight: 1.5 }}>{items.map((s, i) => <li key={i}>{s}</li>)}</ul>
  </div>
  return <>
    <h3>{x.name}</h3>
    <div className="muted small" style={{ marginBottom: 8 }}>
      {[mt('cat.' + ex.cat), ex.regions.map(r => mt('reg.' + r)).join(', '), mt('lvl.' + ex.level)].join(' · ')}
    </div>
    <p style={{ margin: '0 0 6px', lineHeight: 1.5 }}>{x.description}</p>
    <div className="small muted">{mt('startPos')}</div>
    <p style={{ margin: '2px 0 0', lineHeight: 1.5 }}>{x.start}</p>
    <div className="small" style={{ marginTop: 8 }}><b>{doseLabel({ id: ex.id })}</b></div>
    {list(mt('steps'), x.steps)}
    {list(mt('mistakes'), x.mistakes)}
    <div style={{ marginTop: 12 }}><div className="small muted">{mt('caution')}</div><p style={{ margin: '2px 0 0', lineHeight: 1.5 }}>{x.caution}</p></div>
    <div style={{ marginTop: 12 }}><div className="small muted">{mt('easier')}</div><p style={{ margin: '2px 0 0', lineHeight: 1.5 }}>{x.easier}</p></div>
    <div style={{ marginTop: 12 }}><div className="small muted">{mt('harder')}</div><p style={{ margin: '2px 0 0', lineHeight: 1.5 }}>{x.harder}</p></div>
    <div className="row" style={{ gap: 8, marginTop: 16 }}>
      {onAdd && <Button variant="tinted" onClick={() => { onAdd(ex); close() }}>{mt('addToRoutine')}</Button>}
      <Button variant="ghost" className="dim" onClick={close}>{t('Done')}</Button>
    </div>
  </>
}
const exerciseSheet = (ex, onAdd) => ui().openSheet(close => <ExerciseSheet ex={ex} close={close} onAdd={onAdd} />)

/* ----------------------------------------------------------- the picker -- */

// Pick exercises from the library for a routine: tap to add, the sheet stays open.
function PickerSheet({ taken, onPick, close }) {
  const [region, setRegion] = useState(null)
  const [q, setQ] = useState('')
  const list = MOBILITY_EXERCISES.filter(e => (!region || e.regions.includes(region))
    && (!q || mobilityText(e, lang()).name.toLowerCase().includes(q.toLowerCase())))
  return <>
    <h3>{mt('addExercises')}</h3>
    <TextField value={q} onChange={e => setQ(e.target.value)} placeholder={t('Search')} aria-label={t('Search')} />
    <div className="chips" style={{ flexWrap: 'wrap', margin: '10px 0' }}>
      <Chip on={!region} onClick={() => setRegion(null)}>{mt('allAreas')}</Chip>
      {MOBILITY_REGIONS.map(r => <Chip key={r} on={region === r} onClick={() => setRegion(r)}>{mt('reg.' + r)}</Chip>)}
    </div>
    <div className="list">{list.map(e => {
      const on = taken.has(e.id)
      return <div key={e.id} className="item" {...tappable(() => onPick(e))}>
        <div className="grow"><div className="tt">{mobilityText(e, lang()).name}</div><div className="ss">{mt('cat.' + e.cat)} · {doseLabel({ id: e.id })}</div></div>
        <Icon name={on ? 'check' : 'plus'} />
      </div>
    })}</div>
    {!list.length && <div className="empty small">{mt('noMatch')}</div>}
    <div style={{ height: 10 }} />
    <Button variant="primary" onClick={close}>{t('Done')}</Button>
  </>
}

/* ------------------------------------------------------- routine editor -- */

function RoutineSheet({ id = null, start = null, close }) {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const toast = useUI(s => s.toast)
  const had = id ? mobilityRoutinesOf(S).find(r => r.id === id) : null
  const [name, setName] = useState(had?.name || start?.name || '')
  const [items, setItems] = useState(had?.items || start?.items || [])
  const move = (i, d) => setItems(list => { const a = [...list]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a })
  const setDose = (i, patch) => setItems(list => list.map((it, k) => (k === i ? { ...it, ...patch } : it)))
  const taken = new Set(items.map(i => i.id).filter(Boolean))
  const add = ex => setItems(list => (list.some(i => i.id === ex.id) || list.length >= MAX_ITEMS ? list.filter(i => i.id !== ex.id) : [...list, { id: ex.id }]))
  const save = () => {
    if (!name.trim() || !items.length) return
    update(s => { s.mobilityRoutines = withMobilityRoutine(s.mobilityRoutines, id || uid(), { name: name.trim(), items }) })
    close()
    toast(t('Saved'))
  }
  const remove = () => confirmSheet({
    title: mt('confirmDelete'), message: name, confirmText: t('Delete'), danger: true,
    onConfirm: () => { update(s => { s.mobilityRoutines = withMobilityRoutine(s.mobilityRoutines, id, null) }); close() },
  })
  return <>
    <h3>{had ? mt('editRoutine') : mt('newRoutine')}</h3>
    <TextField value={name} onChange={e => setName(e.target.value)} placeholder={mt('routineName')} aria-label={mt('routineName')} maxLength={80} />
    <div className="muted small" style={{ margin: '8px 0' }}>{items.length ? mt('exercisesN', items.length) + ' · ' + mt('about', routineMinutes(items)) : mt('empty')}</div>
    <div className="list">{items.map((it, i) => {
      const d = doseOf(it)
      return <div key={(it.id || it.name) + i} className="item" style={{ alignItems: 'flex-start' }}>
        <div className="grow">
          <div className="tt">{itemName(it)}</div>
          <div className="row" style={{ gap: 8, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <Stepper value={d.sec || d.reps} min={1} max={d.sec ? 1800 : 200} step={d.sec ? 5 : 1} decimal={false}
              unit={d.sec ? t('sec') : t('reps')} ariaLabel={d.sec ? t('sec') : t('reps')}
              onChange={v => setDose(i, d.sec ? { sec: v, reps: undefined } : { reps: v, sec: undefined })} />
            <Stepper value={d.sets} min={1} max={10} step={1} decimal={false} unit="×" ariaLabel={mt('sets', d.sets)} onChange={v => setDose(i, { sets: v })} />
          </div>
        </div>
        <div className="row" style={{ gap: 2 }}>
          <button type="button" className="iconbtn" aria-label={mt('up')} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="chevronUp" /></button>
          <button type="button" className="iconbtn" aria-label={mt('down')} disabled={i === items.length - 1} onClick={() => move(i, 1)}><Icon name="chevronDown" /></button>
          <button type="button" className="iconbtn" aria-label={mt('remove')} onClick={() => setItems(list => list.filter((_, k) => k !== i))}><Icon name="trash" /></button>
        </div>
      </div>
    })}</div>
    <div className="row" style={{ gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
      <Button variant="tinted" size="sm" icon="plus" onClick={() => ui().openSheet(c => <PickerSheet taken={taken} onPick={add} close={c} />)}>{mt('addExercises')}</Button>
      <Button variant="tinted" size="sm" icon="sparkles" onClick={() => setItems(suggestItems(suggestOpts(S)))}>{mt('suggest')}</Button>
    </div>
    <div className="row" style={{ gap: 8 }}>
      <Button variant="primary" onClick={save} disabled={!name.trim() || !items.length}>{t('Save')}</Button>
      {had && <Button variant="ghost" className="dim" onClick={remove}>{t('Delete')}</Button>}
    </div>
  </>
}
const routineSheet = (props = {}) => ui().openSheet(close => <RoutineSheet {...props} close={close} />)

/* --------------------------------------------------------------- runner -- */

// One exercise at a time: read it, do it (a hold has a countdown), mark it done or skip it, then
// say how hard it felt and save. Only what was done is counted.
function RunSheet({ routine, close }) {
  const update = useStore(s => s.update)
  const toast = useUI(s => s.toast)
  const items = routine.items
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(() => items.map(() => null))   // null = not decided, true/false
  const [rom, setRom] = useState(() => items.map(() => ({ v: '', unit: 'deg' })))
  const [effort, setEffort] = useState(null)
  const [note, setNote] = useState('')
  const startedAt = useRef(Date.now())
  const [left, setLeft] = useState(null)
  const finished = step >= items.length
  const it = items[step]
  const d = it ? doseOf(it) : null

  // A hold counts down; it never starts by itself, and it stops when the exercise changes.
  useEffect(() => { setLeft(null) }, [step])
  useEffect(() => {
    if (left == null || left <= 0) return undefined
    const h = setTimeout(() => setLeft(l => (l == null ? l : l - 1)), 1000)
    return () => clearTimeout(h)
  }, [left])

  const decide = ok => { setDone(a => a.map((v, i) => (i === step ? ok : v))); setStep(s => s + 1) }
  const romOf = i => { const r = rom[i]; const v = Number(r.v); return done[i] && Number.isFinite(v) && v > 0 ? { v, unit: r.unit } : undefined }
  const anyDone = done.some(Boolean)

  const save = () => {
    if (!anyDone) return
    const mins = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000), Math.round(routineMinutes(items.filter((_, i) => done[i])) / 2))
    const session = {
      d: todayISO(), min: mins, routineId: routine.id || undefined, routineName: routine.name, effort: effort || undefined, note,
      items: items.map((x, i) => ({ ...x, done: !!done[i], rom: romOf(i) })),
    }
    update(s => { s.mobilitySessions = withMobilitySession(s.mobilitySessions, uid(), session) })
    close()
    toast(mt('saved'))
  }

  if (!finished) {
    const x = it.id ? mobilityText(mobilityExercise(it.id), lang()) : null
    return <>
      <div className="muted small">{mt('stepOf', step + 1, items.length)} · {routine.name}</div>
      <h3 style={{ margin: '4px 0 8px' }}>{itemName(it)}</h3>
      <div className="small"><b>{doseLabel(it)}</b></div>
      {x && <>
        <p style={{ margin: '8px 0 4px', lineHeight: 1.5 }}>{x.start}</p>
        <ul style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.5 }}>{x.steps.map((s, i) => <li key={i}>{s}</li>)}</ul>
        <p className="muted small" style={{ marginTop: 8 }}>{x.caution}</p>
      </>}
      {d.sec && <div className="row" style={{ gap: 10, alignItems: 'center', margin: '12px 0' }}>
        <div className="mono" style={{ fontSize: 28, minWidth: 64 }} aria-live="off">{left == null ? d.sec : left}</div>
        <Button variant="tinted" size="sm" icon="timer" onClick={() => setLeft(d.sec)}>{mt('hold')}</Button>
      </div>}
      <div className="row" style={{ gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={() => decide(true)}>{mt('markDone')}</Button>
        <Button variant="ghost" className="dim" onClick={() => decide(false)}>{mt('skip')}</Button>
        {step > 0 && <Button variant="ghost" className="dim" onClick={() => setStep(s => s - 1)}>{t('Back')}</Button>}
        <Button variant="ghost" className="dim" onClick={close}>{mt('cancel')}</Button>
      </div>
    </>
  }

  const doneIdx = items.map((_, i) => i).filter(i => done[i])
  return <>
    <h3>{routine.name}</h3>
    <div className="muted small" style={{ marginBottom: 10 }}>{mt('exercisesN', doneIdx.length)}</div>
    {!anyDone && <div className="small" style={{ marginBottom: 10 }}>{mt('noneDone')}</div>}
    <div className="small muted">{mt('howHard')}</div>
    <div className="chips" style={{ flexWrap: 'wrap', margin: '6px 0 12px' }}>
      {Array.from({ length: EFFORT_MAX - EFFORT_MIN + 1 }, (_, k) => k + EFFORT_MIN).map(n =>
        <Chip key={n} on={effort === n} onClick={() => setEffort(effort === n ? null : n)}>{mt('e' + n)}</Chip>)}
    </div>
    {doneIdx.length > 0 && <details style={{ marginBottom: 12 }}>
      <summary className="small muted" style={{ cursor: 'pointer' }}>{mt('rom')}</summary>
      <div className="muted small" style={{ margin: '6px 0' }}>{mt('romHint')}</div>
      {doneIdx.map(i => <div key={i} className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <div className="grow small">{itemName(items[i])}</div>
        <TextField inputMode="decimal" style={{ width: 90 }} value={rom[i].v} placeholder={mt('value')} aria-label={mt('value') + ' ' + itemName(items[i])}
          onChange={e => setRom(a => a.map((r, k) => (k === i ? { ...r, v: e.target.value.replace(',', '.') } : r)))} />
        <select value={rom[i].unit} aria-label={mt('rom')} onChange={e => setRom(a => a.map((r, k) => (k === i ? { ...r, unit: e.target.value } : r)))}>
          <option value="deg">{mt('unitDeg')}</option><option value="cm">{mt('unitCm')}</option><option value="in">{mt('unitIn')}</option>
        </select>
      </div>)}
    </details>}
    <TextArea value={note} onChange={e => setNote(e.target.value)} placeholder={mt('note')} aria-label={mt('note')} rows={2} maxLength={500} />
    <div className="row" style={{ gap: 8, marginTop: 14 }}>
      <Button variant="primary" onClick={save} disabled={!anyDone}>{mt('finish')}</Button>
      <Button variant="ghost" className="dim" onClick={() => setStep(0)}>{t('Back')}</Button>
      <Button variant="ghost" className="dim" onClick={close}>{mt('cancel')}</Button>
    </div>
  </>
}
const runRoutine = routine => ui().openSheet(close => <RunSheet routine={routine} close={close} />, { locked: true })

/* ---------------------------------------------------------- preferences -- */

function PreferencesSheet({ close }) {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const [p, setP] = useState(() => profileOf(S))
  const save = () => { update(s => { s.mobilityProfile = p }); close(); ui().toast(t('Saved')) }
  const regionChips = (key, other) => <div className="chips" style={{ flexWrap: 'wrap', margin: '6px 0 12px' }}>
    {MOBILITY_REGIONS.map(r => <Chip key={r} on={p[key].includes(r)} onClick={() => setP(q => ({ ...q, [key]: toggle(q[key], r), [other]: q[other].filter(x => x !== r) }))}>{mt('reg.' + r)}</Chip>)}
  </div>
  return <>
    <h3>{mt('profile')}</h3>
    <div className="muted small" style={{ marginBottom: 12 }}>{mt('profileHint')}</div>
    <div className="small muted" style={{ marginBottom: 6 }}>{mt('level')}</div>
    <Segmented options={MOBILITY_LEVELS.map(l => ({ value: l, label: mt('lvl.' + l) }))} value={p.level} onChange={level => setP(q => ({ ...q, level }))} />
    <div className="small muted" style={{ margin: '12px 0 6px' }}>{mt('time')}</div>
    <Stepper value={p.minutes} min={3} max={60} step={1} decimal={false} unit={t('min')} ariaLabel={mt('time')} onChange={minutes => setP(q => ({ ...q, minutes }))} />
    <div className="small muted" style={{ margin: '12px 0 0' }}>{mt('focus')}</div>
    {regionChips('focus', 'avoid')}
    <div className="small muted">{mt('avoid')}</div>
    <div className="muted small">{mt('avoidHint')}</div>
    {regionChips('avoid', 'focus')}
    <div className="row" style={{ gap: 8 }}>
      <Button variant="primary" onClick={save}>{t('Save')}</Button>
      <Button variant="ghost" className="dim" onClick={close}>{mt('cancel')}</Button>
    </div>
  </>
}

/* ---------------------------------------------------------------- tabs -- */

function RoutinesTab() {
  const S = useStore(s => s.S)
  const mine = useMemo(() => mobilityRoutinesOf(S), [S.mobilityRoutines])
  const opts = suggestOpts(S)
  const fromPreset = p => routineSheet({ start: { name: mt('preset.' + p.key), items: presetItems(p.key, opts) } })
  return <>
    <Section title={mt('mine')}>
      {mine.length === 0 && <div className="muted small" style={{ padding: '10px 14px' }}>{mt('mineEmpty')}</div>}
      {mine.map(r => <Row key={r.id} icon="stretch" title={r.name} subtitle={mt('exercisesN', r.items.length) + ' · ' + mt('about', routineMinutes(r.items))}
        accessory="chevron" onClick={() => runRoutine(r)}>
        <button type="button" className="iconbtn" aria-label={mt('editRoutine') + ': ' + r.name} onClick={e => { e.stopPropagation(); routineSheet({ id: r.id }) }}><Icon name="pencil" /></button>
      </Row>)}
      <Row icon="plus" title={mt('newRoutine')} onClick={() => routineSheet()} />
    </Section>
    <Section title={mt('ready')}>
      {ROUTINE_PRESETS.map(p => {
        const items = presetItems(p.key, opts)
        return <Row key={p.key} icon="sparkles" title={mt('preset.' + p.key)} subtitle={items.length ? mt('exercisesN', items.length) + ' · ' + mt('about', routineMinutes(items)) : mt('empty')}
          accessory="chevron" onClick={() => items.length && runRoutine({ name: mt('preset.' + p.key), items })}>
          {items.length > 0 && <button type="button" className="iconbtn" aria-label={mt('fromPreset', mt('preset.' + p.key))} onClick={e => { e.stopPropagation(); fromPreset(p) }}><Icon name="pencil" /></button>}
        </Row>
      })}
    </Section>
    <Section><Row icon="slider" title={mt('profile')} accessory="chevron" onClick={() => ui().openSheet(close => <PreferencesSheet close={close} />)} /></Section>
  </>
}

function LibraryTab() {
  const [region, setRegion] = useState(null)
  const [cat, setCat] = useState(null)
  const [level, setLevel] = useState(null)
  const list = MOBILITY_EXERCISES.filter(e => (!region || e.regions.includes(region)) && (!cat || e.cat === cat) && (!level || e.level === level))
  const row = (all, items, cur, set, label) => <div className="chips" role="group" style={{ flexWrap: 'wrap', margin: '0 0 8px' }}>
    <Chip on={!cur} onClick={() => set(null)}>{all}</Chip>
    {items.map(v => <Chip key={v} on={cur === v} onClick={() => set(cur === v ? null : v)}>{label(v)}</Chip>)}
  </div>
  return <>
    {row(mt('allAreas'), MOBILITY_REGIONS, region, setRegion, v => mt('reg.' + v))}
    {row(mt('allTypes'), MOBILITY_CATEGORIES, cat, setCat, v => mt('cat.' + v))}
    {row(mt('allLevels'), MOBILITY_LEVELS, level, setLevel, v => mt('lvl.' + v))}
    {list.length === 0 ? <div className="empty small">{mt('noMatch')}</div>
      : <div className="list">{list.map(e => <div key={e.id} className="item" {...tappable(() => exerciseSheet(e))}>
        <div className="grow"><div className="tt">{mobilityText(e, lang()).name}</div>
          <div className="ss">{mt('cat.' + e.cat)} · {e.regions.map(r => mt('reg.' + r)).join(', ')}</div></div>
        <Icon name="chevronRight" />
      </div>)}</div>}
  </>
}

function ProgressTab() {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const today = todayISO()
  const sessions = useMemo(() => mobilitySessionsOf(S), [S.mobilitySessions])
  const monthFrom = today.slice(0, 8) + '01'
  const weekFrom = (() => { const d = new Date(today + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - 6); return d.toISOString().slice(0, 10) })()
  const week = mobilityTotals(S, weekFrom, today), month = mobilityTotals(S, monthFrom, today)
  const weeks = mobilityWeeks(S, today, 8)
  const counts = mobilityExerciseCounts(S, '0000-01-01', today).slice(0, 6)
  const romKeys = useMemo(() => {
    const keys = new Map()
    for (const s of sessions) for (const i of s.items) if (i.rom) keys.set(i.id || 'n:' + i.name.toLowerCase(), i.id ? itemName(i) : i.name)
    return [...keys]
  }, [sessions])
  const [romKey, setRomKey] = useState(null)
  const rk = romKey && romKeys.some(([k]) => k === romKey) ? romKey : romKeys[0]?.[0]
  const series = rk ? romSeries(S, rk) : null
  if (!sessions.length) return <EmptyState icon="stretch" text={mt('noSessions')} />
  const max = Math.max(1, ...weeks.map(w => w.days))
  const stat = (label, v) => <div className="stat" style={{ flex: '1 1 40%' }}><div className="mono" style={{ fontSize: 22 }}>{v}</div><div className="small muted">{label}</div></div>
  const unitLabel = u => ({ deg: mt('unitDeg'), cm: mt('unitCm'), in: mt('unitIn') }[u] || u)
  const remove = s => confirmSheet({ title: mt('deleteSession'), message: fmtDate(s.d, true), confirmText: t('Delete'), danger: true,
    onConfirm: () => update(x => { x.mobilitySessions = withMobilitySession(x.mobilitySessions, s.id, null) }) })
  return <>
    <Section title={mt('week')}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', padding: 12 }}>
        {stat(mt('sessions'), week.sessions)}{stat(mt('minutes'), week.minutes)}{stat(mt('days'), week.days)}{stat(mt('exercisesDone'), week.exercises)}
      </div>
    </Section>
    <Section title={mt('month')}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', padding: 12 }}>
        {stat(mt('sessions'), month.sessions)}{stat(mt('minutes'), month.minutes)}{stat(mt('days'), month.days)}
        {stat(mt('avgEffort'), month.effort == null ? '–' : month.effort)}
      </div>
    </Section>
    <Section title={mt('daysWeek', weeks.length)}>
      <div className="row" style={{ gap: 6, alignItems: 'flex-end', height: 90, padding: '12px 14px' }} role="img"
        aria-label={weeks.map(w => w.days).join(', ')}>
        {weeks.map(w => <div key={w.to} className="grow" style={{ textAlign: 'center' }}>
          <div style={{ height: Math.max(3, (w.days / max) * 56), background: 'var(--accent, currentColor)', opacity: w.days ? 1 : 0.2, borderRadius: 3 }} />
          <div className="small muted">{w.days}</div>
        </div>)}
      </div>
    </Section>
    {counts.length > 0 && <Section title={mt('mostDone')}>
      {counts.map(c => <Row key={c.key} title={c.id ? itemName({ id: c.id }) : c.name} value={'×' + c.times} />)}
    </Section>}
    {series && series.points.length > 0 && <Section title={mt('romTitle')}>
      <div className="chips" style={{ flexWrap: 'wrap', padding: '10px 12px 0' }}>
        {romKeys.map(([k, n]) => <Chip key={k} on={k === rk} onClick={() => setRomKey(k)}>{n}</Chip>)}
      </div>
      {series.points.map((p, i) => <Row key={i} title={fmtDate(p.d, true)} value={p.v + ' ' + unitLabel(p.unit)} />)}
      {series.change != null && <div className="muted small" style={{ padding: '8px 14px' }}>{mt('romChange', (series.change > 0 ? '+' : '') + series.change, unitLabel(series.unit))}</div>}
    </Section>}
    <Section title={mt('history')}>
      {sessions.slice(0, 20).map(s => <Row key={s.id} icon="stretch" title={s.routineName || mt('tabRoutines')}
        subtitle={fmtDate(s.d, true) + ' · ' + t('{0} min', s.min) + (s.effort ? ' · ' + mt('e' + s.effort) : '')}
        onClick={() => remove(s)} />)}
    </Section>
  </>
}

/* ---------------------------------------------------------------- view -- */

export default function Mobility() {
  const nav = useNavigate()
  const [tab, setTab] = useState('routines')
  return <div className="narrow mobility">
    <div className="hdr">
      <button className="iconbtn" data-back="/stats" onClick={() => nav('/stats')} aria-label={t('Stats')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginInlineStart: 12 }}><h1>{t('Mobility')}</h1><div className="sub">{mt('subtitle')}</div></div>
    </div>
    <div className="muted small" role="note" style={{ margin: '0 0 12px', lineHeight: 1.45 }}>{mt('notice')}</div>
    <Segmented value={tab} onChange={setTab} options={[
      { value: 'routines', label: mt('tabRoutines') }, { value: 'library', label: mt('tabLibrary') }, { value: 'progress', label: mt('tabProgress') },
    ]} />
    <div style={{ height: 12 }} />
    {tab === 'routines' && <RoutinesTab />}
    {tab === 'library' && <LibraryTab />}
    {tab === 'progress' && <ProgressTab />}
  </div>
}
