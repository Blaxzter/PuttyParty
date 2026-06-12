import { env, SELF } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { createGame, getDb } from '../src/db/queries'

const form = (data: Record<string, string>) =>
  ({
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data).toString(),
  }) satisfies RequestInit

async function seedGame(
  publicId: string,
  overrides: Partial<Parameters<typeof createGame>[1]> = {},
) {
  return createGame(getDb(env), {
    publicId,
    name: 'Integration Cup',
    date: '2026-08-01',
    location: 'Testplatz',
    holes: 9,
    entryMode: 'total',
    teamsEnabled: true,
    status: 'open',
    ...overrides,
  })
}

describe('public entry -> board flow', () => {
  it('writes an entry and reflects it in the board state JSON', async () => {
    const id = 'itest-flow'
    await seedGame(id)

    const submit = await SELF.fetch(
      `https://pp.test/g/${id}/entries`,
      form({ name: 'Lena Vogt', team: 'Diakonie', strokes: '35' }),
    )
    expect(submit.status).toBe(200)
    expect(await submit.text()).toContain('Eingetragen!')

    const state = await SELF.fetch(`https://pp.test/g/${id}/board/state`)
    expect(state.status).toBe(200)
    const body = (await state.json()) as { participants: number; html: string }
    expect(body.participants).toBe(1)
    expect(body.html).toContain('Lena Vogt')
  })

  it('rejects submissions to a locked game with 423', async () => {
    const id = 'itest-locked'
    await seedGame(id, { status: 'locked' })
    const res = await SELF.fetch(
      `https://pp.test/g/${id}/entries`,
      form({ name: 'X', strokes: '40' }),
    )
    expect(res.status).toBe(423)
  })
})

describe('GameRoom DO broadcast path', () => {
  it('replays the latest standings to a newly connected board over WebSocket', async () => {
    const id = 'itest-ws'
    await seedGame(id)
    // Submitting triggers notifyBoard -> DO.update -> stores latest.
    await SELF.fetch(
      `https://pp.test/g/${id}/entries`,
      form({ name: 'Andrea Moser', strokes: '37' }),
    )

    const res = await SELF.fetch(`https://pp.test/g/${id}/ws`, {
      headers: { Upgrade: 'websocket' },
    })
    expect(res.status).toBe(101)
    const ws = res.webSocket
    expect(ws).toBeTruthy()
    ws?.accept()

    const message = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('no replay within timeout')), 4000)
      ws?.addEventListener('message', (e) => {
        clearTimeout(timer)
        resolve(String(e.data))
      })
    })
    const parsed = JSON.parse(message) as { type: string; participants: number; html: string }
    expect(parsed.type).toBe('standings')
    expect(parsed.participants).toBe(1)
    expect(parsed.html).toContain('Andrea Moser')
    ws?.close()
  })
})

// Note: the /admin guard is covered deterministically in auth.test.ts with an
// explicit env. We don't re-test it through SELF here because a local .dev.vars
// (DEV_ADMIN_BYPASS=true) would otherwise leak into the test runtime.
