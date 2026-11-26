import { describe, it, expect } from 'vitest'
import { readProgramJSON, readProgramCSV, validateProgram, parseRepRange, csvColumns, buildProgramFile, buildProgramCSV, csvToProgram, LIMITS } from './program-file.js'
import { parsePlan, mergePlan } from './plan-share.js'

const file = days => ({ schema_version: '1.0', type: 'training_program', program: { name: 'Base', goal: 'hipertrofia', level: 'intermediario', days } })
const day = (name, exercises) => ({ name, exercises })
const codes = r => r.issues.map(i => i.code)

describe('parseRepRange', () => {
  it('reads ranges, single numbers and the usual separators', () => {
    expect(parseRepRange('8-12')).toEqual({ lo: 8, hi: 12 })
    expect(parseRepRange('8 a 12')).toEqual({ lo: 8, hi: 12 })
    expect(parseRepRange('8 to 12')).toEqual({ lo: 8, hi: 12 })
    expect(parseRepRange(10)).toEqual({ lo: 10, hi: 10 })
    expect(parseRepRange('15')).toEqual({ lo: 15, hi: 15 })
  })
  it('refuses nonsense and backwards ranges', () => {
    for (const v of ['', 'max', '12-8', 0, -3, 1.5, '999', null]) expect(parseRepRange(v)).toBeNull()
  })
})

describe('validateProgram', () => {
  it('refuses what is not a training programme, with a code', () => {
    for (const v of [null, [], 'x', {}, { type: 'other' }]) expect(validateProgram(v).issues[0].code).toBe('not-program')
  })
  it('needs a version, and refuses a newer major', () => {
    expect(validateProgram({ type: 'training_program', program: {} }).issues[0].code).toBe('no-version')
    expect(validateProgram({ schema_version: '2.0', type: 'training_program', program: {} }).issues[0].code).toBe('too-new')
    expect(validateProgram({ schema_version: '1.7', type: 'training_program', program: { days: [day('A', [{ name: 'Squat' }])] } }).ok).toBe(true)
  })
  it('needs at least one day with at least one named exercise', () => {
    expect(validateProgram(file([])).issues.at(-1).code).toBe('no-days')
    const r = validateProgram(file([day('A', [{ sets: 3 }])]))
    expect(r.ok).toBe(false)
    expect(codes(r)).toEqual(['exercise-no-name', 'day-empty'])
  })
  it('keeps the usable exercises and reports the rest instead of losing the file', () => {
    const r = validateProgram(file([day('A', [{ name: 'Supino reto', sets: 4, reps: '8-12', rest_seconds: 90 }, 7, { name: 'Remada', sets: 99, reps: 'max', load: -5 }])]))
    expect(r.ok).toBe(true)
    expect(r.program.days[0].exercises).toHaveLength(2)
    expect(codes(r)).toEqual(expect.arrayContaining(['exercise-not-object', 'sets-invalid', 'reps-invalid', 'load-invalid']))
    expect(r.program.days[0].exercises[1].sets).toBe(LIMITS.sets)
  })
  it('turns a rep range into a double progression and a single number into plain reps', () => {
    const r = validateProgram(file([day('A', [{ name: 'a', sets: 3, reps: '8-12' }, { name: 'b', sets: 3, reps: 10 }])]))
    expect(r.program.days[0].exercises[0]).toMatchObject({ reps: 12, repsMin: 8, prog: 'double' })
    expect(r.program.days[0].exercises[1]).toEqual({ name: 'b', sets: 3, reps: 10 })
  })
  it('strips control characters and caps long text', () => {
    const r = validateProgram(file([day('A\u0000\nB', [{ name: 'x'.repeat(500), notes: 'n'.repeat(5000) }])]))
    expect(r.program.days[0].name).toBe('A B')
    expect(r.program.days[0].exercises[0].name).toHaveLength(LIMITS.nameLen)
    expect(r.program.days[0].exercises[0].note).toHaveLength(LIMITS.noteLen)
  })
  it('caps days and exercises per day', () => {
    const many = Array.from({ length: LIMITS.days + 3 }, (_, i) => day('D' + i, [{ name: 'Squat' }]))
    const r = validateProgram(file(many))
    expect(r.program.days).toHaveLength(LIMITS.days)
    expect(codes(r)).toContain('too-many-days')
  })
  it('does not choke on hostile keys', () => {
    const r = validateProgram(JSON.parse('{"schema_version":"1.0","type":"training_program","__proto__":{"x":1},"program":{"days":[{"name":"A","exercises":[{"name":"Squat","__proto__":{"sets":9}}]}]}}'))
    expect(r.ok).toBe(true)
    expect({}.x).toBeUndefined()
  })
})

