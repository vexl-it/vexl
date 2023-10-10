import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {privateApiAtom} from '../../../api'
import {atom} from 'jotai'
import {type KeyHolder} from '@vexl-next/cryptography'

const deleteInboxActionAtom = atom(
  null,
  (get, set, keyPair: KeyHolder.PrivateKeyHolder) => {
    const api = get(privateApiAtom)

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
