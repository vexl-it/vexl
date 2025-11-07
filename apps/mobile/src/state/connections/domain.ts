import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {ClubUuidE} from '@vexl-next/domain/src/general/clubs'
import {CommonConnectionsForUsers} from '@vexl-next/domain/src/general/contacts'
import {
  OfferAdminIdE,
  SymmetricKeyE,
} from '@vexl-next/domain/src/general/offers'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'

export const ConnectionsState = Schema.Struct({
  lastUpdate: UnixMillisecondsE,
  firstLevel: Schema.Array(PublicKeyPemBase64E),
  secondLevel: Schema.Array(PublicKeyPemBase64E),
  commonFriends: CommonConnectionsForUsers,
})
export type ConnectionsState = typeof ConnectionsState.Type

export const OfferToConnectionsItem = Schema.Struct({
  adminId: OfferAdminIdE,
  symmetricKey: SymmetricKeyE,
  connections: Schema.Struct({
    firstLevel: Schema.Array(PublicKeyPemBase64E),
    secondLevel: Schema.Array(PublicKeyPemBase64E).pipe(
      Schema.optionalWith({default: () => []})
    ),
    clubs: Schema.Record({
      key: ClubUuidE,
      value: Schema.Array(PublicKeyPemBase64E),
    }).pipe(Schema.optionalWith({default: () => ({})})),
  }),
})

export type OfferToConnectionsItem = typeof OfferToConnectionsItem.Type

export const OfferToConnectionsItems = Schema.Struct({
  offerToConnections: Schema.Array(OfferToConnectionsItem).pipe(Schema.mutable),
})
