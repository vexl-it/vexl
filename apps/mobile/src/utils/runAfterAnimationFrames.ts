function runAfterAnimationFrames({
  callback,
  frames,
}: {
  readonly callback: () => void
  readonly frames: number
}): () => void {
  let animationFrame: number | undefined
  let cancelled = false

  function scheduleNextFrame(framesLeft: number): void {
    animationFrame = requestAnimationFrame(() => {
      if (cancelled) return

      if (framesLeft <= 1) {
        callback()
        return
      }

      scheduleNextFrame(framesLeft - 1)
    })
  }

  scheduleNextFrame(frames)

  return () => {
    cancelled = true
    if (animationFrame !== undefined) {
      cancelAnimationFrame(animationFrame)
    }
  }
}

export function runAfterAnimationFrame(callback: () => void): () => void {
  return runAfterAnimationFrames({callback, frames: 1})
}

export function runAfterTwoAnimationFrames(callback: () => void): () => void {
  return runAfterAnimationFrames({callback, frames: 2})
}
