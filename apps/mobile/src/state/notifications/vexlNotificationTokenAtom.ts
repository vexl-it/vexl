import {VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Schema} from 'effect'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'

const VexlNotificationSecretState = Schema.Struct({
  secret: Schema.NullOr(VexlNotificationTokenSecret),
  lastUpdatedMetadata: Schema.NullOr(
    Schema.Struct({
      expoToken: Schema.optional(ExpoNotificationToken),
      version: VersionCode,
      locale: Schema.String,
    })
  ),
})
export type VexlNotificationSecretState =
  typeof VexlNotificationSecretState.Type

const defaultState: VexlNotificationSecretState = {
  secret: null,
  lastUpdatedMetadata: null,
}

export const vexlNotificationTokenAtom = atomWithParsedMmkvStorage(
  'vexlNotificationToken',
  defaultState,
  VexlNotificationSecretState
)
