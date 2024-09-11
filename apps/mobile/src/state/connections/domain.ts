import {Schema} from '@effect/schema'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {OfferAdminId, SymmetricKey} from '@vexl-next/domain/src/general/offers'
import {
  UnixMilliseconds,
  UnixMillisecondsE,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  FetchCommonConnectionsResponse,
  FetchCommonConnectionsResponseE,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {z} from 'zod'

export const ConnectionsState = z
  .object({
    lastUpdate: UnixMilliseconds,
    firstLevel: z.array(PublicKeyPemBase64),
    secondLevel: z.array(PublicKeyPemBase64),
    commonFriends: FetchCommonConnectionsResponse,
  })
  .readonly()
export const ConnectionsStateE = Schema.Struct({
  lastUpdate: UnixMillisecondsE,
  firstLevel: Schema.Array(PublicKeyPemBase64E),
  secondLevel: Schema.Array(PublicKeyPemBase64E),
  commonFriends: FetchCommonConnectionsResponseE,
})
export type ConnectionsState = Schema.Schema.Type<typeof ConnectionsStateE>

export const OfferToConnectionsItem = z
  .object({
    adminId: OfferAdminId,
    symmetricKey: SymmetricKey,
    connections: z.object({
      firstLevel: z.array(PublicKeyPemBase64),
      secondLevel: z.array(PublicKeyPemBase64).optional(),
    }),
  })
  .readonly()
export type OfferToConnectionsItem = z.TypeOf<typeof OfferToConnectionsItem>

export const OfferToConnectionsItems = z
  .object({
    offerToConnections: z.array(OfferToConnectionsItem),
  })
  .readonly()
