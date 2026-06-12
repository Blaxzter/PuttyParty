// Admin-page enhancements: modal open/close, copy-to-clipboard toasts, print.
// Mutations themselves go through htmx (hx-post/patch/delete + HX-Redirect).

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

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement
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
})
