import {Array, Effect} from 'effect'

const requestAnimationFrameEffect: Effect.Effect<void, never, never> =
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  Effect.async<void>((resume) => {
    requestAnimationFrame(() => {
      resume(Effect.void)
    })
  })

/**
 * A method that sequences tasks and calls requestAnimationFrame between items. Make sure to tweak numberToProcessBetweenAnimations
 * to get the best performance - if set too low, the operation will take unnecessary long time. If set too high, the animation will
 * be janky.
 *
 * @param {number} numberToProcessBetweenAnimations - The number of tasks to process between animation frames.
 * @param {Function} [onProgress=()=>{}] - A callback function that will be called with the progress percentage.
 */
export default function sequenceTasksWithAnimationFrames<Result>(
  numberToProcessBetweenAnimations: number,
  onProgress: (progress: number) => void = () => {}
): (
  effects: Array<Effect.Effect<Result, never, never>>
) => Effect.Effect<readonly Result[], never, never> {
  return (effects) => {
    // I would rather get this in a map function, but there is not A.map function that also provides the source array
    // We can use bind but this seems to be more readable
    const numberOfChunks = Math.ceil(
      effects.length / numberToProcessBetweenAnimations
    )

    return Effect.gen(function* (_) {
      const chunks = Array.chunksOf(effects, numberToProcessBetweenAnimations)
      const results: Result[][] = []

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        if (!chunk) continue

        yield* _(requestAnimationFrameEffect)
        const chunkResults = yield* _(Effect.all(chunk, {concurrency: 1}))
        onProgress((i + 1) / numberOfChunks)
        results.push(chunkResults as Result[])
      }

      return Array.flatten(results) as readonly Result[]
    })
  }
}
