'use client'

import {Array, pipe} from 'effect'
import {
  Bodies,
  Composite,
  Engine,
  Mouse,
  MouseConstraint,
  Render,
  Runner,
} from 'matter-js'
import React, {useEffect, useRef} from 'react'

const TEXTURES = [
  '/wf/62fcffbfd26facbfb5882182_drop05.webp',
  '/wf/62fcffbfd26fac85a3882181_drop08.webp',
  '/wf/62fcffbf4544ed408c2e3408_drop06.webp',
  '/wf/62fcffbf72b68d15eb6cc417_drop02.webp',
  '/wf/62fcffbf322bf94a52a7ab86_drop07.webp',
  '/wf/62fcffbf350bd3035651b9fd_drop01.webp',
]

interface Scene {
  readonly engine: Engine
  readonly runner: Runner
  readonly render: Render
  readonly timeouts: ReadonlyArray<ReturnType<typeof setTimeout>>
}

/** Drops a cycle of textured cards onto an invisible ground, once per second. */
function buildScene(canvas: HTMLCanvasElement): Scene {
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  const isMobile = window.innerWidth < 768
  const scale = isMobile ? 0.4 : 0.5
  const cycle = isMobile ? 15 : 22

  const engine = Engine.create()
  const runner = Runner.create()
  const render = Render.create({
    canvas,
    engine,
    options: {
      width: w,
      height: h,
      background: 'transparent',
      wireframes: false,
    },
  })

  const ground = Bodies.rectangle(w / 2, h, w, 4, {
    isStatic: true,
    render: {fillStyle: 'transparent', strokeStyle: 'transparent'},
  })

  const mouse = Mouse.create(render.canvas)
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: {stiffness: 0.2, render: {visible: false}},
  })
  render.mouse = mouse

  Composite.add(engine.world, [ground, mouseConstraint])

  Render.run(render)
  Runner.run(runner, engine)

  let count = 1
  const spawn = (): void => {
    const body = Bodies.rectangle(
      Math.round(Math.random() * w),
      -137,
      272,
      69,
      {
        angle: Math.PI * (Math.random() * 2 - 1),
        friction: 0.3,
        frictionAir: 0.01,
        restitution: 0.7,
        render: {
          sprite: {
            texture: TEXTURES[count] ?? '',
            xScale: scale,
            yScale: scale,
          },
        },
      }
    )
    count = count < 5 ? count + 1 : 0
    Composite.add(engine.world, body)
  }

  const timeouts = pipe(
    Array.range(0, cycle - 1),
    Array.map((i) => setTimeout(spawn, i * 1000))
  )

  return {engine, runner, render, timeouts}
}

function destroyScene({engine, runner, render, timeouts}: Scene): void {
  Array.forEach(timeouts, clearTimeout)
  Render.stop(render)
  Runner.stop(runner)
  Composite.clear(engine.world, false)
  Engine.clear(engine)
  render.context.clearRect(0, 0, render.canvas.width, render.canvas.height)
}

/** The homepage's falling cards; starts when 30% visible, rebuilds when the width changes. */
export function MatterCanvas(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let scene: Scene | undefined
    let resizeTimer: ReturnType<typeof setTimeout> | undefined
    let lastWidth = window.innerWidth

    const destroy = (): void => {
      if (scene) destroyScene(scene)
      scene = undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        Array.forEach(entries, (entry) => {
          if (entry.isIntersecting && !scene) scene = buildScene(canvas)
        })
      },
      {threshold: 0.3}
    )
    observer.observe(canvas)

    const onResize = (): void => {
      // ignore the mobile address bar showing and hiding
      if (window.innerWidth === lastWidth) return
      lastWidth = window.innerWidth

      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        const rect = canvas.getBoundingClientRect()
        const inView = rect.top < window.innerHeight && rect.bottom > 0
        destroy()
        if (inView) scene = buildScene(canvas)
      }, 250)
    }
    window.addEventListener('resize', onResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onResize)
      clearTimeout(resizeTimer)
      destroy()
    }
  }, [])

  return <canvas ref={canvasRef} className="matter-js-canvas" />
}
