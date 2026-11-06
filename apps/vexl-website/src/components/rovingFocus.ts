import {Array, Option, pipe} from 'effect'

/**
 * webflow.js's link stepping in menus and dropdowns: the index to focus after
 * `key`, or undefined when the key doesn't move focus. Stepping back from the
 * first link (or from outside the list) lands on -1, which focuses nothing.
 */
export function rovingFocusIndex(
  key: string,
  links: readonly HTMLElement[]
): number | undefined {
  const current = pipe(
    links,
    Array.findFirstIndex((link) => link === document.activeElement),
    Option.getOrElse(() => -1)
  )
  switch (key) {
    case 'Home':
      return 0
    case 'End':
      return links.length - 1
    case 'ArrowLeft':
    case 'ArrowUp':
      return current - 1
    case 'ArrowRight':
    case 'ArrowDown':
      return Math.min(links.length - 1, current + 1)
    default:
      return undefined
  }
}
