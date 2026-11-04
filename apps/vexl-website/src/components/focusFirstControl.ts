const controls = 'button, a[href], [role="button"], [tabindex="0"]'

/** Focuses the first control inside `container`, or the container itself. */
export function focusFirstControl(container: HTMLElement | null): void {
  const control = container?.querySelector<HTMLElement>(controls)
  // The page shouldn't jump; the new control is where the old one was
  ;(control ?? container)?.focus({preventScroll: true})
}
