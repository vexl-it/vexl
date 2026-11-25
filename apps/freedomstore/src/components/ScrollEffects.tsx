'use client'

import {Array} from 'effect'
import {gsap} from 'gsap'
import {ScrollToPlugin} from 'gsap/ScrollToPlugin'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {SplitText} from 'gsap/SplitText'
import {useEffect} from 'react'

const HASH = /^#[a-zA-Z0-9][\w:.-]*$/

// Webflow's distance-based anchor scroll duration in seconds
function anchorScrollDuration(
  distance: number,
  reducedMotion: boolean
): number {
  if (reducedMotion) return 0
  const ms = 472.143 * Math.log(Math.abs(distance) + 125) - 2000
  return Math.max(ms, 0) / 1000
}

function focusWithoutScroll(target: HTMLElement): void {
  if (target.getAttribute('tabindex') === null) {
    target.setAttribute('tabindex', '-1')
    target.addEventListener(
      'blur',
      () => {
        target.removeAttribute('tabindex')
      },
      {once: true}
    )
  }
  target.focus({preventScroll: true})
}

function setupScrollProgressBar(reducedMotion: boolean): () => void {
  const progressBar = document.querySelector('.progress-bar')
  const progressBarWrap = document.querySelector('.progress-bar-wrap')
  if (
    !(progressBar instanceof HTMLElement) ||
    !(progressBarWrap instanceof HTMLElement)
  ) {
    return () => undefined
  }

  gsap.to(progressBar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: reducedMotion ? true : 0.5,
    },
  })

  const onClick = (event: MouseEvent): void => {
    const progress = event.clientX / progressBarWrap.offsetWidth
    const scrollPosition =
      progress * (document.body.scrollHeight - window.innerHeight)
    gsap.to(window, {
      scrollTo: scrollPosition,
      duration: reducedMotion ? 0 : 0.725,
      ease: 'power3.out',
    })
  }

  progressBarWrap.addEventListener('click', onClick)
  return () => {
    progressBarWrap.removeEventListener('click', onClick)
  }
}

function setupAnchorScroll(reducedMotion: boolean): () => void {
  const onClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || !(event.target instanceof Element)) return
    const link = event.target.closest('a[href*="#"]')
    if (!(link instanceof HTMLAnchorElement) || !HASH.test(link.hash)) return
    if (link.host + link.pathname !== location.host + location.pathname) return
    const target = document.getElementById(link.hash.slice(1))
    if (!target) return
    event.preventDefault()
    if (location.hash !== link.hash) history.pushState(null, '', link.hash)
    const targetY = target.getBoundingClientRect().top + window.scrollY
    const duration = anchorScrollDuration(
      targetY - window.scrollY,
      reducedMotion
    )
    if (duration === 0) {
      window.scrollTo(0, targetY)
      focusWithoutScroll(target)
      return
    }
    gsap.to(window, {
      scrollTo: {y: targetY, autoKill: true},
      duration,
      ease: 'power2.inOut',
      onComplete: () => {
        focusWithoutScroll(target)
      },
    })
  }

  document.addEventListener('click', onClick)
  return () => {
    document.removeEventListener('click', onClick)
  }
}

function setupBackgroundVideos(mediaQuery: MediaQueryList): () => void {
  const videos = Array.fromIterable(
    document.querySelectorAll('video[data-bg-video]')
  )

  const syncPlayback = (): void => {
    Array.forEach(videos, (video) => {
      if (!(video instanceof HTMLVideoElement)) return
      if (mediaQuery.matches) {
        video.pause()
      } else {
        void video.play().catch(() => undefined)
      }
    })
  }

  syncPlayback()
  mediaQuery.addEventListener('change', syncPlayback)
  return () => {
    mediaQuery.removeEventListener('change', syncPlayback)
  }
}

function heroScaleForProgress(progress: number): number {
  if (progress <= 0.51) return 1
  if (progress >= 0.57) return 0.95
  return 1 - ((progress - 0.51) / 0.06) * 0.05
}