describe('readProgramJSON', () => {
  it('never throws on bad text', () => {
    expect(readProgramJSON('{nope').issues[0].code).toBe('bad-json')
    expect(readProgramJSON('x'.repeat(LIMITS.bytes + 1)).issues[0].code).toBe('too-big')
  })
  it('builds a plan bundle the existing importer accepts, unknown names kept as custom exercises', () => {
    const r = readProgramJSON(JSON.stringify(file([day('Treino A', [{ name: 'Barbell Bench Press', sets: 4, reps: '8-12', rest_seconds: 90, load: 40, notes: 'devagar' }, { name: 'Exercicio inventado xyz', sets: 3, reps: 10 }])])), { unit: 'kg' })
    expect(r.ok).toBe(true)
    const plan = parsePlan(r.bundle, 'kg')
    expect(plan.routineCount).toBe(1)
    expect(plan.exerciseCount).toBe(2)
    expect(plan.dropped).toBe(0)
    expect(plan.customEx.map(c => c.n)).toEqual(['Exercicio inventado xyz'])
    const e = plan.routines[0].ex[0]
    expect(e).toMatchObject({ sets: 4, reps: 12, repsMin: 8, prog: 'double', restSec: 90, weight: 40, note: 'devagar' })
  })
  it('groups exercises into supersets, and a lone member is not one', () => {
    const r = readProgramJSON(file([day('A', [
      { name: 'Barbell Bench Press', superset_group: 'x' }, { name: 'Barbell Curl', superset_group: 'x' }, { name: 'Barbell Squat', superset_group: 'solo' }])]))
    const ex = r.bundle.routines[0].ex
    expect(ex[0].sg).toBeTruthy()
    expect(ex[0].sg).toBe(ex[1].sg)
    expect(ex[2].sg).toBeUndefined()
  })
  it('merges as new routines without touching the ones the user has', () => {
    const r = readProgramJSON(file([day('A', [{ name: 'Barbell Squat', sets: 5, reps: 5 }])]))
    const s = { unit: 'kg', routines: [{ id: 'mine', name: 'Mine', ex: [] }], week: {}, customEx: [] }
    mergePlan(s, parsePlan(r.bundle, 'kg'))
    expect(s.routines).toHaveLength(2)
    expect(s.routines[0].id).toBe('mine')
  })
  it('importing the same file twice makes the same custom exercise id', () => {
    const f = file([day('A', [{ name: 'Exercicio inventado xyz' }])])
    expect(readProgramJSON(f).bundle.customEx[0].id).toBe(readProgramJSON(f).bundle.customEx[0].id)
  })
})

describe('CSV', () => {
  const csv = 'Dia,Exercício,Séries,Reps,Descanso,Carga,Obs\nTreino A,Barbell Bench Press,4,8-12,90,40,"devagar, sem pressa"\nTreino A,Barbell Curl,3,10,60,,\nTreino B,Barbell Squat,5,5,120,60,\n'
  it('detects Portuguese and English headers', () => {
    const c = csvColumns(['Dia', 'Exercício', 'Séries', 'Reps', 'Descanso', 'Carga', 'Obs', 'Coisa'])
    expect(c.fields).toMatchObject({ day: 0, exercise: 1, sets: 2, reps: 3, rest_seconds: 4, load: 5, notes: 6 })
    expect(c.unknown).toEqual(['Coisa'])
  })
  it('groups rows into days in file order and keeps quoted commas', () => {
    const r = readProgramCSV(csv)
    expect(r.ok).toBe(true)
    expect(r.program.days.map(d => d.name)).toEqual(['Treino A', 'Treino B'])
    expect(r.program.days[0].exercises[0].note).toBe('devagar, sem pressa')
    expect(parsePlan(r.bundle, 'kg').exerciseCount).toBe(3)
  })
  it('asks for a mapping when no exercise column is found, and accepts one', () => {
    const odd = 'a,b,c\nTreino A,Barbell Squat,5\n'
    const r = readProgramCSV(odd)
    expect(r.ok).toBe(false)
    expect(r.issues[0].code).toBe('csv-no-exercise')
    expect(r.header).toEqual(['a', 'b', 'c'])
    const mapped = readProgramCSV(odd, { map: { day: 0, exercise: 1, sets: 2 } })
    expect(mapped.ok).toBe(true)
    expect(mapped.program.days[0].exercises[0]).toMatchObject({ name: 'Barbell Squat', sets: 5 })
  })
  it('reports an empty file', () => {
    expect(readProgramCSV('').issues[0].code).toBe('csv-empty')
    expect(readProgramCSV('exercise\n').issues[0].code).toBe('csv-empty')
  })
})

