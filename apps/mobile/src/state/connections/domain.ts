import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {CommonConnectionsForUsers} from '@vexl-next/domain/src/general/contacts'
import {
  NoteAdminId,
  NoteId,
  NoteRepostId,
} from '@vexl-next/domain/src/general/notes'
import {OfferAdminId, SymmetricKey} from '@vexl-next/domain/src/general/offers'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {HashMap, Schema} from 'effect'

export const ConnectionsState = Schema.Struct({
  lastUpdate: UnixMilliseconds,
  firstLevel: Schema.Array(Schema.Union(PublicKeyPemBase64, PublicKeyV2)),
  secondLevel: Schema.Array(Schema.Union(PublicKeyPemBase64, PublicKeyV2)),
  commonFriends: CommonConnectionsForUsers,
  verifiedFriends: Schema.optionalWith(CommonConnectionsForUsers, {
    default: () => HashMap.empty(),
  }),
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

export const NoteToConnectionsItem = Schema.Struct({
  adminId: NoteAdminId,
  symmetricKey: SymmetricKey,
  connections: Schema.Struct({
    firstLevel: Schema.Array(Schema.Union(PublicKeyPemBase64, PublicKeyV2)),
    secondLevel: Schema.Array(
      Schema.Union(PublicKeyPemBase64, PublicKeyV2)
    ).pipe(Schema.optionalWith({default: () => []})),
  }),
})

export type NoteToConnectionsItem = typeof NoteToConnectionsItem.Type

export const NoteToConnectionsItems = Schema.Struct({
  noteToConnections: Schema.Array(NoteToConnectionsItem).pipe(Schema.mutable),
})

export const RepostToConnectionsItem = Schema.Struct({
  repostId: NoteRepostId,
  noteId: NoteId,
  symmetricKey: SymmetricKey,
  connections: Schema.Struct({
    firstLevel: Schema.Array(Schema.Union(PublicKeyPemBase64, PublicKeyV2)),
    secondLevel: Schema.Array(
      Schema.Union(PublicKeyPemBase64, PublicKeyV2)
    ).pipe(Schema.optionalWith({default: () => []})),
  }),
})

export type RepostToConnectionsItem = typeof RepostToConnectionsItem.Type

export const RepostToConnectionsItems = Schema.Struct({
  repostToConnections: Schema.Array(RepostToConnectionsItem).pipe(
    Schema.mutable
  ),
})
