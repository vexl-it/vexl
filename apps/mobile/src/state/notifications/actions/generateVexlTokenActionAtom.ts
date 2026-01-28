import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {
  GenerateNotificationTokenRequest,
  type GenerateNotificationTokenResponse,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {vexlNotificationTokenAtom} from '../vexlNotificationTokenAtom'
import {registerVexlTokenActionAtom} from '../vexlTokenToKeyHolderAtom'
import {NoVexlSecretError} from './NoVexlSecretError'

export const generateVexlTokenActionAtom = atom(null, (get, set) => {
  return Effect.gen(function* () {
    const api = get(apiAtom)

    const secret = get(vexlNotificationTokenAtom).secret
    if (!secret) {
      return yield* Effect.fail(new NoVexlSecretError({}))
    }

    const request = new GenerateNotificationTokenRequest({
      secret,
    })

    const response: GenerateNotificationTokenResponse =
      yield* api.notification.generateNotificationToken(request)

    return response.token
  })
})

export const generateAndRegisterVexlTokenActionAtom = atom(
  null,
  (get, set, {keyHolder}: {keyHolder: PrivateKeyHolder}) => {
    return Effect.gen(function* (_) {
      const vexlToken = yield* _(set(generateVexlTokenActionAtom))

      set(registerVexlTokenActionAtom, {
        vexlToken,
        keyHolder,
      })

      return vexlToken
    })
  }
)