describe('buildProgramFile', () => {
  it('writes a file this reader gets back unchanged', () => {
    const routines = [{ id: 'r', name: 'Push', ex: [{ id: 'x1', sets: 4, reps: 12, repsMin: 8, restSec: 90, weight: 40, note: 'n', sg: 's1' }, { id: 'x2', sets: 3, mode: 'time', sec: 45 }, { id: 'x3', sets: 3, reps: 10, sg: 's1' }] }]
    const names = { x1: 'Barbell Bench Press', x2: 'Plank', x3: 'Barbell Curl' }
    const text = buildProgramFile(routines, id => names[id], { name: 'P' })
    const r = readProgramJSON(text)
    expect(r.ok).toBe(true)
    expect(r.issues).toEqual([])
    const ex = r.program.days[0].exercises
    expect(ex[0]).toMatchObject({ name: 'Barbell Bench Press', sets: 4, reps: 12, repsMin: 8, restSec: 90, weight: 40, note: 'n' })
    expect(ex[1]).toMatchObject({ name: 'Plank', mode: 'time', sec: 45 })
    expect(ex[0].group).toBe(ex[2].group)
  })
})

describe('programme export round trips', () => {
  const routines = [
    { name: 'Push, heavy', ex: [
      { id: 'a', sets: 4, reps: 8, repsMin: 6, restSec: 120, weight: 60, note: 'slow "eccentric"', sg: 1 },
      { id: 'b', sets: 3, reps: 12, weight: 0 },
    ] },
    { name: 'Core', ex: [{ id: 'c', sets: 3, mode: 'time', sec: 45 }] },
    { name: 'Empty', ex: [] },
  ]
  const nameOf = id => ({ a: 'Bench press', b: 'Fly', c: 'Plank' })[id]
  const clean = days => days.map(d => ({ name: d.name, exercises: d.exercises.map(e => Object.fromEntries(Object.entries(e).filter(([, v]) => v != null).map(([k, v]) => [k, k === 'reps' ? String(v) : v]))) }))

  it('writes a header and one row per exercise, quoting what needs it, skipping empty routines', () => {
    const lines = buildProgramCSV(routines, nameOf).trim().split('\n')
    expect(lines[0]).toBe('Day,Exercise,Sets,Reps,Rest,Load,Notes,Superset,Seconds')
    expect(lines).toHaveLength(4)
    expect(lines[1]).toBe('"Push, heavy",Bench press,4,6-8,120,60,"slow ""eccentric""",1,')
  })
  it('reads back to the same programme as the JSON file holds', () => {
    const fromCsv = csvToProgram(buildProgramCSV(routines, nameOf))
    expect(fromCsv.ok).toBe(true)
    const fromJson = JSON.parse(buildProgramFile(routines, nameOf)).program.days
    expect(clean(fromCsv.data.program.days)).toEqual(clean(fromJson))
  })
  it('an exported CSV imports without asking for a column map', () => {
    const r = readProgramCSV(buildProgramCSV(routines, nameOf))
    expect(r.ok).toBe(true)
    expect(r.bundle.routines).toHaveLength(2)
  })
  it('a file with unusual headers can be read with a column map', () => {
    const text = 'Movimento;Qtd\nSupino;4\n'
    expect(csvToProgram(text.replace(/;/g, ',')).ok).toBe(false)
    const r = csvToProgram('Movimento,Qtd\nSupino,4\n', { map: { exercise: 0, sets: 1 } })
    expect(r.ok).toBe(true)
    expect(r.data.program.days[0].exercises[0]).toEqual({ name: 'Supino', sets: 4 })
  })
})
