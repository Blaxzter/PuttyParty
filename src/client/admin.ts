// Admin-page enhancements: modal open/close, copy-to-clipboard toasts, print.
// Mutations themselves go through htmx (hx-post/patch/delete + HX-Redirect).

type Turnstile = { render: (el: Element | string, opts?: Record<string, unknown>) => string }

// (Re)render any Turnstile widget within `scope` that htmx swapped in — the
// implicit auto-render only fires once on script load, so a form re-rendered
// after a validation error needs an explicit render to get a fresh token.
function renderTurnstile(scope: ParentNode): void {
  const ts = (window as unknown as { turnstile?: Turnstile }).turnstile
  if (!ts) return
  for (const el of scope.querySelectorAll<HTMLElement>('.cf-turnstile')) {
    if (el.childElementCount > 0) continue // already has its iframe
    try {
      ts.render(el)
    } catch {
      /* widget not ready yet */
    }
  }
}

function showToast(message: string): void {
  const el = document.createElement('div')
  el.className = 'pp-toast'
  el.setAttribute('role', 'status')
  const check = document.createElement('span')
  check.className = 'check'
  check.textContent = '✓'
  el.appendChild(check)
  el.appendChild(document.createTextNode(message))
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1700)
}

function openModal(id: string): void {
  document.getElementById(id)?.classList.add('is-open')
}
function closeModal(el: Element): void {
  el.closest('.pp-modal-backdrop')?.classList.remove('is-open')
}

// In the game form, the number of holes only matters when scoring per hole, so
// hide "Anzahl Bahnen" while "Gesamtschläge" (total) is selected.
function syncHolesVisibility(scope: ParentNode): void {
  const group = scope.querySelector<HTMLElement>('[data-entry-mode]')
  const holes = scope.querySelector<HTMLElement>('[data-holes-field]')
  if (!group || !holes) return
  const checked = group.querySelector<HTMLInputElement>('input[name="entryMode"]:checked')
  holes.hidden = checked?.value !== 'per_hole'
}

document.addEventListener('change', (event) => {
  const target = event.target as HTMLElement
  if (target instanceof HTMLInputElement && target.name === 'entryMode') {
    const form = target.closest<HTMLElement>('form') ?? document
    syncHolesVisibility(form)
  }
})

// ---- Themed date picker (calendar popover) ----
// The picker enhances a typeable TT.MM.JJJJ text input ([data-dp-input]) inside a
// [data-datepicker] wrapper. Everything is driven by event delegation so it keeps
// working after htmx swaps the modal body in/out — there is nothing to re-bind.

const DP_MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]
const DP_WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

/** The .pp-datepicker whose calendar is currently open, or null. */
let dpOpen: HTMLElement | null = null

function dpPad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function dpFormat(y: number, m: number, d: number): string {
  return `${dpPad2(d)}.${dpPad2(m)}.${y}`
}

/** "DD.MM.YYYY" -> {y, m, d} (1-based month), or null if not a real date. */
function dpParse(s: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s.trim())
  if (!match) return null
  const d = Number(match[1])
  const m = Number(match[2])
  const y = Number(match[3])
  const dt = new Date(y, m - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null
  return { y, m, d }
}

/** Monday-first weekday index (0=Mon … 6=Sun) for a JS getDay() value. */
function dpMondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7
}

