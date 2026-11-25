import { describe, it, expect } from 'vitest'
import { MOBILITY_EXERCISES, MOBILITY_CATEGORIES, MOBILITY_REGIONS, MOBILITY_LEVELS, MOBILITY_TAGS, CATEGORY_LABEL, REGION_LABEL, LEVEL_LABEL, mobilityText, mobilityExercise } from './mobility-library.js'

describe('the mobility library', () => {
  it('has unique ids and only known categories, regions, levels and tags', () => {
    const ids = MOBILITY_EXERCISES.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const e of MOBILITY_EXERCISES) {
      expect(e.id.startsWith('mob-')).toBe(true)
      expect(MOBILITY_CATEGORIES, e.id).toContain(e.cat)
      expect(MOBILITY_LEVELS, e.id).toContain(e.level)
      expect(e.regions.length, e.id).toBeGreaterThan(0)
      e.regions.forEach(r => expect(MOBILITY_REGIONS, e.id).toContain(r))
      e.tags.forEach(t => expect(MOBILITY_TAGS, e.id).toContain(t))
    }
  })
  it('gives every exercise a dose of seconds or reps, never both', () => {
    for (const e of MOBILITY_EXERCISES) {
      expect(Number(!!e.dose.sec) + Number(!!e.dose.reps), e.id).toBe(1)
      expect(e.dose.sec || e.dose.reps, e.id).toBeGreaterThan(0)
    }
  })
  it('covers every category and every body region, and is not tied to one sport', () => {
    expect(new Set(MOBILITY_EXERCISES.map(e => e.cat))).toEqual(new Set(MOBILITY_CATEGORIES))
    expect(new Set(MOBILITY_EXERCISES.flatMap(e => e.regions))).toEqual(new Set(MOBILITY_REGIONS))
    const all = JSON.stringify(MOBILITY_EXERCISES).toLowerCase()
    for (const sport of ['capoeira', 'running', 'corrida', 'football', 'futebol']) expect(all).not.toContain(sport)
  })
  it('has all the required fields, in English and Portuguese', () => {
    for (const e of MOBILITY_EXERCISES) {
      for (const lang of ['en', 'pt']) {
        const x = mobilityText(e, lang)
        expect(x.name, e.id + lang).toBeTruthy()
        expect(x.description, e.id + lang).toBeTruthy()
        expect(x.start, e.id + lang).toBeTruthy()
        expect(x.steps.length, e.id + lang).toBeGreaterThanOrEqual(3)
        expect(x.mistakes.length, e.id + lang).toBeGreaterThanOrEqual(2)
        expect(x.caution, e.id + lang).toBeTruthy()
        expect(x.easier, e.id + lang).toBeTruthy()
        expect(x.harder, e.id + lang).toBeTruthy()
      }
      expect(mobilityText(e, 'pt').steps.length).toBe(mobilityText(e, 'en').steps.length)
    }
  })
  it('falls back to English for other languages, and serves pt-BR in Portuguese', () => {
    const e = MOBILITY_EXERCISES[0]
    expect(mobilityText(e, 'de').name).toBe(mobilityText(e, 'en').name)
    expect(mobilityText(e, 'pt-BR').name).toBe(mobilityText(e, 'pt').name)
    expect(mobilityText(e, 'pt').name).not.toBe(mobilityText(e, 'en').name)
  })
  it('has a label for every category, region and level', () => {
    MOBILITY_CATEGORIES.forEach(c => expect(CATEGORY_LABEL[c]).toBeTruthy())
    MOBILITY_REGIONS.forEach(r => expect(REGION_LABEL[r]).toBeTruthy())
    MOBILITY_LEVELS.forEach(l => expect(LEVEL_LABEL[l]).toBeTruthy())
  })
  it('looks an exercise up by id', () => {
    expect(mobilityExercise('mob-cat-cow').cat).toBe('joint-mobility')
    expect(mobilityExercise('nope')).toBeNull()
  })
})
