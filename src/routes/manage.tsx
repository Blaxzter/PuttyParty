import { Hono } from 'hono'
import type { AppEnv, Env } from '../bindings'
import { getDb, getGameByManageId, listEntries } from '../db/queries'
import type { Game } from '../db/schema'
import { ManagePage } from '../ui/admin/Manage'
import { NotFoundPage } from '../ui/NotFound'
import {
  addEntry,
  editEntry,
  getEntriesPartial,
  type ManageTargets,
  removeEntry,
  removeGame,
  resetAllEntries,
  updateGameSettingsOrStatus,
} from './manageActions'

// Self-service game management via the secret capability token (/m/<token>).
// Public path (NOT behind Cloudflare Access); ownership is proven by the token.
export const manageRoutes = new Hono<AppEnv>()

const baseUrl = (env: Env): string => env.APP_BASE_URL.replace(/\/$/, '')
const basePathFor = (manageId: string): string => `/m/${manageId}`
const targetsFor = (manageId: string): ManageTargets => ({
  basePath: basePathFor(manageId),
  onArchive: basePathFor(manageId),
  onDelete: '/',
})

async function loadByManage(env: Env, manageId: string): Promise<Game | undefined> {
  return getGameByManageId(getDb(env), manageId)
}

manageRoutes.get('/:manageId', async (c) => {
  const manageId = c.req.param('manageId')
  const game = await loadByManage(c.env, manageId)
  if (!game) return c.html(<NotFoundPage message="Dieser Verwaltungs-Link ist ungültig." />, 404)
  const entries = await listEntries(getDb(c.env), game.id)
  return c.html(
    <ManagePage
      game={game}
      entries={entries}
      baseUrl={baseUrl(c.env)}
      basePath={basePathFor(manageId)}
      owner={{ manageUrl: `${baseUrl(c.env)}/m/${manageId}` }}
    />,
  )
})

manageRoutes.patch('/:manageId', async (c) => {
  const manageId = c.req.param('manageId')
  const game = await loadByManage(c.env, manageId)
  if (!game) return c.text('not_found', 404)
  return updateGameSettingsOrStatus(c, game, targetsFor(manageId))
})

manageRoutes.delete('/:manageId', async (c) => {
  const manageId = c.req.param('manageId')
  const game = await loadByManage(c.env, manageId)
  if (!game) return c.text('not_found', 404)
  return removeGame(c, game, targetsFor(manageId))
})

manageRoutes.get('/:manageId/entries', async (c) => {
  const manageId = c.req.param('manageId')
  const game = await loadByManage(c.env, manageId)
  if (!game) return c.text('not_found', 404)
  return getEntriesPartial(c, game, basePathFor(manageId))
})

manageRoutes.post('/:manageId/entries', async (c) => {
  const manageId = c.req.param('manageId')
  const game = await loadByManage(c.env, manageId)
  if (!game) return c.text('not_found', 404)
  return addEntry(c, game, basePathFor(manageId))
})

manageRoutes.patch('/:manageId/entries/:entryId', async (c) => {
  const manageId = c.req.param('manageId')
  const game = await loadByManage(c.env, manageId)
  if (!game) return c.text('not_found', 404)
  return editEntry(c, game, Number(c.req.param('entryId')), basePathFor(manageId))
})

manageRoutes.delete('/:manageId/entries/:entryId', async (c) => {
  const manageId = c.req.param('manageId')
  const game = await loadByManage(c.env, manageId)
  if (!game) return c.text('not_found', 404)
  return removeEntry(c, game, Number(c.req.param('entryId')), basePathFor(manageId))
})

manageRoutes.post('/:manageId/reset', async (c) => {
  const manageId = c.req.param('manageId')
  const game = await loadByManage(c.env, manageId)
  if (!game) return c.text('not_found', 404)
  return resetAllEntries(c, game, basePathFor(manageId))
})
