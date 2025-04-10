import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {ClubUuidE} from '@vexl-next/domain/src/general/clubs'
import {
  OfferAdminIdE,
  SymmetricKeyE,
} from '@vexl-next/domain/src/general/offers'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {FetchCommonConnectionsResponseE} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Schema} from 'effect'

export const ConnectionsState = Schema.Struct({
  lastUpdate: UnixMillisecondsE,
  firstLevel: Schema.Array(PublicKeyPemBase64E),
  secondLevel: Schema.Array(PublicKeyPemBase64E),
  commonFriends: FetchCommonConnectionsResponseE,
})
export type ConnectionsState = typeof ConnectionsState.Type

export const OfferToConnectionsItem = Schema.Struct({
  adminId: OfferAdminIdE,
  symmetricKey: SymmetricKeyE,
  connections: Schema.Struct({
    firstLevel: Schema.Array(PublicKeyPemBase64E),
    secondLevel: Schema.Array(PublicKeyPemBase64E).pipe(Schema.optional),
    clubs: Schema.Record({
      key: ClubUuidE,
      value: Schema.Array(PublicKeyPemBase64E),
    }).pipe(Schema.optional),
  }),
})

export type OfferToConnectionsItem = typeof OfferToConnectionsItem.Type

export const OfferToConnectionsItems = Schema.Struct({
  offerToConnections: Schema.Array(OfferToConnectionsItem).pipe(Schema.mutable),
})
