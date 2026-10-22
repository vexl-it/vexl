import {Effect} from 'effect'
import {atom} from 'jotai'
import {getNotificationTokenE} from '../../../utils/notifications'
import {vexlNotificationTokenAtom} from '../vexlNotificationTokenAtom'
import {createVexlSecretActionAtom} from './createVexlSecretActionAtom'
import {generateVexlTokenActionAtom} from './generateVexlTokenActionAtom'
import {syncVexlNotificationTokensActionAtom} from './syncVexlNotificationTokensActionAtom'

// Mints the per-device notification secret and the session notification token
// for a freshly logged in (or restored) device.
export const createVexlSecretAndSessionTokenActionAtom = atom(
  null,
  (get, set) =>
    Effect.gen(function* (_) {
      if (get(vexlNotificationTokenAtom).secret) {
        console.log(
          'Vexl notification secret already exists, this should not happen, lets remove it first'
        )

        set(vexlNotificationTokenAtom, {
          secret: null,
          systemVexlToken: null,
          marketingVexlToken: null,
          lastUpdatedMetadata: null,
        })
      }

      console.log('Vexl notification secret does not exist, creating...')
      const expoToken = yield* _(getNotificationTokenE())

      yield* _(
        set(createVexlSecretActionAtom, {
          expoNotificationToken: expoToken,
        }),
        Effect.either
      )

      console.log('Vexl notification secret created successfully')

      yield* set(syncVexlNotificationTokensActionAtom, {
        expoNotificationToken: expoToken,
      })

      const sessionNotificationToken = yield* _(
        set(generateVexlTokenActionAtom),
        Effect.option
      )

      return {expoToken, sessionNotificationToken}
    })
)
