// Entry-page enhancements:
//   1. Live-sum the per-hole inputs into the "Gesamt" total.
//   2. Persist the in-progress draft (name, team, per-hole scores) to
//      localStorage, keyed per game, so a page refresh, accidental
//      back-navigation, or a quick peek at the board doesn't wipe everything
//      already tapped in. The draft is cleared once a score is submitted.
//
// Listeners are delegated on `document` so they keep working across htmx swaps
// of #pp-entry-screen (validation re-render, success screen).

const STORAGE_PREFIX = 'pp:entry-draft:'

function gameId(): string | null {
  // The entry page always lives at /g/:publicId.
  const m = location.pathname.match(/\/g\/([^/]+)/)
  return m?.[1] ?? null
}

function storageKey(): string | null {
  const id = gameId()
  return id ? STORAGE_PREFIX + id : null
}

function entryForm(): HTMLFormElement | null {
  return document.querySelector<HTMLFormElement>('form.pp-entry-form')
}

function recomputeTotal(): void {
  const grid = document.getElementById('pp-holes')
  const totalEl = document.getElementById('pp-hole-total')
  if (!grid || !totalEl) return
  // Reaching the limit = picked up: add the penalty and light the "+n" badge.
  const limit = Number.parseInt(grid.getAttribute('data-limit') ?? '', 10)
  const penaltyRaw = Number.parseInt(grid.getAttribute('data-penalty') ?? '', 10)
  const hasLimit = Number.isFinite(limit) && limit > 0
  const penalty = Number.isFinite(penaltyRaw) ? penaltyRaw : 0
  let sum = 0
  for (const input of grid.querySelectorAll<HTMLInputElement>('input[data-hole]')) {
    const n = Number.parseInt(input.value, 10)
    const reached = hasLimit && Number.isFinite(n) && n >= limit
    const badge = input.parentElement?.querySelector<HTMLElement>('[data-hole-badge]')
    if (badge) badge.hidden = !reached
    if (Number.isFinite(n) && n > 0) sum += reached ? n + penalty : n
  }
  totalEl.textContent = String(sum)
}

function saveDraft(): void {
  const form = entryForm()
  const key = storageKey()
  if (!form || !key) return
  const data: Record<string, string> = {}
  for (const input of form.querySelectorAll<HTMLInputElement>('input[name]')) {
    if (input.value.trim()) data[input.name] = input.value
  }
  try {
    if (Object.keys(data).length > 0) localStorage.setItem(key, JSON.stringify(data))
    else localStorage.removeItem(key)
  } catch {
    /* storage unavailable (private mode / quota) — persistence is best-effort */
  }
}

function restoreDraft(): void {
  const form = entryForm()
  const key = storageKey()
  if (!form || !key) return
  let data: unknown
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return
    data = JSON.parse(raw)
  } catch {
    return
  }
  if (typeof data !== 'object' || data === null) return
  const draft = data as Record<string, unknown>
  let filled = false
  for (const input of form.querySelectorAll<HTMLInputElement>('input[name]')) {
    const value = draft[input.name]
    // Only fill blanks so a server re-render (validation errors) keeps priority.
    if (typeof value === 'string' && !input.value) {
      input.value = value
      filled = true
    }
  }
  if (filled) recomputeTotal()
}

function clearDraft(): void {
  const key = storageKey()
  if (!key) return
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

// Delegated so it survives htmx swapping out #pp-entry-screen.
document.addEventListener('input', (e) => {
  const target = e.target
  if (!(target instanceof HTMLElement) || !target.closest('form.pp-entry-form')) return
  // Clamp a per-hole input to the configured stroke cap (server also enforces it).
  if (target instanceof HTMLInputElement && target.hasAttribute('data-hole') && target.max) {
    const max = Number(target.max)
    const val = Number(target.value)
    if (Number.isFinite(max) && Number.isFinite(val) && val > max) target.value = String(max)
  }
  recomputeTotal()
  saveDraft()
})

// After htmx replaces the screen: success → clear the draft; a re-rendered
// form (validation errors) → re-apply anything still missing.
document.addEventListener('htmx:afterSwap', () => {
  const screen = document.getElementById('pp-entry-screen')
  if (screen?.classList.contains('pp-screen--success')) clearDraft()
  else restoreDraft()
})

restoreDraft()
recomputeTotal()
