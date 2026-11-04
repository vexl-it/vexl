'use client'

import {YStack} from '@vexl-next/ui'
import type MatterJs from 'matter-js'
import React, {useEffect, useRef, useState} from 'react'

const CARD_TEXTURES = [
  '/images/card-drop01.webp',
  '/images/card-drop02.webp',
  '/images/card-drop05.webp',
  '/images/card-drop06.webp',
  '/images/card-drop07.webp',
  '/images/card-drop08.webp',
]
const TEXTURE_WIDTH = 544
const TEXTURE_HEIGHT = 138
const CANVAS_HEIGHT = 450
const MOBILE_BREAKPOINT = 768
const SPAWN_INTERVAL_MS = 1000
const WALL_THICKNESS = 100

// Keeps page scrolling working over the canvas; Matter's handlers would preventDefault
const SCROLL_EVENTS = ['wheel', 'touchstart', 'touchmove', 'touchend'] as const

function stopBeforeMatter(event: Event): void {
  event.stopImmediatePropagation()
}

function startSimulation(
  Matter: typeof MatterJs,
  canvas: HTMLCanvasElement
): () => void {
  const {Bodies, Composite, Engine, Mouse, MouseConstraint, Render, Runner} =
    Matter
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT
  const scale = isMobile ? 0.4 : 0.5
  const cardCount = isMobile ? 15 : 22

  const engine = Engine.create()
  const render = Render.create({
    canvas,
    engine,
    options: {
      width,
      height,
      pixelRatio: window.devicePixelRatio,
      background: 'transparent',
      wireframes: false,
    },
  })
  const runner = Runner.create()

  const wall = {isStatic: true, render: {visible: false}}
  Composite.add(engine.world, [
    Bodies.rectangle(
      width / 2,
      height + WALL_THICKNESS / 2,
      width * 2,
      WALL_THICKNESS,
      wall
    ),
    Bodies.rectangle(
      -WALL_THICKNESS / 2,
      height / 2,
      WALL_THICKNESS,
      height * 4,
      wall
    ),
    Bodies.rectangle(
      width + WALL_THICKNESS / 2,
      height / 2,
      WALL_THICKNESS,
      height * 4,
      wall
    ),
  ])

  SCROLL_EVENTS.forEach((type) => {
    canvas.addEventListener(type, stopBeforeMatter, {passive: true})
  })
  const mouse = Mouse.create(canvas)
  Composite.add(
    engine.world,
    MouseConstraint.create(engine, {
      mouse,
      constraint: {stiffness: 0.2, render: {visible: false}},
    })
  )
  render.mouse = mouse

  Render.run(render)
  Runner.run(runner, engine)

  const timeouts = Array.from({length: cardCount}, (_, index) =>
    setTimeout(() => {
      Composite.add(
        engine.world,
        Bodies.rectangle(
          Math.random() * width,
          -TEXTURE_HEIGHT,
          TEXTURE_WIDTH * scale,
          TEXTURE_HEIGHT * scale,
          {
            angle: Math.PI * (Math.random() * 2 - 1),
            friction: 0.3,
            frictionAir: 0.01,
            restitution: 0.7,
            render: {
              sprite: {
                texture: CARD_TEXTURES[index % CARD_TEXTURES.length] ?? '',
                xScale: scale,
                yScale: scale,
              },
            },
          }
        )
      )
    }, index * SPAWN_INTERVAL_MS)
  )

  return () => {
    timeouts.forEach(clearTimeout)
    SCROLL_EVENTS.forEach((type) => {
      canvas.removeEventListener(type, stopBeforeMatter)
    })
    Render.stop(render)
    Runner.stop(runner)
    Composite.clear(engine.world, false)
    Engine.clear(engine)
  }
}

/** Offer cards that drop in once the strip scrolls into view and can be thrown around. */
export function FallingOfferCards({
  fallback,
}: {
  readonly fallback: React.ReactNode
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reducedMotion) return

    let stop: (() => void) | undefined
    let disposed = false
    let lastWidth = window.innerWidth
    let restartTimer: ReturnType<typeof setTimeout> | undefined

    const start = (): void => {
      void import('matter-js').then(({default: Matter}) => {
        if (!disposed) stop = startSimulation(Matter, canvas)
      })
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          start()
        }
      },
      {threshold: 0.3}
    )
    observer.observe(canvas)

    // Width changes move the walls, so drop the cards again
    const onResize = (): void => {
      if (window.innerWidth === lastWidth || !stop) return
      lastWidth = window.innerWidth
      clearTimeout(restartTimer)
      restartTimer = setTimeout(() => {
        stop?.()
        stop = undefined
        start()
      }, 250)
    }
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      observer.disconnect()
      clearTimeout(restartTimer)
      window.removeEventListener('resize', onResize)
      stop?.()
    }
  }, [reducedMotion])

  if (reducedMotion) return <>{fallback}</>

  return (
    <YStack aria-hidden height={CANVAS_HEIGHT} width="100%">
      <canvas
        ref={canvasRef}
        style={{display: 'block', width: '100%', height: '100%'}}
      />
    </YStack>
  )
}
