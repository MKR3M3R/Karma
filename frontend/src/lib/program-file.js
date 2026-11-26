// A training programme as a plain file anyone can write: JSON (`type: 'training_program'`,
// versioned) or a CSV with one row per exercise. It is read the way a plan file from a friend is:
// everything is validated, the exercises are matched to the library by name, nothing is written to
// the store here, and the result is a normal plan bundle (`opengym_plan`) that parsePlan and
// mergePlan already take, so the preview, the unit handling and "never overwrites your routines"
// stay in one place.
//
// No user-facing text lives here: problems come back as `{ level, code, path, ...params }` and the
// screen turns each code into a sentence with t().

import { parseCSV, matchExercise, bpFromName, importId } from './import-csv.js'

export const PROGRAM_TYPE = 'training_program'
export const PROGRAM_VERSION = '1.0'
const MAJOR = 1

export const LIMITS = Object.freeze({
  bytes: 1_000_000,       // a programme is text; a megabyte is already hundreds of exercises
  days: 14,
  exercisesPerDay: 60,
  sets: 20,
  restSec: 900,
  seconds: 3600,
  load: 1000,
  nameLen: 120,
  noteLen: 500,
  programName: 80,
})

const LEVELS = new Set(['iniciante', 'intermediario', 'avancado', 'beginner', 'intermediate', 'advanced'])

const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v)
const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max) : '')
const num = v => (v === '' || v == null ? null : Number.isFinite(Number(v)) ? Number(v) : NaN)
const nameKey = n => String(n || '').toLowerCase().replace(/\s+/g, ' ').trim()

/** "8-12", "8 a 12", "8 to 12" or 10 → { lo, hi } (equal for a single number), or null. */
export function parseRepRange(v) {
  if (typeof v === 'number') return Number.isInteger(v) && v > 0 && v <= 200 ? { lo: v, hi: v } : null
  const m = /^\s*(\d{1,3})\s*(?:[-–]|a|to|até)?\s*(\d{1,3})?\s*$/i.exec(String(v == null ? '' : v))
  if (!m) return null
  const lo = Number(m[1]), hi = m[2] ? Number(m[2]) : lo
  if (!lo || hi < lo || hi > 200) return null
  return { lo, hi }
}

/** Read one exercise entry. Returns { ex, issues } where ex is null when it cannot be kept. */
function readExercise(raw, path) {
  const issues = []
  if (!isObj(raw)) return { ex: null, issues: [{ level: 'error', code: 'exercise-not-object', path }] }
  const name = clean(raw.name, LIMITS.nameLen)
  if (!name) return { ex: null, issues: [{ level: 'error', code: 'exercise-no-name', path }] }

  let sets = num(raw.sets)
  if (sets == null) { sets = 3; issues.push({ level: 'warn', code: 'sets-default', path, name }) }
  else if (!Number.isInteger(sets) || sets < 1 || sets > LIMITS.sets) {
    issues.push({ level: 'warn', code: 'sets-invalid', path, name, value: raw.sets })
    sets = Math.min(LIMITS.sets, Math.max(1, Math.round(Number.isFinite(sets) ? sets : 3)))
  }

  const ex = { name, sets }
  const seconds = num(raw.duration_seconds != null ? raw.duration_seconds : raw.seconds)
  if (seconds != null) {
    if (!(seconds > 0) || seconds > LIMITS.seconds) issues.push({ level: 'warn', code: 'duration-invalid', path, name })
    else { ex.mode = 'time'; ex.sec = Math.round(seconds) }
  }
  if (ex.mode !== 'time' && raw.reps != null && raw.reps !== '') {
    const r = parseRepRange(raw.reps)
    if (!r) issues.push({ level: 'warn', code: 'reps-invalid', path, name, value: String(raw.reps).slice(0, 20) })
    else { ex.reps = r.hi; if (r.hi > r.lo) { ex.repsMin = r.lo; ex.prog = 'double' } }
  }

  const rest = num(raw.rest_seconds)
  if (rest != null) {
    if (!(rest >= 0) || rest > LIMITS.restSec) issues.push({ level: 'warn', code: 'rest-invalid', path, name })
    else if (rest > 0) ex.restSec = Math.round(rest)
  }
  const load = num(raw.load)
  if (load != null) {
    if (!(load > 0) || load > LIMITS.load) issues.push({ level: 'warn', code: 'load-invalid', path, name })
    else ex.weight = load
  }
  const note = clean(raw.notes != null ? raw.notes : raw.note, LIMITS.noteLen)
  if (note) ex.note = note
  const group = clean(raw.superset_group != null ? raw.superset_group : raw.superset, 40)
  if (group) ex.group = group
  return { ex, issues }
}

