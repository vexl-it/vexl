'use client'

import {useEffect} from 'react'

// webflow.js "scroll" module: links to an `#id` on the same page scroll there
// with Webflow's distance-based duration and cubic easing instead of jumping.
const HASH = /^#[a-zA-Z0-9][\w:.-]*$/

function scrollDuration(distance: number): number {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0
  return 472.143 * Math.log(Math.abs(distance) + 125) - 2000
}

function easeInOutCubic(progress: number): number {
  return progress < 0.5
    ? 4 * progress ** 3
    : (progress - 1) * (2 * progress - 2) ** 2 + 1
}

// Webflow keeps the target below a fixed header that sits directly in <body>
function fixedHeaderHeight(): number {
  const header = document.querySelector(
    'header, body > .header, body > .w-nav:not([data-no-scroll])'
  )
  return header instanceof HTMLElement &&
    getComputedStyle(header).position === 'fixed'
    ? header.offsetHeight
    : 0
}

function animateScrollTo(to: number): void {
  const from = window.scrollY
  if (from === to) return
  const duration = scrollDuration(to - from)
  const start = Date.now()
  const step = (): void => {
    const elapsed = Date.now() - start
    window.scrollTo(
      0,
      elapsed > duration
        ? to
        : from + (to - from) * easeInOutCubic(elapsed / duration)
    )
    if (elapsed <= duration) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function onClick(event: MouseEvent): void {
  if (event.defaultPrevented || !(event.target instanceof Element)) return
  const link = event.target.closest('a[href*="#"]')
  if (!(link instanceof HTMLAnchorElement) || !HASH.test(link.hash)) return
  if (link.host + link.pathname !== location.host + location.pathname) return
  const target = document.getElementById(link.hash.slice(1))
  if (!target) return
  event.preventDefault()
  if (location.hash !== link.hash) history.pushState(null, '', link.hash)
  animateScrollTo(
    target.getBoundingClientRect().top + window.scrollY - fixedHeaderHeight()
  )
}

export function AnchorScroll(): null {
  useEffect(() => {
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
    }
  }, [])
  return null
}