function setupHeroScale(): () => void {
  const hero = document.getElementById('TOP')
  if (!hero) return () => undefined

  // Matches Webflow IX2 e-72/a-9: 50% smoothing closes half the remaining
  // in-view progress gap each frame, scaling 1 -> 0.95 across 51%..57%.
  let targetProgress = 0
  let currentProgress = 0
  let initialized = false
  let rafId: number | null = null

  const tick = (): void => {
    rafId = null
    const delta = targetProgress - currentProgress
    if (Math.abs(delta) < 0.0001) {
      currentProgress = targetProgress
    } else {
      currentProgress += delta * 0.5
      rafId = window.requestAnimationFrame(tick)
    }
    gsap.set(hero, {scale: heroScaleForProgress(currentProgress)})
  }

  ScrollTrigger.create({
    trigger: hero,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      targetProgress = self.progress
      if (!initialized) {
        initialized = true
        currentProgress = self.progress
        gsap.set(hero, {scale: heroScaleForProgress(currentProgress)})
        return
      }
      if (rafId === null) {
        rafId = window.requestAnimationFrame(tick)
      }
    },
  })

  return () => {
    if (rafId !== null) window.cancelAnimationFrame(rafId)
  }
}

function setupMarquee(): () => void {
  const cleanups: Array<() => void> = []
  const marquees = Array.fromIterable(
    document.querySelectorAll('[data-marquee-scroll-direction-target]')
  )

  Array.forEach(marquees, (marquee) => {
    if (!(marquee instanceof HTMLElement)) return
    const marqueeContent = marquee.querySelector(
      '[data-marquee-collection-target]'
    )
    const marqueeScroll = marquee.querySelector('[data-marquee-scroll-target]')
    if (
      !(marqueeContent instanceof HTMLElement) ||
      !(marqueeScroll instanceof HTMLElement)
    ) {
      return
    }

    const speedAttr = Number.parseFloat(marquee.dataset.marqueeSpeed ?? '15')
    const directionAttr = marquee.dataset.marqueeDirection === 'right' ? 1 : -1
    const duplicateAmount = Number.parseInt(
      marquee.dataset.marqueeDuplicate ?? '0',
      10
    )
    const scrollSpeedAttr = Number.parseFloat(
      marquee.dataset.marqueeScrollSpeed ?? '10'
    )
    const speedMultiplier =
      window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1
    const duration =
      speedAttr *
      (marqueeContent.offsetWidth / window.innerWidth) *
      speedMultiplier

    marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`
    marqueeScroll.style.width = `${scrollSpeedAttr * 2 + 100}%`

    const clones: HTMLElement[] = []
    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment()
      for (let i = 0; i < duplicateAmount; i += 1) {
        const clone = marqueeContent.cloneNode(true)
        if (clone instanceof HTMLElement) {
          clone.setAttribute('aria-hidden', 'true')
          clone.setAttribute('data-marquee-clone', 'true')
          clones.push(clone)
          fragment.appendChild(clone)
        }
      }
      marqueeScroll.appendChild(fragment)
    }

    const marqueeItems = Array.fromIterable(
      marquee.querySelectorAll('[data-marquee-collection-target]')
    )
    const animation = gsap
      .fromTo(
        marqueeItems,
        {xPercent: 0},
        {
          xPercent: -100,
          repeat: -1,
          duration: Math.max(duration, 1),
          ease: 'none',
        }
      )
      .totalProgress(0.5)

    animation.timeScale(directionAttr)
    animation.play()
    marquee.setAttribute('data-marquee-status', 'normal')

    ScrollTrigger.create({
      trigger: marquee,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const isInverted = self.direction === 1
        const currentDirection = isInverted ? -directionAttr : directionAttr
        animation.timeScale(currentDirection)
        marquee.setAttribute(
          'data-marquee-status',
          isInverted ? 'normal' : 'inverted'
        )
      },
    })

    const scrollStart =
      directionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr
    const scrollEnd = -scrollStart
    gsap
      .timeline({
        scrollTrigger: {
          trigger: marquee,
          start: '0% 100%',
          end: '100% 0%',
          scrub: 0,
        },
      })
      .fromTo(
        marqueeScroll,
        {x: `${scrollStart}vw`},
        {x: `${scrollEnd}vw`, ease: 'none'}
      )

    cleanups.push(() => {
      Array.forEach(clones, (clone) => {
        clone.remove()
      })
      marqueeScroll.style.marginLeft = ''
      marqueeScroll.style.width = ''
    })
  })

  return () => {
    Array.forEach(cleanups, (cleanup) => {
      cleanup()
    })
  }
}

function setupStickyTitles(): () => void {
  const splits: SplitText[] = []
  const wraps = Array.fromIterable(
    document.querySelectorAll('[data-sticky-title="wrap"]')
  )

  Array.forEach(wraps, (wrap) => {
    if (!(wrap instanceof HTMLElement)) return
    const headings = Array.fromIterable(
      wrap.querySelectorAll('[data-sticky-title="heading"]')
    )
    if (!Array.isNonEmptyArray(headings)) return

    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: 'top 40%',
        end: 'bottom bottom',
        scrub: true,
      },
    })

    const revealDuration = 0.7
    const fadeOutDuration = 0.7
    const overlapOffset = 0.15

    Array.forEach(headings, (heading, index) => {
      if (!(heading instanceof HTMLElement)) return
      heading.setAttribute('aria-label', heading.textContent ?? '')

      const split = new SplitText(heading, {type: 'words,chars'})
      splits.push(split)
      Array.forEach(split.words, (word) => {
        word.setAttribute('aria-hidden', 'true')
      })

      gsap.set(heading, {visibility: 'visible'})

      const headingTl = gsap.timeline()
      headingTl.from(split.chars, {
        autoAlpha: 0,
        stagger: {amount: revealDuration, from: 'start'},
        duration: revealDuration,
      })

      if (index < headings.length - 1) {
        headingTl.to(split.chars, {
          autoAlpha: 0,
          stagger: {amount: fadeOutDuration, from: 'end'},
          duration: fadeOutDuration,
        })
      }

      if (index === 0) {
        masterTl.add(headingTl)
      } else {
        masterTl.add(headingTl, `-=${overlapOffset}`)
      }
    })
  })

  return () => {
    Array.forEach(splits, (split) => {
      split.revert()
    })
  }
}

function setupSlideInElements(): () => void {
  const elements = Array.fromIterable(
    document.querySelectorAll('.heading-left, .heading-right, [data-slide-in]')
  )
  const targets = Array.filter(
    elements,
    (element): element is HTMLElement => element instanceof HTMLElement
  )
  if (!Array.isNonEmptyArray(targets)) return () => undefined

  const delays = new Map<HTMLElement, number>()
  Array.forEach(targets, (element) => {
    const explicitDelay = element.dataset.slideInDelay
    const delay =
      explicitDelay !== undefined
        ? Number.parseFloat(explicitDelay)
        : element.classList.contains('heading-right')
          ? 0.03
          : 0
    delays.set(element, Number.isFinite(delay) ? delay : 0)
    // Keep the untransformed position until intersection so viewport entry is
    // measured from the element's real layout box and offscreen jumps don't trigger it.
    gsap.set(element, {opacity: 0})
  })

  const observer = new IntersectionObserver((entries) => {
    Array.forEach(entries, (entry) => {
      if (!entry.isIntersecting || !(entry.target instanceof HTMLElement))
        return
      const target = entry.target
      observer.unobserve(target)
      gsap.fromTo(
        target,
        {opacity: 0, y: 100},
        {
          opacity: 1,
          y: 0,
          duration: 1,
          delay: delays.get(target) ?? 0,
          ease: 'power3.out',
        }
      )
    })
  })

  Array.forEach(targets, (target) => {
    observer.observe(target)
  })

  return () => {
    observer.disconnect()
  }
}

export function ScrollEffects(): null {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText, ScrollToPlugin)
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    )
    const reducedMotion = reducedMotionQuery.matches

    let isMounted = true
    let cleanupProgress: (() => void) | undefined
    let cleanupAnchors: (() => void) | undefined
    let cleanupVideos: (() => void) | undefined
    let cleanupHero: (() => void) | undefined
    let cleanupMarquee: (() => void) | undefined
    let cleanupSlideIns: (() => void) | undefined
    let cleanupSticky: (() => void) | undefined

    const ctx = gsap.context(() => {
      cleanupProgress = setupScrollProgressBar(reducedMotion)
      cleanupAnchors = setupAnchorScroll(reducedMotion)
      cleanupVideos = setupBackgroundVideos(reducedMotionQuery)
      if (!reducedMotion) {
        cleanupHero = setupHeroScale()
        cleanupMarquee = setupMarquee()
        cleanupSlideIns = setupSlideInElements()
      }
    })

    if (!reducedMotion) {
      // SplitText character layout depends on the loaded web font metrics
      void document.fonts.ready.then(() => {
        if (!isMounted) return
        ctx.add(() => {
          cleanupSticky = setupStickyTitles()
        })
        ScrollTrigger.refresh()
      })
    }

    return () => {
      isMounted = false
      cleanupSticky?.()
      cleanupSlideIns?.()
      cleanupMarquee?.()
      cleanupHero?.()
      cleanupVideos?.()
      cleanupAnchors?.()
      cleanupProgress?.()
      ctx.revert()
    }
  }, [])

  return null
}