/**
 * Validate a training_program object.
 * Returns { ok, issues, program } where program is the cleaned, still name-based structure
 * ({ name, description, goal, level, days: [{ name, exercises: [...] }] }); ok is false when
 * nothing usable remains.
 */
export function validateProgram(data) {
  const issues = []
  const fail = code => ({ ok: false, issues: [{ level: 'error', code, path: '' }], program: null })
  if (!isObj(data) || data.type !== PROGRAM_TYPE) return fail('not-program')
  const major = parseInt(String(data.schema_version || ''), 10)
  if (!Number.isFinite(major)) return fail('no-version')
  if (major > MAJOR) return fail('too-new')
  if (!isObj(data.program)) return fail('no-program')
  const p = data.program
  const name = clean(p.name, LIMITS.programName)
  if (!name) issues.push({ level: 'warn', code: 'program-no-name', path: 'program.name' })
  if (!Array.isArray(p.days) || !p.days.length) return { ok: false, issues: [...issues, { level: 'error', code: 'no-days', path: 'program.days' }], program: null }
  if (p.days.length > LIMITS.days) issues.push({ level: 'warn', code: 'too-many-days', path: 'program.days', max: LIMITS.days })

  const days = []
  p.days.slice(0, LIMITS.days).forEach((d, di) => {
    const path = 'program.days[' + di + ']'
    if (!isObj(d) || !Array.isArray(d.exercises)) { issues.push({ level: 'error', code: 'day-invalid', path }); return }
    const dayName = clean(d.name, LIMITS.nameLen) || 'Day ' + (di + 1)
    if (d.exercises.length > LIMITS.exercisesPerDay) issues.push({ level: 'warn', code: 'too-many-exercises', path, max: LIMITS.exercisesPerDay })
    const exercises = []
    d.exercises.slice(0, LIMITS.exercisesPerDay).forEach((raw, ei) => {
      const r = readExercise(raw, path + '.exercises[' + ei + ']')
      issues.push(...r.issues)
      if (r.ex) exercises.push(r.ex)
    })
    if (!exercises.length) { issues.push({ level: 'error', code: 'day-empty', path, name: dayName }); return }
    days.push({ name: dayName, exercises })
  })
  if (!days.length) return { ok: false, issues, program: null }
  const level = clean(p.level, 20).toLowerCase()
  return {
    ok: true,
    issues,
    program: {
      name,
      description: clean(p.description, 300),
      goal: clean(p.goal, 40),
      level: LEVELS.has(level) ? level : '',
      days,
    },
  }
}

/**
 * Name-based programme → plan bundle (the file format parsePlan reads), matching each exercise
 * to the library. A name the library does not know becomes a custom exercise carried in the
 * bundle, so nothing in the file is dropped. `matched` lists what each name became, for the preview.
 */
