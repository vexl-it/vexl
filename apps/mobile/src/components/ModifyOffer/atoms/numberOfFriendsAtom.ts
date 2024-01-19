import {type ExtractLeftTE} from '@vexl-next/resources-utils/src/utils/ExtractLeft'
import {MAX_PAGE_SIZE} from '@vexl-next/rest-api/src/Pagination.brand'
import {type ContactPrivateApi} from '@vexl-next/rest-api/src/services/contact'
import {sequenceS} from 'fp-ts/Apply'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {privateApiAtom} from '../../../api'

const numberOfFriendsStorageAtom = atom<
  E.Either<
    | {_tag: 'friendsNotLoaded'}
    | ExtractLeftTE<ReturnType<ContactPrivateApi['fetchMyContacts']>>,
    {
      firstLevelFriendsCount: number
      secondLevelFriendsCount: number
    }
  >
>(E.left({_tag: 'friendsNotLoaded'} as const))

const numberOfFriendsAtom = atom(
  (get) => get(numberOfFriendsStorageAtom),
  (get, set) => {
    const api = get(privateApiAtom)

    void pipe(
      sequenceS(TE.ApplicativeSeq)({
        firstLevel: api.contact.fetchMyContacts({
          page: 0,
          limit: MAX_PAGE_SIZE,
          level: 'FIRST',
        }),
        secondLevel: api.contact.fetchMyContacts({
          page: 0,
          limit: MAX_PAGE_SIZE,
          level: 'ALL',
        }),
      }),
      TE.map((result) => {
        return {
          firstLevelFriendsCount: result.firstLevel.itemsCountTotal,
          secondLevelFriendsCount: result.secondLevel.itemsCountTotal,
        }
      }),
      T.map((result) => {
        set(numberOfFriendsStorageAtom, result)
      })
    )()
  }
)

numberOfFriendsAtom.onMount = (setAtom) => {
  setAtom()
}

export default numberOfFriendsAtom
