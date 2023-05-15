import {atom} from 'jotai'
import {MAX_PAGE_SIZE} from '@vexl-next/rest-api/dist/Pagination.brand'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import * as E from 'fp-ts/Either'
import {privateApiAtom} from '../../../api'
import {pipe} from 'fp-ts/function'
import {type ContactPrivateApi} from '@vexl-next/rest-api/dist/services/contact'
import {type ExtractLeftTE} from '@vexl-next/resources-utils/dist/utils/ExtractLeft'
import {sequenceS} from 'fp-ts/Apply'

const numberOfFriendsStorageAtom = atom<
  E.Either<
    | {_tag: 'initial'}
    | ExtractLeftTE<ReturnType<ContactPrivateApi['fetchMyContacts']>>,
    {
      firstLevelFriendsCount: number
      secondLevelFriendsCount: number
    }
  >
>(E.left({_tag: 'initial'} as const))

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
