import * as T from 'fp-ts/Task'
import * as E from 'fp-ts/Either'
import {flow, pipe} from 'fp-ts/function'
import * as A from 'fp-ts/ReadonlyArray'

export default function flattenTaskOfEithers<L, R>(
  taskOfEithers: T.Task<ReadonlyArray<E.Either<L, R>>>
): T.Task<{lefts: L[]; rights: R[]}> {
  return pipe(
    taskOfEithers,
    T.map(
      flow(
        A.map(
          E.fold(
            (l) => ({lefts: [l] as L[], rights: [] as R[]}),
            (r) => ({lefts: [] as L[], rights: [r] as R[]})
          )
        ),
        A.reduce(
          {
            lefts: [] as L[],
            rights: [] as R[],
          },
          (acc, curr) => ({
            lefts: [...acc.lefts, ...curr.lefts],
            rights: [...acc.rights, ...curr.rights],
          })
        )
      )
    )
  )
}