export function programToBundle(program, { unit = 'kg', exact = new Map() } = {}) {
  const customEx = new Map()
  const matched = []
  const seen = new Set()
  const routines = program.days.map((day, di) => {
    const groups = new Map()
    const ex = day.exercises.map(e => {
      const key = nameKey(e.name)
      // `exact` lets the preview pin a name to an id the user picked.
      let id = exact.get(key) || matchExercise(e.name)
      if (!id) {
        id = importId('pg', key)
        if (!customEx.has(id)) customEx.set(id, { id, n: e.name, bp: bpFromName(e.name) || 'upper legs', eq: 'custom' })
      }
      if (!seen.has(key)) { seen.add(key); matched.push({ name: e.name, id, custom: customEx.has(id) }) }
      const { name: _n, group, ...cfg } = e
      const out = { id, ...cfg }
      if (group) {
        if (!groups.has(group)) groups.set(group, 'sg' + (di + 1) + '-' + (groups.size + 1))
        out.sg = groups.get(group)
      }
      return out
    })
    // A group with one member is not a superset.
    const counts = {}
    ex.forEach(e => { if (e.sg) counts[e.sg] = (counts[e.sg] || 0) + 1 })
    ex.forEach(e => { if (e.sg && counts[e.sg] < 2) delete e.sg })
    return { id: 'pgd' + (di + 1), name: day.name, ex }
  })
  return {
    bundle: { opengym_plan: 1, name: program.name, unit, week: {}, routines, customEx: [...customEx.values()] },
    matched,
  }
}

/** The one entry point for a JSON file or object. Never throws; problems come back as issues. */
export function readProgramJSON(raw, opts = {}) {
  if (typeof raw === 'string') {
    if (raw.length > LIMITS.bytes) return { ok: false, issues: [{ level: 'error', code: 'too-big', path: '' }] }
    try { raw = JSON.parse(raw.replace(/^﻿/, '')) } catch { return { ok: false, issues: [{ level: 'error', code: 'bad-json', path: '' }] } }
  }
  const v = validateProgram(raw)
  if (!v.ok) return v
  return { ...v, ...programToBundle(v.program, opts) }
}

/* ---------------------------------------------------------------- CSV ---- */

