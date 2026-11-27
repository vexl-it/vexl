import {type OfferStatsResponse} from '@vexl-next/rest-api/src/services/offer/offerStats'
import {Effect} from 'effect'
import {atom, type Atom, type WritableAtom} from 'jotai'
import {apiAtom} from '../../../../api'

export function createOfferStatsAtoms(): {
  readonly offerStatsAtom: Atom<OfferStatsResponse | undefined>
  readonly loadOfferStatsActionAtom: WritableAtom<null, [], Effect.Effect<void>>
} {
  const offerStatsAtom = atom<OfferStatsResponse | undefined>(undefined)
  const loadOfferStatsActionAtom = atom(null, (get, set) =>
    get(apiAtom)
      .offer.getOfferStats()
      .pipe(
        Effect.timeout('5 seconds'),
        Effect.catchAll(() => Effect.succeed([])),
        Effect.tap((stats) =>
          Effect.sync(() => {
            set(offerStatsAtom, stats)
          })
        ),
        Effect.asVoid
      )
  )
  return {offerStatsAtom, loadOfferStatsActionAtom}
}
