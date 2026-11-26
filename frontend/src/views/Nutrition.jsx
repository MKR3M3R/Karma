import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { getLang } from '../lib/i18n-core.js'
import { uid, todayISO, fmtDate } from '../lib/format.js'
import { tappable } from '../lib/use-sheet-keyboard.js'
import { MOBILE, shareExport } from '../lib/mobile.js'
import { foodName, REFERENCE_FOODS } from '../lib/nutrition-foods.js'
import { api } from '../lib/api.js'
import {
  SLOTS, GOALS, DIETS, foodsOf, withFood, foodProblem, searchFoods, itemFromFood, macrosOf, sumMacros,
  mealsOf, withMeal, dayOf, waterOf, addWater, profileOf, dayProgress, nutritionDays, nutritionAverages,
  plansOf, withPlan, planTotals, planToMeals, shoppingList, shoppingText, exportNutrition, nutritionCSV, avoidHit, clearedNutrition,
} from '../lib/nutrition.js'
import { nt } from '../lib/nutrition-ui.js'
import Icon from '../components/Icon.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { Button, Segmented, Stepper, TextField, Section, Row } from '../components/ui.jsx'
import { confirmSheet } from '../sheets.jsx'

// Nutrition (Stats → More → Nutrition; lib/nutrition.js has the logic, lib/nutrition-foods.js the
// reference foods): a diary of meals, water, your own foods, plans with a shopping list, and what
// the days add up to. Everything is optional: no profile, no targets, no goal are needed, and no
// number here is ever a verdict on a day.

const ui = () => useUI.getState()
const lang = () => getLang()

const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const baseLabel = b => (b === 'ml' ? nt('ml') : 'g')
const macroLine = m => `${m.kcal} ${nt('kcal')} · P ${m.p} · C ${m.c} · F ${m.f}${m.fiber != null ? ' · ' + nt('fiberShort', m.fiber) : ''}`
const num = s => { const n = Number(String(s).replace(',', '.')); return String(s).trim() === '' || !Number.isFinite(n) ? NaN : n }

function Chip({ on, onClick, children }) {
  return <button type="button" className={'chip nocap' + (on ? ' on' : '')} aria-pressed={!!on} onClick={onClick}>{children}</button>
}

