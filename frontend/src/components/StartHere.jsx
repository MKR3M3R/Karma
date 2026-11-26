import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { AREAS, LEVELS, startHereOf, startHereState, startHereWith } from '../lib/start-here.js'
import { st } from '../lib/start-here-ui.js'
import { mt } from '../lib/mobility-ui.js'
import CardHead from './CardHead.jsx'
import { Button, Row } from './ui.jsx'

// Home's optional start (lib/start-here.js): pick the parts of Karma to use, then see the ones not
// tried yet. Every part stays reachable from Stats whatever is picked, and "Not now" ends it.

const areaName = id => (id === 'training' ? t('Training') : id === 'mobility' ? t('Mobility') : id === 'nutrition' ? t('Nutrition') : t('Goals'))

function Chip({ on, onClick, children }) {
  return <button type="button" className={'chip nocap' + (on ? ' on' : '')} aria-pressed={!!on} onClick={onClick}>{children}</button>
}

function ChooseSheet({ close }) {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const [areas, setAreas] = useState(() => startHereOf(S).areas)
  const [level, setLevel] = useState(null)
  const toggle = id => setAreas(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id]))
  const save = () => {
    update(s => {
      s.startHere = startHereWith(areas)
      if (level && areas.includes('mobility')) s.mobilityProfile = { ...(s.mobilityProfile && typeof s.mobilityProfile === 'object' ? s.mobilityProfile : {}), level }
    })
    close(); useUI.getState().toast(st('saved'))
  }
  return <>
    <h3>{st('sheetTitle')}</h3>
    <div className="muted small" style={{ marginBottom: 10 }}>{st('sheetHint')}</div>
    <div className="list">{AREAS.map(a => <button key={a.id} type="button" className="item" aria-pressed={areas.includes(a.id)} onClick={() => toggle(a.id)} style={{ textAlign: 'start', width: '100%' }}>
      <div className="grow"><div className="tt">{areaName(a.id)}</div><div className="ss">{st('areaSub_' + a.id)}</div></div>
      <span aria-hidden="true">{areas.includes(a.id) ? '✓' : ''}</span>
    </button>)}</div>
    {areas.includes('mobility') && <>
      <div className="small muted" style={{ margin: '14px 0 4px' }}>{st('level')}</div>
      <div className="muted small" style={{ marginBottom: 6 }}>{st('levelHint')}</div>
      <div className="chips" style={{ flexWrap: 'wrap' }}>
        {LEVELS.map(l => <Chip key={l} on={level === l} onClick={() => setLevel(level === l ? null : l)}>{mt('lvl.' + l)}</Chip>)}
      </div>
    </>}
    <div className="row" style={{ gap: 8, marginTop: 16 }}>
      <Button variant="primary" onClick={save}>{st('save')}</Button>
      <Button variant="ghost" className="dim" onClick={close}>{st('cancel')}</Button>
    </div>
  </>
}

export default function StartHere() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const state = startHereState(S)
  if (!state) return null
  const choose = () => useUI.getState().openSheet(close => <ChooseSheet close={close} />)
  const away = () => update(s => { s.startHere = startHereWith(startHereOf(s).areas, true) })
  if (state.mode === 'ask') return <div className="card start-here">
    <CardHead icon="sparkles" title={st('askTitle')} sub={st('askSub')} />
    <div className="row" style={{ gap: 8, marginTop: 8 }}>
      <Button variant="primary" onClick={choose}>{st('choose')}</Button>
      <Button variant="ghost" className="dim" onClick={away}>{st('notNow')}</Button>
    </div>
  </div>
  return <div className="card start-here">
    <CardHead icon="sparkles" title={st('pointTitle')} sub={st('pointSub')} />
    {state.pending.map(id => <Row key={id} title={areaName(id)} subtitle={st('areaSub_' + id)} accessory="chevron" onClick={() => nav(AREAS.find(a => a.id === id).path)} />)}
    <div className="row" style={{ gap: 8, marginTop: 8 }}>
      <Button size="sm" variant="ghost" className="dim" onClick={choose}>{st('choose')}</Button>
      <Button size="sm" variant="ghost" className="dim" onClick={away}>{st('putAway')}</Button>
    </div>
  </div>
}
