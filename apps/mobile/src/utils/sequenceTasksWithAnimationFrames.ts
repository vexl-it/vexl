import * as A from 'fp-ts/Array'
import * as RA from 'fp-ts/ReadonlyArray'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'

const requestAnimationFrameTask: T.Task<void> = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => {
      resolve()
    })
  )

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
): (tasks: Array<T.Task<Result>>) => T.Task<readonly Result[]> {
  return (tasks) => {
    // I would rather get this in a map function, but there is not A.map function that also provides the source array
    // We can use bind but this seems to be more readable
    const numberOfChunks = Math.ceil(
      tasks.length / numberToProcessBetweenAnimations
    )

    return pipe(
      tasks,
      A.chunksOf(numberToProcessBetweenAnimations),
      A.mapWithIndex((i, chunks) =>
        pipe(
          requestAnimationFrameTask,
          T.chain(() => {
            return pipe(
              T.sequenceSeqArray(chunks),
              T.map((one) => {
                onProgress((i + 1) / numberOfChunks)
                return one
              })
            )
          })
        )
      ),
      T.sequenceSeqArray,
      T.map((a) => RA.flatten(a))
    )
  }
}
