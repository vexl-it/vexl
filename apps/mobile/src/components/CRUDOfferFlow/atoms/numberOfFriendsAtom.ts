import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {MAX_PAGE_SIZE} from '@vexl-next/rest-api/src/Pagination.brand'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type Effect} from 'effect'
import {sequenceS} from 'fp-ts/Apply'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'

const numberOfFriendsStorageAtom = atom<
  E.Either<
    | {_tag: 'friendsNotLoaded'}
    | Effect.Effect.Error<ReturnType<ContactApi['fetchMyContacts']>>,
    {
      firstLevelFriendsCount: number
      secondLevelFriendsCount: number
    }
  >
>(E.left({_tag: 'friendsNotLoaded'} as const))

const numberOfFriendsAtom = atom(
  (get) => get(numberOfFriendsStorageAtom),
  (get, set) => {
    const api = get(apiAtom)

    void pipe(
      sequenceS(TE.ApplicativeSeq)({
        firstLevel: effectToTaskEither(
          api.contact.fetchMyContacts({
            query: {
              page: 0,
              limit: MAX_PAGE_SIZE,
              level: 'FIRST',
            },
          })
        ),
        secondLevel: effectToTaskEither(
          api.contact.fetchMyContacts({
            query: {
              page: 0,
              limit: MAX_PAGE_SIZE,
              level: 'ALL',
            },
          })
        ),
      }),
      TE.map((result) => {
        return {
          firstLevelFriendsCount: result.firstLevel.itemsCountTotal,
          secondLevelFriendsCount: result.secondLevel.itemsCountTotal,
        }
      })
    )()
  }
)

numberOfFriendsAtom.onMount = (setAtom) => {
  setAtom()
}

export default numberOfFriendsAtom
