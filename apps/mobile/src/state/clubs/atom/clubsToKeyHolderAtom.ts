import {KeyHolder} from '@vexl-next/cryptography'
import {PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Effect, Schema} from 'effect'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'

export const ClubsToKeyHolder = Schema.Struct({
  data: Schema.Record(ClubUuid, KeyHolder.PrivateKeyHolder),
  waitingForAdmission: Schema.Array(PrivateKeyHolder).pipe(
    Schema.withDecodingDefaultType(Effect.sync(() => [])),
    Schema.withConstructorDefault(Effect.sync(() => []))
  ),
})

/**
 * @deprecated This atom is deprecated and should not be used anymore. It is only kept for
 * migration purposes during session loading. New code should use clubsToKeyHolderV2Atom instead.
 */
export const oldClubsKeyHolderStorageAtom = atomWithParsedMmkvStorage(
  'storedClubs',
  {data: {}, waitingForAdmission: []},
  ClubsToKeyHolder
)