async function saveText(text, name, type) {
  if (MOBILE) { await shareExport(text, name); return }
  const blob = new Blob([text], { type: type + ';charset=utf-8' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 60000)
}

/* ------------------------------------------------------------ foods ---- */

// Search the foods (yours first, then the reference list), pick one, set the amount: onPick gets the item.
function FoodPicker({ onPick, close }) {
  const S = useStore(s => s.S)
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [searchSeq, setSearchSeq] = useState(0)
  const [food, setFood] = useState(null)
  const [remote, setRemote] = useState([])
  const [remoteFor, setRemoteFor] = useState('')
  const [looking, setLooking] = useState(false)
  const [partial, setPartial] = useState(false)
  const [amt, setAmt] = useState(100)
  const prof = profileOf(S)
  const local = useMemo(() => searchFoods(S, q, lang()).slice(0, 60), [S.nutritionFoods, q])
  useEffect(() => {
    let active = true
    setRemote([])
    if (submitted.trim().length < 2) { setLooking(false); return () => { active = false } }
    setLooking(true)
    const timer = setTimeout(async () => {
      try {
        const result = await api('/api/nutrition/foods/search?q=' + encodeURIComponent(submitted.trim()))
        if (active) { setRemote(Array.isArray(result.foods) ? result.foods : []); setRemoteFor(submitted.trim()); setPartial(!!result.partial) }
      } catch { if (active) { setRemote([]); setPartial(true) } }
      finally { if (active) setLooking(false) }
    }, 300)
    return () => { active = false; clearTimeout(timer) }
  }, [submitted, searchSeq])
  const list = [...local, ...(remoteFor.toLocaleLowerCase() === q.trim().toLocaleLowerCase() ? remote : [])]
  const submitSearch = () => { setSubmitted(q); setSearchSeq(n => n + 1) }
  if (food) {
    const item = itemFromFood(food, amt, lang())
    return <>
      <h3>{foodName(food, lang())}</h3>
      <div className="muted small">{macroLine(food)} · {nt('per100', baseLabel(food.base))}</div>
      {food.src === 'external' && <div className="muted small" style={{ marginTop: 4 }}>{food.source}{food.brand ? ' · ' + food.brand : ''}{food.barcode ? ' · ' + nt('barcode') + ': ' + food.barcode : ''}{food.fiber == null ? ' · ' + nt('fiberUnavailable') : ''}</div>}
      {avoidHit(prof, food, lang()) && <div className="small" role="note" style={{ marginTop: 6 }}>{nt('avoidFlag')}</div>}
      <div className="small muted" style={{ margin: '14px 0 6px' }}>{nt('amount')} ({food.base === 'ml' ? nt('unitMl') : nt('unitG')})</div>
      <Stepper value={amt} min={1} max={5000} step={10} decimal={false} unit={baseLabel(food.base)} ariaLabel={nt('amount')} onChange={setAmt} />
      {item && <div className="small" style={{ margin: '10px 0' }}><b>{macroLine(macrosOf(item))}</b></div>}
      <div className="row" style={{ gap: 8, marginTop: 8 }}>
        <Button variant="primary" disabled={!item} onClick={() => { onPick(item); close() }}>{nt('add')}</Button>
        <Button variant="ghost" className="dim" onClick={() => setFood(null)}>{t('Back')}</Button>
      </div>
    </>
  }
  return <>
    <h3>{nt('addFood')}</h3>
    <div className="row" style={{ gap: 8 }}>
      <TextField value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submitSearch() }} placeholder={nt('search')} aria-label={nt('search')} />
      <Button variant="ghost" disabled={q.trim().length < 2 || looking} onClick={submitSearch}>{nt('searchButton')}</Button>
    </div>
    <div className="list" style={{ marginTop: 10 }}>{list.map(f => <div key={f.id} className="item" {...tappable(() => { setFood(f); setAmt(f.base === 'ml' ? 100 : 100) })}>
      <div className="grow"><div className="tt">{foodName(f, lang())}</div>
      <div className="ss">{f.src === 'user' ? nt('yours') : f.src === 'external' ? f.source : nt('reference')} · {f.kcal} {nt('kcal')} {nt('per100', baseLabel(f.base))}{avoidHit(prof, f, lang()) ? ' · ' + nt('avoidFlag') : ''}</div></div>
      <Icon name="chevronRight" />
    </div>)}</div>
    {looking && <div className="muted small" role="status" style={{ padding: 10 }}>{nt('lookingUp')}</div>}
    {partial && remoteFor.toLocaleLowerCase() === q.trim().toLocaleLowerCase() && <div className="muted small" role="status" style={{ padding: 8 }}>{nt('someSourcesUnavailable')}</div>}
    {!list.length && !looking && <div className="empty small">{nt('noFoodResults')}</div>}
  </>
}
const pickFood = onPick => ui().openSheet(close => <FoodPicker onPick={onPick} close={close} />)

