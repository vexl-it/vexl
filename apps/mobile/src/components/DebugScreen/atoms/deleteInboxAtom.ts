import {type KeyHolder} from '@vexl-next/cryptography'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'

const deleteInboxActionAtom = atom(
  null,
  (get, set, keyPair: KeyHolder.PrivateKeyHolder) => {
    const api = get(apiAtom)

    return api.chat.deleteInbox({keyPair}).pipe(
      Effect.match({
        onFailure: () => false,
        onSuccess: () => true,
      })
    )
  }
)

export default deleteInboxActionAtom
