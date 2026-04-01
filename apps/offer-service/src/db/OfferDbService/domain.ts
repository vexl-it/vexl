import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  OfferId,
  OfferType,
  PrivatePartRecordId,
  PrivatePayloadEncrypted,
  PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {Schema} from 'effect'

export const OfferAdminIdHashed = Schema.String.pipe(
  Schema.brand('OfferAdminIdHashed')
)
export type OfferAdminIdHashed = Schema.Schema.Type<typeof OfferAdminIdHashed>

export const PublicPartId = Schema.NumberFromString.pipe(
  Schema.brand('PublicPartId')
)

export type PublicPartId = Schema.Schema.Type<typeof PublicPartId>

export const OfferChangeCounter = Schema.NumberFromString.pipe(
  Schema.brand('OfferChangeCounter'),
  Schema.greaterThanOrEqualTo(0)
)

export type OfferChangeCounter = Schema.Schema.Type<typeof OfferChangeCounter>

export class PublicPartRecord extends Schema.Class<PublicPartRecord>(
  'PublicPartRecord'
)({
  id: PublicPartId,
  adminId: OfferAdminIdHashed,
  offerId: OfferId,
  createdAt: Schema.DateFromSelf,
  modifiedAt: Schema.DateFromSelf,
  offerType: OfferType,
  report: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  payloadPublic: PublicPayloadEncrypted,
  refreshedAt: Schema.DateFromSelf,
  countryPrefix: CountryPrefix,
}) {}

export class PrivatePartRecord extends Schema.Class<PrivatePartRecord>(
  'PrivatePartRecord'
)({
  id: PrivatePartRecordId,
  userPublicKey: Schema.Union(PublicKeyPemBase64, PublicKeyV2),
  offerId: PublicPartId,
  payloadPrivate: PrivatePayloadEncrypted,
}) {}

export const OfferParts = Schema.Struct({
  publicPart: PublicPartRecord,
  privatePart: PrivatePartRecord,
})
export type OfferParts = Schema.Schema.Type<typeof OfferParts>

export const OfferPartsWithOfferForUserUpdateCounter = Schema.Struct({
  publicPart: PublicPartRecord,
  privatePart: PrivatePartRecord,
  offerForUserUpdateCounter: OfferChangeCounter,
})
export type OfferPartsWithOfferForUserUpdateCounter = Schema.Schema.Type<
  typeof OfferPartsWithOfferForUserUpdateCounter
>