function FoodSheet({ id = null, close }) {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const had = id ? foodsOf(S).find(f => f.id === id) : null
  const [f, setF] = useState(() => ({
    name: had?.name || '', brand: had?.brand || '', base: had?.base || 'g',
    kcal: had ? String(had.kcal) : '', p: had ? String(had.p) : '', c: had ? String(had.c) : '', f: had ? String(had.f) : '', fiber: had?.fiber != null ? String(had.fiber) : '',
  }))
  const [lookup, setLookup] = useState(had?.name || '')
  const [lookupFor, setLookupFor] = useState('')
  const [lookupSubmitted, setLookupSubmitted] = useState('')
  const [lookupSeq, setLookupSeq] = useState(0)
  const [lookupResults, setLookupResults] = useState([])
  const [lookupPartial, setLookupPartial] = useState(false)
  const [looking, setLooking] = useState(false)
  const [source, setSource] = useState(had?.source || '')
  const [barcode, setBarcode] = useState(had?.barcode || '')
  useEffect(() => {
    let active = true
    setLookupResults([])
    if (lookupSubmitted.trim().length < 2) { setLooking(false); return () => { active = false } }
    setLooking(true)
    api('/api/nutrition/foods/search?q=' + encodeURIComponent(lookupSubmitted.trim()))
      .then(result => { if (active) { setLookupResults(Array.isArray(result.foods) ? result.foods : []); setLookupFor(lookupSubmitted.trim()); setLookupPartial(!!result.partial) } })
      .catch(() => { if (active) { setLookupResults([]); setLookupFor(lookupSubmitted.trim()); setLookupPartial(true) } })
      .finally(() => { if (active) setLooking(false) })
    return () => { active = false }
  }, [lookupSubmitted, lookupSeq])
  const submitLookup = () => { setLookupSubmitted(lookup); setLookupSeq(n => n + 1) }
  const selectLookup = food => {
    setF({ name: food.name, brand: food.brand || '', base: food.base || 'g', kcal: String(food.kcal), p: String(food.p), c: String(food.c), f: String(food.f), fiber: food.fiber != null ? String(food.fiber) : '' })
    setSource(food.source || ''); setBarcode(food.barcode || '')
  }
  const [err, setErr] = useState('')
  const set = k => e => setF(x => ({ ...x, [k]: e.target.value }))
  const save = () => {
    const food = { name: f.name, brand: f.brand, base: f.base, kcal: num(f.kcal), p: num(f.p), c: num(f.c), f: num(f.f), fiber: f.fiber.trim() ? num(f.fiber) : undefined, source, barcode }
    const problem = foodProblem(food)
    if (problem) { setErr(nt(problem === 'name' ? 'errName' : problem === 'numbers' ? 'errNumbers' : 'errTooMuch')); return }
    const duplicate = !id && foodsOf(S).find(x => x.name.trim().toLocaleLowerCase() === f.name.trim().toLocaleLowerCase() && (x.brand || '').trim().toLocaleLowerCase() === f.brand.trim().toLocaleLowerCase())
    update(s => { s.nutritionFoods = withFood(s.nutritionFoods, id || duplicate?.id || uid(), food) })
    close(); ui().toast(nt('saved'))
  }
  const remove = () => confirmSheet({
    title: nt('deleteFood'), message: nt('deleteFoodNote'), confirmText: t('Delete'), danger: true,
    onConfirm: () => { update(s => { s.nutritionFoods = withFood(s.nutritionFoods, id, null) }); close() },
  })
  const field = (k, label, mode = 'decimal') => <label className="small muted" style={{ display: 'block', marginTop: 10 }}>{label}
    <TextField value={f[k]} inputMode={mode} onChange={set(k)} aria-label={label} /></label>
  return <>
    <h3>{had ? nt('editFood') : nt('newFood')}</h3>
    {!had && <>
      <div className="row" style={{ gap: 8 }}>
        <TextField value={lookup} onChange={e => setLookup(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submitLookup() }} placeholder={nt('search')} aria-label={nt('search')} />
        <Button variant="ghost" disabled={lookup.trim().length < 2 || looking} onClick={submitLookup}>{nt('searchButton')}</Button>
      </div>
      {looking && <div className="muted small" role="status" style={{ padding: 8 }}>{nt('lookingUp')}</div>}
      {lookupResults.length > 0 && lookupFor.toLocaleLowerCase() === lookup.trim().toLocaleLowerCase() && <div className="list" style={{ margin: '8px 0' }}>{lookupResults.map(result => <div key={result.id} className="item" {...tappable(() => selectLookup(result))}><div className="grow"><div className="tt">{result.name}</div><div className="ss">{result.source}{result.brand ? ' · ' + result.brand : ''}</div></div><Icon name="chevronRight" /></div>)}</div>}
      {lookupPartial && lookupFor.toLocaleLowerCase() === lookup.trim().toLocaleLowerCase() && <div className="muted small" role="status">{nt('someSourcesUnavailable')}</div>}
      {!looking && lookupFor.toLocaleLowerCase() === lookup.trim().toLocaleLowerCase() && !lookupResults.length && !lookupPartial && <div className="muted small">{nt('noFoodResults')}</div>}
    </>}
    <label className="small muted" style={{ display: 'block' }}>{nt('foodName')}<TextField value={f.name} maxLength={80} onChange={set('name')} aria-label={nt('foodName')} /></label>
    <label className="small muted" style={{ display: 'block', marginTop: 10 }}>{nt('brand')}<TextField value={f.brand} maxLength={60} onChange={set('brand')} aria-label={nt('brand')} /></label>
    {source && <div className="muted small" style={{ marginTop: 8 }}>{nt('dataSource')}: {source}{barcode ? ' · ' + nt('barcode') + ': ' + barcode : ''}</div>}
    <div className="small muted" style={{ margin: '12px 0 6px' }}>{nt('baseUnit')}</div>
    <Segmented value={f.base} onChange={base => setF(x => ({ ...x, base }))} options={[{ value: 'g', label: 'g' }, { value: 'ml', label: nt('ml') }]} />
    {field('kcal', nt('kcal'), 'numeric')}{field('p', nt('protein') + ' (g)')}{field('c', nt('carbs') + ' (g)')}{field('f', nt('fat') + ' (g)')}{field('fiber', nt('fiber') + ' (g)')}
    {err && <div role="alert" className="small" style={{ margin: '10px 0', color: 'var(--red, #c0392b)' }}>{err}</div>}
    <div className="row" style={{ gap: 8, marginTop: 14 }}>
      <Button variant="primary" onClick={save}>{t('Save')}</Button>
      {had && <Button variant="ghost" className="dim" onClick={remove}>{t('Delete')}</Button>}
      <Button variant="ghost" className="dim" onClick={close}>{nt('cancel')}</Button>
    </div>
  </>
}
const foodSheet = (id = null) => ui().openSheet(close => <FoodSheet id={id} close={close} />)

