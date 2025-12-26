import {Schema} from 'effect/index'
import {atomWithParsedMmkvStorage} from '../utils/atomUtils/atomWithParsedMmkvStorage'

const wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom =
  atomWithParsedMmkvStorage(
    'was-last-route-before-redirect-contacts-screen',
    {
      value: false,
    },
    Schema.Struct({
      value: Schema.Boolean,
    })
  )

export default wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom
