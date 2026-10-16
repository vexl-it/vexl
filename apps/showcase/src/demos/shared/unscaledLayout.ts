import {setOnLayoutStrategy} from 'tamagui'

/**
 * Phone screens are scaled down with a CSS transform, but Tamagui and react-native-web
 * measure `onLayout` with `getBoundingClientRect()`, which includes it. Inside the phone
 * viewport, report rects in the unscaled screen size instead. The sync strategy makes
 * Tamagui measure through this method rather than through IntersectionObserver entries.
 */
export function measureLayoutUnscaled(): void {
  setOnLayoutStrategy('sync')
  const measure = Element.prototype.getBoundingClientRect
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const rect = measure.call(this)
    const viewport = this.closest('.phone-viewport')
    if (!(viewport instanceof HTMLElement) || viewport.offsetWidth === 0) {
      return rect
    }
    const origin = measure.call(viewport)
    const scale = origin.width / viewport.offsetWidth
    if (scale === 0) return rect
    return new DOMRect(
      origin.left + (rect.left - origin.left) / scale,
      origin.top + (rect.top - origin.top) / scale,
      rect.width / scale,
      rect.height / scale
    )
  }
}
