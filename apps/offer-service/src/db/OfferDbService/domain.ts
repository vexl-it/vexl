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
  userPublicKey: PublicKeyPemBase64,
  offerId: PublicPartId,
  payloadPrivate: PrivatePayloadEncrypted,
}) {}

export const OfferParts = Schema.Struct({
  publicPart: PublicPartRecord,
  privatePart: PrivatePartRecord,
})
export type OfferParts = Schema.Schema.Type<typeof OfferParts>
