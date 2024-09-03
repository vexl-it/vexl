import {type KeyHolder} from '@vexl-next/cryptography'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'

const deleteInboxActionAtom = atom(
  null,
  (get, set, keyPair: KeyHolder.PrivateKeyHolder) => {
    const api = get(apiAtom)

    return pipe(
      api.chat.deleteInbox({keyPair}),
      TE.match(
        () => {
          return false
        },
        () => {
          return true
        }
      )
    )
  }
)

export default deleteInboxActionAtom
