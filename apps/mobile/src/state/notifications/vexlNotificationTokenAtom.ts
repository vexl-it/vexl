import {
  VexlNotificationToken,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Schema} from 'effect'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'

// Exported so the device-migration exporter can decode the stored value and
// strip `lastUpdatedMetadata` (source-device data) before the snapshot.
export const VexlNotificationSecretState = Schema.Struct({
  secret: Schema.NullOr(VexlNotificationTokenSecret),
  systemVexlToken: Schema.optionalWith(Schema.NullOr(VexlNotificationToken), {
    default: () => null,
  }),
  marketingVexlToken: Schema.optionalWith(
    Schema.NullOr(VexlNotificationToken),
    {
      default: () => null,
    }
  ),
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
  systemVexlToken: null,
  marketingVexlToken: null,
  lastUpdatedMetadata: null,
}

// Policy 'account': the stable Vexl notification secret and system/marketing
// tokens follow the account. `lastUpdatedMetadata` contains source-device data
// (the Expo push token) — the migration EXPORTER strips it before the snapshot
// is taken; the split is not represented here.
export const vexlNotificationTokenAtom = atomWithParsedMmkvStorage(
  'vexlNotificationToken',
  defaultState,
  VexlNotificationSecretState,
  'account'
)
