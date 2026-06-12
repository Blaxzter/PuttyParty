import { describe, expect, it } from 'vitest'
import { newManageId, newPublicId } from '../src/lib/ids'

describe('ids', () => {
  it('public ids are 12 chars and unique', () => {
    const a = newPublicId()
    const b = newPublicId()
    expect(a).toHaveLength(12)
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[0-9a-z]{12}$/)
  })

  it('manage tokens are 24 mixed-case chars and unique', () => {
    const m = newManageId()
    expect(m).toHaveLength(24)
    expect(newManageId()).not.toBe(m)
    expect(m).toMatch(/^[0-9A-Za-z]{24}$/)
  })

  it('manage tokens are longer/different from public ids', () => {
    expect(newManageId().length).toBeGreaterThan(newPublicId().length)
  })
})
