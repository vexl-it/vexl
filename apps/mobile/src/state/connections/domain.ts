import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {CommonConnectionsForUsers} from '@vexl-next/domain/src/general/contacts'
import {OfferAdminId, SymmetricKey} from '@vexl-next/domain/src/general/offers'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'

export const ConnectionsState = Schema.Struct({
  lastUpdate: UnixMilliseconds,
  firstLevel: Schema.Array(Schema.Union(PublicKeyPemBase64, PublicKeyV2)),
  secondLevel: Schema.Array(Schema.Union(PublicKeyPemBase64, PublicKeyV2)),
  commonFriends: CommonConnectionsForUsers,
})
export type ConnectionsState = typeof ConnectionsState.Type

export const OfferToConnectionsItem = Schema.Struct({
  adminId: OfferAdminId,
  symmetricKey: SymmetricKey,
  connections: Schema.Struct({
    firstLevel: Schema.Array(Schema.Union(PublicKeyPemBase64, PublicKeyV2)),
    secondLevel: Schema.Array(
      Schema.Union(PublicKeyPemBase64, PublicKeyV2)
    ).pipe(Schema.optionalWith({default: () => []})),
    clubs: Schema.Record({
      key: ClubUuid,
      value: Schema.Array(Schema.Union(PublicKeyPemBase64, PublicKeyV2)),
    }).pipe(Schema.optionalWith({default: () => ({})})),
  }),
})

export type OfferToConnectionsItem = typeof OfferToConnectionsItem.Type

export const OfferToConnectionsItems = Schema.Struct({
  offerToConnections: Schema.Array(OfferToConnectionsItem).pipe(Schema.mutable),
})
