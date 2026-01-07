import {InvalidateNotificationSecretRequest} from '@vexl-next/rest-api/src/services/notification/contract'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {vexlNotificationTokenAtom} from '../vexlNotificationTokenAtom'
import {vexlTokenToKeyHolderAtom} from '../vexlTokenToKeyHolderAtom'

export const invalidateVexlSecretActionAtom = atom(null, (get, set) => {
  return Effect.gen(function* () {
    const api = get(apiAtom)
    const vexlNotificationState = get(vexlNotificationTokenAtom)

    const secret = vexlNotificationState.secret
    if (!secret) {
      return
    }

    const request = new InvalidateNotificationSecretRequest({
      secretToInvalidate: secret,
    })

    yield* api.notification.invalidateNotificationSecret(request)

    set(vexlNotificationTokenAtom, {
      secret: null,
      lastUpdatedMetadata: null,
    })

    set(vexlTokenToKeyHolderAtom, {data: {}})
  })
})
