import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  OfferIdE,
  OfferTypeE,
  PrivatePayloadEncryptedE,
  PublicPayloadEncryptedE,
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
  offerId: OfferIdE,
  createdAt: Schema.DateFromSelf,
  modifiedAt: Schema.DateFromSelf,
  offerType: OfferTypeE,
  report: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  payloadPublic: PublicPayloadEncryptedE,
  refreshedAt: Schema.DateFromSelf,
  countryPrefix: CountryPrefixE,
}) {}

export const PrivatePartRecordId = Schema.NumberFromString.pipe(
  Schema.brand('PrivatePartRecordId')
)
export type PrivatePartRecordId = Schema.Schema.Type<typeof PrivatePartRecordId>

export class PrivatePartRecord extends Schema.Class<PrivatePartRecord>(
  'PrivatePartRecord'
)({
  id: PrivatePartRecordId,
  userPublicKey: PublicKeyPemBase64E,
  offerId: PublicPartId,
  payloadPrivate: PrivatePayloadEncryptedE,
}) {}

export const OfferParts = Schema.Struct({
  publicPart: PublicPartRecord,
  privatePart: PrivatePartRecord,
})
export type OfferParts = Schema.Schema.Type<typeof OfferParts>