// Header words (compared without case, accents or punctuation) → the field they fill.
const COLS = {
  day: ['day', 'dia', 'workout', 'treino', 'ficha', 'routine', 'rotina', 'workout name'],
  exercise: ['exercise', 'exercicio', 'exercise name', 'name', 'nome'],
  sets: ['sets', 'series', 'serie'],
  reps: ['reps', 'repetitions', 'repeticoes', 'repeticao'],
  rest_seconds: ['rest', 'rest seconds', 'rest sec', 'descanso', 'descanso segundos', 'intervalo'],
  load: ['load', 'weight', 'weight kg', 'carga', 'peso'],
  notes: ['notes', 'note', 'observacoes', 'observacao', 'obs'],
  superset_group: ['superset', 'superset group', 'bi set', 'grupo'],
  duration_seconds: ['seconds', 'duration seconds', 'duration', 'duracao', 'tempo'],
  program: ['program', 'programme', 'programa'],
}
const norm = h => String(h || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** The columns of a CSV header: { fields: { day: 0, exercise: 2, ... }, unknown: [header, ...] }. */
export function csvColumns(header) {
  const fields = {}
  const unknown = []
  header.forEach((h, i) => {
    const k = norm(h)
    const f = Object.keys(COLS).find(name => !(name in fields) && COLS[name].includes(k))
    if (f) fields[f] = i
    else if (k) unknown.push(String(h).slice(0, 40))
  })
  return { fields, unknown }
}

/**
 * A CSV (one row per exercise) → the same training_program object a JSON file holds, so both
 * go through validateProgram. `map` overrides the detected columns ({ field: columnIndex }), for
 * the "map your columns" step.
 */
export function csvToProgram(text, { map = null, name = '' } = {}) {
  if (typeof text !== 'string' || text.length > LIMITS.bytes) return { ok: false, issues: [{ level: 'error', code: 'too-big', path: '' }] }
  const rows = parseCSV(text).filter(r => r.some(c => String(c).trim()))
  if (rows.length < 2) return { ok: false, issues: [{ level: 'error', code: 'csv-empty', path: '' }] }
  const cols = csvColumns(rows[0])
  const fields = map || cols.fields
  if (!('exercise' in fields)) return { ok: false, issues: [{ level: 'error', code: 'csv-no-exercise', path: '' }], columns: cols, header: rows[0] }
  const cell = (r, f) => (f in fields ? String(r[fields[f]] == null ? '' : r[fields[f]]).trim() : '')
  const days = []
  const index = new Map()
  let programName = name
  rows.slice(1).forEach(r => {
    const exName = cell(r, 'exercise')
    if (!exName) return
    if (!programName) programName = cell(r, 'program')
    const dayName = cell(r, 'day') || 'Day 1'
    let day = index.get(dayName)
    if (!day) { day = { name: dayName, exercises: [] }; index.set(dayName, day); days.push(day) }
    const e = { name: exName }
    for (const f of ['sets', 'reps', 'rest_seconds', 'load', 'notes', 'superset_group', 'duration_seconds']) {
      const v = cell(r, f)
      if (v !== '') e[f] = f === 'reps' || f === 'notes' || f === 'superset_group' ? v : Number(v.replace(',', '.'))
    }
    day.exercises.push(e)
  })
  return {
    ok: true,
    issues: [],
    columns: cols,
    header: rows[0],
    data: { schema_version: PROGRAM_VERSION, type: PROGRAM_TYPE, program: { name: programName, days } },
  }
}

/** A CSV file end to end: columns → programme → bundle. */
export function readProgramCSV(text, opts = {}) {
  const c = csvToProgram(text, opts)
  if (!c.ok) return c
  const v = validateProgram(c.data)
  if (!v.ok) return { ...v, columns: c.columns, header: c.header }
  return { ...v, ...programToBundle(v.program, opts), columns: c.columns, header: c.header }
}

/* ------------------------------------------------------------- export ---- */

/**
 * Routines → a training_program file (JSON text). `nameOf` turns an exercise id into its display
 * name, so a file written here reads back by name in this app and in any other tool.
 */
export function buildProgramFile(routines, nameOf, { name = '' } = {}) {
  const days = (routines || []).filter(r => r && Array.isArray(r.ex) && r.ex.length).map(r => ({
    name: r.name || '',
    exercises: r.ex.map(e => {
      const o = { name: nameOf(e.id), sets: e.sets }
      if (e.mode === 'time') { if (e.sec != null) o.duration_seconds = e.sec }
      else if (e.reps != null) o.reps = e.repsMin != null && e.repsMin < e.reps ? e.repsMin + '-' + e.reps : e.reps
      if (e.restSec > 0) o.rest_seconds = e.restSec
      o.load = e.weight > 0 ? e.weight : null
      if (e.note) o.notes = e.note
      if (e.sg) o.superset_group = String(e.sg)
      return o
    }),
  }))
  return JSON.stringify({ schema_version: PROGRAM_VERSION, type: PROGRAM_TYPE, program: { name, days } }, null, 2)
}

const csvCell = v => {
  const s = String(v ?? '')
  return /[",;\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}
export const PROGRAM_CSV_HEADER = ['Day', 'Exercise', 'Sets', 'Reps', 'Rest', 'Load', 'Notes', 'Superset', 'Seconds']

/**
 * The same routines as a CSV, one row per exercise, in the columns csvColumns reads back, so a
 * file written here imports here (and opens in a spreadsheet). Empty cells stay empty.
 */
export function buildProgramCSV(routines, nameOf) {
  const file = JSON.parse(buildProgramFile(routines, nameOf))
  const rows = [PROGRAM_CSV_HEADER]
  for (const day of file.program.days) for (const e of day.exercises) {
    rows.push([day.name, e.name, e.sets, e.reps, e.rest_seconds, e.load, e.notes, e.superset_group, e.duration_seconds])
  }
  return rows.map(r => r.map(csvCell).join(',')).join('\n') + '\n'
}