function FoodsTab() {
  const S = useStore(s => s.S)
  const [q, setQ] = useState('')
  const mine = useMemo(() => foodsOf(S), [S.nutritionFoods])
  const ref = q ? searchFoods({}, q, lang()) : REFERENCE_FOODS
  return <>
    <TextField value={q} onChange={e => setQ(e.target.value)} placeholder={nt('search')} aria-label={nt('search')} />
    <div style={{ height: 12 }} />
    <Section title={nt('yourFoods')}>
      {mine.length === 0 && <div className="muted small" style={{ padding: '10px 14px' }}>{nt('yourFoodsEmpty')}</div>}
      {mine.filter(f => !q || searchFoods(S, q, lang()).some(x => x.id === f.id)).map(f => <Row key={f.id} title={f.name + (f.brand ? ' · ' + f.brand : '')}
        subtitle={`${nt('yours')} · ${f.kcal} ${nt('kcal')} ${nt('per100', baseLabel(f.base))}${f.source ? ' · ' + f.source : ''}`} accessory="chevron" onClick={() => foodSheet(f.id)} />)}
      <Row icon="plus" title={nt('newFood')} onClick={() => foodSheet()} />
    </Section>
    <Section title={nt('referenceFoods')} footer={nt('refNotice')}>
      {ref.map(f => <Row key={f.id} title={foodName(f, lang())} subtitle={`${nt('reference')} · ${macroLine(f)} ${nt('per100', baseLabel(f.base))}`} />)}
    </Section>
  </>
}

/* ----------------------------------------------------------- profile ---- */

function ProfileSheet({ close }) {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const cur = profileOf(S)
  const [p, setP] = useState(() => ({
    goal: cur.goal || '', kcal: cur.kcal ? String(cur.kcal) : '', p: cur.p ? String(cur.p) : '', c: cur.c ? String(cur.c) : '', f: cur.f ? String(cur.f) : '',
    water: cur.water ? String(cur.water) : '', diet: cur.diet || [], avoid: (cur.avoid || []).join(', '),
  }))
  const save = () => {
    const out = { diet: p.diet, avoid: p.avoid.split(',').map(x => x.trim()).filter(Boolean) }
    if (p.goal) out.goal = p.goal
    for (const k of ['kcal', 'p', 'c', 'f', 'water']) { const v = num(p[k]); if (v > 0) out[k] = v }
    update(s => { s.nutritionProfile = out })
    close(); ui().toast(nt('saved'))
  }
  const field = (k, label) => <label className="small muted" style={{ display: 'block', marginTop: 10 }}>{label}
    <TextField value={p[k]} inputMode="numeric" onChange={e => setP(x => ({ ...x, [k]: e.target.value }))} aria-label={label} /></label>
  return <>
    <h3>{nt('profile')}</h3>
    <div className="muted small" style={{ marginBottom: 12 }}>{nt('profileHint')}</div>
    <div className="small muted" style={{ marginBottom: 6 }}>{nt('goal')}</div>
    <div className="chips" style={{ flexWrap: 'wrap' }}>
      <Chip on={!p.goal} onClick={() => setP(x => ({ ...x, goal: '' }))}>{nt('goalNone')}</Chip>
      {GOALS.map(g => <Chip key={g} on={p.goal === g} onClick={() => setP(x => ({ ...x, goal: g }))}>{nt('goal_' + g)}</Chip>)}
    </div>
    {field('kcal', nt('tKcal'))}{field('p', nt('tP'))}{field('c', nt('tC'))}{field('f', nt('tF'))}{field('water', nt('tWater'))}
    <div className="small muted" style={{ margin: '14px 0 6px' }}>{nt('diet')}</div>
    <div className="chips" style={{ flexWrap: 'wrap' }}>
      {DIETS.map(d => <Chip key={d} on={p.diet.includes(d)} onClick={() => setP(x => ({ ...x, diet: x.diet.includes(d) ? x.diet.filter(v => v !== d) : [...x.diet, d] }))}>{nt('diet_' + d)}</Chip>)}
    </div>
    <label className="small muted" style={{ display: 'block', marginTop: 14 }}>{nt('avoid')}
      <TextField value={p.avoid} onChange={e => setP(x => ({ ...x, avoid: e.target.value }))} aria-label={nt('avoid')} /></label>
    <div className="muted small" style={{ marginTop: 4 }}>{nt('avoidHint')}</div>
    <div className="row" style={{ gap: 8, marginTop: 16 }}>
      <Button variant="primary" onClick={save}>{t('Save')}</Button>
      <Button variant="ghost" className="dim" onClick={close}>{nt('cancel')}</Button>
    </div>
  </>
}