/** Render the calendar grid for `year`/`month` (0-based) into `cal`. */
function dpRender(cal: HTMLElement, year: number, month: number): void {
  const dp = cal.parentElement
  const input = dp?.querySelector<HTMLInputElement>('[data-dp-input]')
  const sel = input ? dpParse(input.value) : null
  const now = new Date()
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`

  cal.dataset.y = String(year)
  cal.dataset.m = String(month)

  const lead = dpMondayIndex(new Date(year, month, 1).getDay())
  const start = new Date(year, month, 1 - lead)

  // Single roving tab stop, by priority: the selected day, else today (when
  // this month is on screen), else the 1st of the month. Tracked separately so
  // priority wins regardless of grid order (today comes after the 1st).
  let selKey = ''
  let todayInMonthKey = ''
  let firstKey = ''
  const cells: string[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const yy = d.getFullYear()
    const mm = d.getMonth()
    const dd = d.getDate()
    const inMonth = mm === month
    const key = dpFormat(yy, mm + 1, dd)
    const isToday = `${yy}-${mm}-${dd}` === todayKey
    const isSel = !!sel && sel.y === yy && sel.m === mm + 1 && sel.d === dd
    const cls = ['pp-cal__day']
    if (!inMonth) cls.push('pp-cal__day--out')
    if (i % 7 >= 5) cls.push('pp-cal__day--we')
    if (isToday) cls.push('pp-cal__day--today')
    if (isSel) cls.push('pp-cal__day--selected')
    if (isSel) selKey = key
    if (isToday && inMonth) todayInMonthKey = key
    if (inMonth && dd === 1) firstKey = key
    cells.push(
      `<button type="button" class="${cls.join(' ')}" data-dp-day="${key}" tabindex="-1"${isSel ? ' aria-current="date"' : ''}>${dd}</button>`,
    )
  }
  const tabKey = selKey || todayInMonthKey || firstKey

  cal.innerHTML =
    `<div class="pp-cal__head">` +
    `<button type="button" class="pp-cal__nav" data-dp-prev aria-label="Voriger Monat">‹</button>` +
    `<div class="pp-cal__title">${DP_MONTHS[month]} ${year}</div>` +
    `<button type="button" class="pp-cal__nav" data-dp-next aria-label="Nächster Monat">›</button>` +
    `</div>` +
    `<div class="pp-cal__grid">` +
    DP_WEEKDAYS.map((w) => `<div class="pp-cal__wd">${w}</div>`).join('') +
    cells.join('') +
    `</div>` +
    `<div class="pp-cal__foot">` +
    `<button type="button" class="pp-cal__today-btn" data-dp-today>Heute</button>` +
    `</div>`

  const tab =
    (tabKey && cal.querySelector<HTMLElement>(`[data-dp-day="${tabKey}"]`)) ||
    cal.querySelector<HTMLElement>('[data-dp-day]')
  tab?.setAttribute('tabindex', '0')
}

function dpClose(): void {
  if (!dpOpen) return
  dpOpen.querySelector('.pp-cal')?.remove()
  dpOpen.querySelector('[data-dp-toggle]')?.setAttribute('aria-expanded', 'false')
  dpOpen = null
}

function dpOpenFor(dp: HTMLElement): void {
  if (dpOpen === dp) {
    dpClose()
    return
  }
  dpClose()
  const input = dp.querySelector<HTMLInputElement>('[data-dp-input]')
  const sel = input ? dpParse(input.value) : null
  const now = new Date()
  const cal = document.createElement('div')
  cal.className = 'pp-cal'
  cal.setAttribute('role', 'dialog')
  cal.setAttribute('aria-label', 'Datum wählen')
  dp.appendChild(cal)
  dp.querySelector('[data-dp-toggle]')?.setAttribute('aria-expanded', 'true')
  dpOpen = dp
  dpRender(cal, sel ? sel.y : now.getFullYear(), sel ? sel.m - 1 : now.getMonth())
  cal.querySelector<HTMLElement>('[data-dp-day][tabindex="0"]')?.focus()
}

/** Write a German date string into the input, fire change, and close. */
function dpSelect(dp: HTMLElement, value: string): void {
  const input = dp.querySelector<HTMLInputElement>('[data-dp-input]')
  if (input) {
    input.value = value
    input.classList.remove('pp-input--invalid')
    input.removeAttribute('aria-invalid')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }
  const toggle = dp.querySelector<HTMLElement>('[data-dp-toggle]')
  dpClose()
  toggle?.focus()
}

function dpShiftMonth(cal: HTMLElement, delta: number): void {
  const d = new Date(Number(cal.dataset.y), Number(cal.dataset.m) + delta, 1)
  dpRender(cal, d.getFullYear(), d.getMonth())
  cal.querySelector<HTMLElement>(delta < 0 ? '[data-dp-prev]' : '[data-dp-next]')?.focus()
}

/** Move keyboard focus to `date`, re-rendering the month first if needed. */
function dpFocusDate(cal: HTMLElement, date: Date): void {
  const y = date.getFullYear()
  const m = date.getMonth()
  if (Number(cal.dataset.y) !== y || Number(cal.dataset.m) !== m) dpRender(cal, y, m)
  const btn = cal.querySelector<HTMLElement>(
    `[data-dp-day="${dpFormat(y, m + 1, date.getDate())}"]`,
  )
  if (!btn) return
  for (const b of cal.querySelectorAll<HTMLElement>('[data-dp-day]'))
    b.setAttribute('tabindex', '-1')
  btn.setAttribute('tabindex', '0')
  btn.focus()
}

document.addEventListener('keydown', (event) => {
  if (!dpOpen) return
  const cal = dpOpen.querySelector<HTMLElement>('.pp-cal')
  if (!cal) return
  if (event.key === 'Escape') {
    const toggle = dpOpen.querySelector<HTMLElement>('[data-dp-toggle]')
    dpClose()
    toggle?.focus()
    event.preventDefault()
    return
  }
  const focused = document.activeElement as HTMLElement | null
  const day = focused?.closest<HTMLElement>('[data-dp-day]')
  if (!day) return
  const cur = dpParse(day.dataset.dpDay ?? '')
  if (!cur) return
  let next: Date | null = null
  switch (event.key) {
    case 'ArrowLeft':
      next = new Date(cur.y, cur.m - 1, cur.d - 1)
      break
    case 'ArrowRight':
      next = new Date(cur.y, cur.m - 1, cur.d + 1)
      break
    case 'ArrowUp':
      next = new Date(cur.y, cur.m - 1, cur.d - 7)
      break
    case 'ArrowDown':
      next = new Date(cur.y, cur.m - 1, cur.d + 7)
      break
    case 'PageUp':
      next = new Date(cur.y, cur.m - 2, cur.d)
      break
    case 'PageDown':
      next = new Date(cur.y, cur.m, cur.d)
      break
    default:
      return
  }
  event.preventDefault()
  dpFocusDate(cal, next)
})

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement

  // Date picker: toggle / day / month-nav / today, then outside-to-close.
  const dpToggle = target.closest<HTMLElement>('[data-dp-toggle]')
  if (dpToggle) {
    const dp = dpToggle.closest<HTMLElement>('[data-datepicker]')
    if (dp) dpOpenFor(dp)
    return
  }
  if (dpOpen) {
    const cal = dpOpen.querySelector<HTMLElement>('.pp-cal')
    const day = target.closest<HTMLElement>('[data-dp-day]')
    if (day) {
      dpSelect(dpOpen, day.dataset.dpDay ?? '')
      return
    }
    if (cal && target.closest('[data-dp-prev]')) {
      dpShiftMonth(cal, -1)
      return
    }
    if (cal && target.closest('[data-dp-next]')) {
      dpShiftMonth(cal, 1)
      return
    }
    if (target.closest('[data-dp-today]')) {
      const t = new Date()
      dpSelect(dpOpen, dpFormat(t.getFullYear(), t.getMonth() + 1, t.getDate()))
      return
    }
    // A click anywhere outside the open picker dismisses it (then falls
    // through so the same click can still operate other controls).
    if (!target.closest('[data-datepicker]')) dpClose()
  }

  const opener = target.closest<HTMLElement>('[data-open-modal]')
  if (opener) {
    openModal(opener.dataset.openModal ?? '')
    return
  }
  if (target.closest('[data-close-modal]')) {
    closeModal(target)
    return
  }
  // Click on the dimmed backdrop (outside the modal box) closes it.
  if (target.classList.contains('pp-modal-backdrop')) {
    target.classList.remove('is-open')
    return
  }
  const copyEl = target.closest<HTMLElement>('[data-copy]')
  if (copyEl) {
    const value = copyEl.dataset.copy ?? ''
    const label = copyEl.dataset.copyLabel ?? 'Link kopiert'
    navigator.clipboard?.writeText(value).then(
      () => showToast(label),
      () => showToast('Kopieren nicht möglich'),
    )
    return
  }
  if (target.closest('[data-print]')) {
    window.print()
  }
})

// Focus the first input when the entries table swaps in an add/edit row.
document.body.addEventListener('htmx:afterSwap', (event) => {
  const detail = (event as CustomEvent<{ target?: HTMLElement }>).detail
  const swapped = detail?.target
  if (swapped?.id === 'pp-entries' || swapped?.id === 'pp-modal-body') {
    swapped.querySelector<HTMLInputElement>('input[autofocus], input')?.focus()
  }
  if (swapped?.id === 'pp-modal-body') renderTurnstile(swapped)
  if (swapped) syncHolesVisibility(swapped)
})

// Set the initial holes visibility for any game form present on load.
syncHolesVisibility(document)
