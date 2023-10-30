import {z} from 'zod'
import {UnixMilliseconds} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {FetchCommonConnectionsResponse} from '@vexl-next/rest-api/dist/services/contact/contracts'
import {OfferAdminId, SymmetricKey} from '@vexl-next/domain/dist/general/offers'

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