/* ------------------------------------------------------------- today ---- */

function ItemSheet({ mealId, index, close }) {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const meal = mealsOf(S).find(m => m.id === mealId)
  const item = meal?.items[index]
  const [amt, setAmt] = useState(item?.amt || 100)
  if (!item) return null
  const write = items => update(s => { s.nutritionMeals = withMeal(s.nutritionMeals, mealId, items.length ? { ...meal, items } : null) })
  return <>
    <h3>{item.name}</h3>
    <div className="small muted" style={{ marginBottom: 6 }}>{nt('adjust')}</div>
    <Stepper value={amt} min={1} max={5000} step={10} decimal={false} unit={baseLabel(item.base)} ariaLabel={nt('amount')} onChange={setAmt} />
    <div className="small" style={{ margin: '10px 0' }}><b>{macroLine(macrosOf({ ...item, amt }))}</b></div>
    <div className="row" style={{ gap: 8 }}>
      <Button variant="primary" onClick={() => { write(meal.items.map((x, i) => (i === index ? { ...x, amt } : x))); close() }}>{t('Save')}</Button>
      <Button variant="ghost" className="dim" onClick={() => { write(meal.items.filter((_, i) => i !== index)); close() }}>{nt('removeItem')}</Button>
    </div>
  </>
}

