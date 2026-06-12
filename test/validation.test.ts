import { describe, expect, it } from 'vitest'
import {
  adminEntrySchema,
  createGameSchema,
  fieldErrors,
  perHoleEntrySchema,
  totalEntrySchema,
} from '../src/lib/validation'

describe('totalEntrySchema', () => {
  it('accepts a valid submission and nulls an empty team', () => {
    const r = totalEntrySchema.safeParse({ name: '  Lena ', team: '', strokes: '38' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.name).toBe('Lena')
      expect(r.data.team).toBeNull()
      expect(r.data.strokes).toBe(38)
    }
  })

  it('keeps a provided team', () => {
    const r = totalEntrySchema.safeParse({ name: 'Lena', team: 'Diakonie', strokes: '38' })
    expect(r.success && r.data.team).toBe('Diakonie')
  })

  it('rejects strokes < 1 with the design message', () => {
    const r = totalEntrySchema.safeParse({ name: 'Lena', strokes: '0' })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).strokes).toBe('Bitte eine Zahl ab 1 eingeben.')
  })

  it('rejects non-numeric and empty strokes', () => {
    for (const strokes of ['', 'abc', '  ']) {
      const r = totalEntrySchema.safeParse({ name: 'Lena', strokes })
      expect(r.success).toBe(false)
    }
  })

  it('rejects a missing name', () => {
    const r = totalEntrySchema.safeParse({ name: '   ', strokes: '40' })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).name).toBe('Bitte deinen Namen eingeben.')
  })
})

describe('perHoleEntrySchema', () => {
  it('accepts exactly `holes` values', () => {
    const r = perHoleEntrySchema(3).safeParse({
      name: 'Lena',
      holeStrokes: ['3', '4', '2'],
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.holeStrokes).toEqual([3, 4, 2])
  })

  it('rejects the wrong number of holes', () => {
    const r = perHoleEntrySchema(9).safeParse({ name: 'Lena', holeStrokes: ['3', '4'] })
    expect(r.success).toBe(false)
  })

  it('rejects a zero/blank hole', () => {
    const r = perHoleEntrySchema(3).safeParse({ name: 'Lena', holeStrokes: ['3', '', '2'] })
    expect(r.success).toBe(false)
  })
})

describe('createGameSchema', () => {
  it('converts a German date to ISO and applies defaults', () => {
    const r = createGameSchema.safeParse({
      name: 'Sommerfest-Cup',
      date: '28.06.2026',
      location: 'Pfadiheim',
      holes: '9',
      teamsEnabled: 'on',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.date).toBe('2026-06-28')
      expect(r.data.entryMode).toBe('total')
      expect(r.data.status).toBe('open')
      expect(r.data.teamsEnabled).toBe(true)
      expect(r.data.holes).toBe(9)
    }
  })

  it('treats an absent toggle as false', () => {
    const r = createGameSchema.safeParse({ name: 'X', date: '01.01.2026' })
    expect(r.success && r.data.teamsEnabled).toBe(false)
  })

  it('rejects an impossible date', () => {
    const r = createGameSchema.safeParse({ name: 'X', date: '31.02.2026' })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).date).toBeTruthy()
  })

  it('rejects a malformed date', () => {
    const r = createGameSchema.safeParse({ name: 'X', date: '2026-06-28' })
    expect(r.success).toBe(false)
  })
})

describe('adminEntrySchema', () => {
  it('validates an organiser-entered total', () => {
    const r = adminEntrySchema.safeParse({ name: 'Markus', team: 'Haustechnik', strokes: '38' })
    expect(r.success && r.data.strokes).toBe(38)
  })
})
