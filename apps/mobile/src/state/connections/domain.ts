import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {OfferAdminId, SymmetricKey} from '@vexl-next/domain/src/general/offers'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {FetchCommonConnectionsResponse} from '@vexl-next/rest-api/src/services/contact/contracts'
import {z} from 'zod'

export const ConnectionsState = z.object({
  lastUpdate: UnixMilliseconds,
  firstLevel: z.array(PublicKeyPemBase64),
  secondLevel: z.array(PublicKeyPemBase64),
  commonFriends: FetchCommonConnectionsResponse,
})
export type ConnectionsState = z.TypeOf<typeof ConnectionsState>

export const OfferToConnectionsItem = z.object({
  adminId: OfferAdminId,
  symmetricKey: SymmetricKey,
  connections: z.object({
    firstLevel: z.array(PublicKeyPemBase64),
    secondLevel: z.array(PublicKeyPemBase64).optional(),
  }),
})
export type OfferToConnectionsItem = z.TypeOf<typeof OfferToConnectionsItem>

export const OfferToConnectionsItems = z.object({
  offerToConnections: z.array(OfferToConnectionsItem),
})