function TodayTab() {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const today = todayISO()
  const [d, setD] = useState(today)
  const day = useMemo(() => dayOf(S, d), [S.nutritionMeals, S.nutritionWater, d])
  const prog = dayProgress(S, d)
  const plans = useMemo(() => plansOf(S), [S.nutritionPlans])
  const addItem = (slot, item) => update(s => {
    const have = mealsOf(s).find(m => m.d === d && m.slot === slot)
    s.nutritionMeals = withMeal(s.nutritionMeals, have ? have.id : uid(), { d, slot, items: [...(have ? have.items : []), item] })
  })
  const logPlan = plan => {
    update(s => { for (const m of planToMeals(plan, d)) {
      const have = mealsOf(s).find(x => x.d === d && x.slot === m.slot)
      s.nutritionMeals = withMeal(s.nutritionMeals, have ? have.id : uid(), { ...m, items: [...(have ? have.items : []), ...m.items] })
    } })
    ui().toast(nt('planLogged'))
  }
  const metric = (label, row, unit) => <div className="stat" style={{ flex: '1 1 40%' }}>
    <div className="mono" style={{ fontSize: 20 }}>{row.value}{unit}</div>
    <div className="small muted">{label}{row.target ? ' · ' + nt('ofTarget', row.target + unit) : ''}</div>
  </div>
  const waterTarget = prog.water.target
  return <>
    <div className="row" style={{ alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <button type="button" className="iconbtn" aria-label={nt('prevDay')} onClick={() => setD(addDays(d, -1))}><Icon name="chevronLeft" /></button>
      <div className="grow" style={{ textAlign: 'center' }}><b>{d === today ? nt('today') : fmtDate(d, true)}</b></div>
      <button type="button" className="iconbtn" aria-label={nt('nextDay')} disabled={d >= today} onClick={() => setD(addDays(d, 1))}><Icon name="chevronRight" /></button>
    </div>
    <Section title={nt('totals')}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', padding: 12 }}>
        {metric(nt('kcal'), prog.kcal, '')}{metric(nt('protein'), prog.p, ' g')}{metric(nt('carbs'), prog.c, ' g')}{metric(nt('fat'), prog.f, ' g')}
      </div>
      {!prog.kcal.target && <div className="muted small" style={{ padding: '0 14px 10px' }}>{nt('noTarget')}</div>}
    </Section>
    <Section title={nt('water')}>
      <div className="row" style={{ gap: 8, alignItems: 'center', padding: 12, flexWrap: 'wrap' }}>
        <div className="grow mono">{waterTarget ? nt('waterOf', day.water, waterTarget) : day.water + ' ' + nt('ml')}</div>
        <Button variant="tinted" size="sm" disabled={!day.water} onClick={() => update(s => { s.nutritionWater = addWater(s.nutritionWater, d, -250) })}>{nt('undo', 250)}</Button>
        <Button variant="tinted" size="sm" onClick={() => update(s => { s.nutritionWater = addWater(s.nutritionWater, d, 250) })}>{nt('glass', 250)}</Button>
        <Button variant="tinted" size="sm" onClick={() => update(s => { s.nutritionWater = addWater(s.nutritionWater, d, 500) })}>{nt('glass', 500)}</Button>
      </div>
    </Section>
    {SLOTS.map(slot => {
      const meals = day.meals.filter(m => m.slot === slot)
      const items = meals.flatMap(m => m.items.map((it, i) => ({ it, i, id: m.id })))
      return <Section key={slot} title={nt('slot_' + slot) + (items.length ? ' · ' + sumMacros(items.map(x => x.it)).kcal + ' ' + nt('kcal') : '')}>
        {items.map(({ it, i, id }) => <Row key={id + i} title={it.name} subtitle={`${it.amt} ${baseLabel(it.base)} · ${macroLine(macrosOf(it))}${it.source ? ' · ' + it.source : ''}${it.barcode ? ' · ' + nt('barcode') + ': ' + it.barcode : ''}`}
          accessory="chevron" onClick={() => ui().openSheet(close => <ItemSheet mealId={id} index={i} close={close} />)} />)}
        <Row icon="plus" title={nt('addFood')} onClick={() => pickFood(item => addItem(slot, item))} />
      </Section>
    })}
    {plans.length > 0 && <Section><Row icon="sparkles" title={nt('logFromPlan')} accessory="chevron" onClick={() => ui().openSheet(close => <div>
      <h3>{nt('logFromPlan')}</h3>
      <div className="list">{plans.map(p => <div key={p.id} className="item" {...tappable(() => { logPlan(p); close() })}>
        <div className="grow"><div className="tt">{p.name}</div><div className="ss">{macroLine(planTotals(p))}</div></div></div>)}</div>
    </div>)} /></Section>}
    <Section><Row icon="slider" title={nt('setTargets')} accessory="chevron" onClick={() => ui().openSheet(close => <ProfileSheet close={close} />)} /></Section>
  </>
}

/* ------------------------------------------------------------- plans ---- */

function PlanSheet({ id = null, close }) {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const had = id ? plansOf(S).find(p => p.id === id) : null
  const [name, setName] = useState(had?.name || '')
  const [meals, setMeals] = useState(had?.meals || [])
  const addItem = (slot, item) => setMeals(ms => {
    const at = ms.findIndex(m => m.slot === slot)
    return at < 0 ? [...ms, { slot, items: [item] }] : ms.map((m, i) => (i === at ? { ...m, items: [...m.items, item] } : m))
  })
  const dropItem = (mi, ii) => setMeals(ms => ms.map((m, i) => (i === mi ? { ...m, items: m.items.filter((_, k) => k !== ii) } : m)).filter(m => m.items.length))
  const save = () => {
    if (!name.trim() || !meals.length) return
    update(s => { s.nutritionPlans = withPlan(s.nutritionPlans, id || uid(), { name: name.trim(), meals }) })
    close(); ui().toast(nt('saved'))
  }
  const remove = () => confirmSheet({ title: nt('deletePlan'), message: name, confirmText: t('Delete'), danger: true,
    onConfirm: () => { update(s => { s.nutritionPlans = withPlan(s.nutritionPlans, id, null) }); close() } })
  return <>
    <h3>{had ? nt('editPlan') : nt('newPlan')}</h3>
    <TextField value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder={nt('planName')} aria-label={nt('planName')} />
    <div className="muted small" style={{ margin: '8px 0' }}>{nt('planDay')}{meals.length ? ' · ' + macroLine(planTotals({ meals })) : ''}</div>
    {SLOTS.map(slot => {
      const mi = meals.findIndex(m => m.slot === slot)
      return <div key={slot} style={{ marginBottom: 10 }}>
        <div className="small muted">{nt('slot_' + slot)}</div>
        {mi >= 0 && meals[mi].items.map((it, ii) => <div key={ii} className="row" style={{ gap: 8, alignItems: 'center' }}>
          <div className="grow small">{it.name} · {it.amt} {baseLabel(it.base)}</div>
          <button type="button" className="iconbtn" aria-label={nt('removeItem') + ': ' + it.name} onClick={() => dropItem(mi, ii)}><Icon name="trash" /></button>
        </div>)}
        <Button variant="tinted" size="sm" icon="plus" onClick={() => pickFood(item => addItem(slot, item))}>{nt('addFood')}</Button>
      </div>
    })}
    <div className="row" style={{ gap: 8, marginTop: 12 }}>
      <Button variant="primary" onClick={save} disabled={!name.trim() || !meals.length}>{t('Save')}</Button>
      {had && <Button variant="ghost" className="dim" onClick={remove}>{t('Delete')}</Button>}
    </div>
  </>
}

function ShoppingSheet({ close }) {
  const S = useStore(s => s.S)
  const plans = plansOf(S)
  const [on, setOn] = useState(() => new Set(plans.map(p => p.id)))
  const [days, setDays] = useState(7)
  const list = shoppingList(plans.filter(p => on.has(p.id)), days)
  const copy = async () => {
    try { await navigator.clipboard.writeText(shoppingText(list)); ui().toast(nt('copied')) } catch { /* no clipboard: the list is on screen */ }
  }
  return <>
    <h3>{nt('shopping')}</h3>
    <div className="chips" style={{ flexWrap: 'wrap', margin: '8px 0' }}>
      {plans.map(p => <Chip key={p.id} on={on.has(p.id)} onClick={() => setOn(s => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n })}>{p.name}</Chip>)}
    </div>
    <div className="small muted" style={{ marginBottom: 6 }}>{nt('shoppingDays')}</div>
    <Stepper value={days} min={1} max={31} step={1} decimal={false} ariaLabel={nt('shoppingDays')} onChange={setDays} />
    <div style={{ margin: '12px 0' }}>{list.length === 0 ? <div className="muted small">{nt('shoppingEmpty')}</div>
      : list.map(l => <Row key={l.key} title={l.name} value={l.amt >= 1000 ? (Math.round(l.amt / 100) / 10) + (l.base === 'g' ? ' kg' : ' l') : l.amt + ' ' + l.base} />)}</div>
    <div className="row" style={{ gap: 8 }}>
      <Button variant="primary" disabled={!list.length} onClick={copy}>{nt('copyList')}</Button>
      <Button variant="ghost" className="dim" onClick={close}>{t('Done')}</Button>
    </div>
  </>
}

function PlansTab() {
  const S = useStore(s => s.S)
  const plans = useMemo(() => plansOf(S), [S.nutritionPlans])
  return <>
    <Section>
      {plans.length === 0 && <div className="muted small" style={{ padding: '10px 14px' }}>{nt('noPlans')}</div>}
      {plans.map(p => <Row key={p.id} icon="note" title={p.name} subtitle={nt('itemsN', p.meals.reduce((n, m) => n + m.items.length, 0)) + ' · ' + macroLine(planTotals(p))}
        accessory="chevron" onClick={() => ui().openSheet(close => <PlanSheet id={p.id} close={close} />)} />)}
      <Row icon="plus" title={nt('newPlan')} onClick={() => ui().openSheet(close => <PlanSheet close={close} />)} />
    </Section>
    <Section><Row icon="list" title={nt('shopping')} accessory="chevron" onClick={() => ui().openSheet(close => <ShoppingSheet close={close} />)} /></Section>
  </>
}

/* ------------------------------------------------------------ trends ---- */

function TrendsTab() {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const [range, setRange] = useState(30)
  const today = todayISO()
  const from = addDays(today, -(range - 1))
  const days = useMemo(() => nutritionDays(S, from, today), [S.nutritionMeals, S.nutritionWater, range])
  const avg = useMemo(() => nutritionAverages(S, from, today), [S.nutritionMeals, S.nutritionWater, range])
  const fed = days.filter(x => x.meals)
  const max = Math.max(1, ...fed.map(x => x.kcal))
  const hasAny = Object.keys(S.nutritionMeals || {}).length + Object.keys(S.nutritionFoods || {}).length + Object.keys(S.nutritionPlans || {}).length + Object.keys(S.nutritionWater || {}).length > 0
  const exportJson = () => saveText(JSON.stringify(exportNutrition(S), null, 2), 'karma-nutrition.json', 'application/json')
  const exportCsv = () => saveText(nutritionCSV(S), 'karma-nutrition-diary.csv', 'text/csv')
  const wipe = () => confirmSheet({ title: nt('deleteAllAsk'), message: nt('deleteAllNote'), confirmText: t('Delete'), danger: true,
    onConfirm: () => { update(s => { Object.assign(s, clearedNutrition(s)) }); ui().toast(nt('deleted')) } })
  return <>
    <Segmented value={String(range)} onChange={v => setRange(Number(v))} options={[7, 30, 90].map(n => ({ value: String(n), label: nt('range' + n) }))} />
    <div style={{ height: 12 }} />
    {!avg && !days.length ? <EmptyState icon="note" text={nt('noData')} /> : <>
      {avg && <Section title={nt('avgOver', avg.days)}>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', padding: 12 }}>
          {[[nt('kcal'), avg.kcal], [nt('protein'), avg.p + ' g'], [nt('carbs'), avg.c + ' g'], [nt('fat'), avg.f + ' g']].map(([l, v]) =>
            <div key={l} className="stat" style={{ flex: '1 1 40%' }}><div className="mono" style={{ fontSize: 20 }}>{v}</div><div className="small muted">{l}</div></div>)}
        </div>
        {avg.water > 0 && <div className="muted small" style={{ padding: '0 14px 10px' }}>{nt('waterAvg')}: {avg.water} {nt('ml')}</div>}
      </Section>}
      {fed.length > 0 && <Section title={nt('perDay')}>
        <div className="row" style={{ gap: 3, alignItems: 'flex-end', height: 90, padding: '12px 14px' }} role="img" aria-label={fed.map(x => x.kcal).join(', ')}>
          {fed.slice(-30).map(x => <div key={x.d} className="grow" title={fmtDate(x.d, true) + ': ' + x.kcal}
            style={{ height: Math.max(3, (x.kcal / max) * 64), background: 'var(--accent, currentColor)', borderRadius: 2 }} />)}
        </div>
        <div className="muted small" style={{ padding: '0 14px 10px' }}>{nt('daysLogged')}: {fed.length}</div>
      </Section>}
      <Section>{days.slice().reverse().slice(0, 30).map(x => <Row key={x.d} title={fmtDate(x.d, true)}
        subtitle={x.meals ? macroLine(x) : undefined} value={x.water ? x.water + ' ' + nt('ml') : undefined} />)}</Section>
    </>}
    <Section title={nt('exportData')}>
      <Row icon="download" title={nt('exportJson')} onClick={exportJson} />
      <Row icon="download" title={nt('exportCsv')} onClick={exportCsv} />
      {hasAny && <Row icon="trash" title={nt('deleteAll')} danger onClick={wipe} />}
    </Section>
  </>
}

/* -------------------------------------------------------------- view ---- */

export default function Nutrition() {
  const nav = useNavigate()
  const [tab, setTab] = useState('today')
  return <div className="narrow nutrition">
    <div className="hdr">
      <button className="iconbtn" data-back="/stats" onClick={() => nav('/stats')} aria-label={t('Stats')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginInlineStart: 12 }}><h1>{t('Nutrition')}</h1><div className="sub">{nt('subtitle')}</div></div>
    </div>
    <div className="muted small" role="note" style={{ margin: '0 0 12px', lineHeight: 1.45 }}>{nt('notice')}</div>
    <Segmented value={tab} onChange={setTab} options={[
      { value: 'today', label: nt('tabToday') }, { value: 'foods', label: nt('tabFoods') }, { value: 'plans', label: nt('tabPlans') }, { value: 'trends', label: nt('tabTrends') },
    ]} />
    <div style={{ height: 12 }} />
    {tab === 'today' && <TodayTab />}
    {tab === 'foods' && <FoodsTab />}
    {tab === 'plans' && <PlansTab />}
    {tab === 'trends' && <TrendsTab />}
  </div>
}
