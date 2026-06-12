// Entry-page enhancement: live-sum the per-hole inputs into the Gesamt total.
// (The form itself submits via htmx; this is purely cosmetic feedback.)

const grid = document.getElementById('pp-holes')
const totalEl = document.getElementById('pp-hole-total')

if (grid && totalEl) {
  const recompute = (): void => {
    let sum = 0
    for (const input of grid.querySelectorAll<HTMLInputElement>('input[data-hole]')) {
      const n = Number.parseInt(input.value, 10)
      if (Number.isFinite(n) && n > 0) sum += n
    }
    totalEl.textContent = String(sum)
  }
  grid.addEventListener('input', recompute)
  recompute()
}
