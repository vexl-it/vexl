import {Schema} from '@effect/schema'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  CountryPrefix,
  CountryPrefixE,
} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  OfferAdminId,
  OfferAdminIdE,
  OfferId,
  OfferIdE,
  OfferType,
  OfferTypeE,
  PrivatePayloadEncrypted,
  PrivatePayloadEncryptedE,
  PublicPayloadEncrypted,
  PublicPayloadEncryptedE,
} from '@vexl-next/domain/src/general/offers'
import {IdNumeric, IdNumericE} from '@vexl-next/domain/src/utility/IdNumeric'
import {
  IsoDatetimeString,
  IsoDatetimeStringE,
} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {
  UnixMilliseconds,
  UnixMillisecondsE,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array} from 'effect'
import {z} from 'zod'
import {
  NoContentResponse,
  NoContentResponseE,
} from '../../NoContentResponse.brand'

export class ReportOfferLimitReachedError extends Schema.TaggedError<ReportOfferLimitReachedError>(
  'ReportOfferLimitReachedError'
)('ReportOfferLimitReachedError', {}) {}

export class MissingOwnerPrivatePartError extends Schema.TaggedError<MissingOwnerPrivatePartError>(
  'MissingOwnerPrivatePartError'
)('MissingOwnerPrivatePartError', {
  status: Schema.Literal(400),
}) {}

export class DuplicatedPublicKeyError extends Schema.TaggedError<DuplicatedPublicKeyError>(
  'DuplicatedPublicKeyError'
)('DuplicatedPublicKeyError', {
  status: Schema.Literal(400),
}) {}

export const ServerOfferBase = z.object({
  id: IdNumeric,
  offerId: OfferId,
  expiration: UnixMilliseconds.optional(),
  publicPayload: PublicPayloadEncrypted,
  privatePayload: PrivatePayloadEncrypted,
  createdAt: IsoDatetimeString,
  modifiedAt: IsoDatetimeString,
})
export const ServerOffer = ServerOfferBase.extend({}).readonly()
export const ServerOfferE = Schema.Struct({
  id: IdNumericE,
  offerId: OfferIdE,
  expiration: Schema.optional(UnixMillisecondsE), // Depreciated
  publicPayload: PublicPayloadEncryptedE,
  privatePayload: PrivatePayloadEncryptedE,
  createdAt: IsoDatetimeStringE,
  modifiedAt: IsoDatetimeStringE,
})
export type ServerOffer = Schema.Schema.Type<typeof ServerOfferE>

export const getOffersByIdsRequest = z
  .object({ids: z.array(OfferId).readonly()})
  .readonly()
export const GetOffersByIdsRequestE = Schema.Struct({
  ids: Schema.compose(Schema.split(','), Schema.Array(OfferIdE)),
})
export type GetOffersByIdsRequest = Schema.Schema.Type<
  typeof GetOffersByIdsRequestE
>

export const GetOfferByIdsResponse = z.array(ServerOffer)
export const GetOfferByIdsResponseE = Schema.Array(ServerOfferE)
export type GetOfferByIdsResponse = Schema.Schema.Type<
  typeof GetOfferByIdsResponseE
>

export const GetOffersForMeResponse = z
  .object({
    offers: z.array(ServerOffer),
  })
  .readonly()
export const GetOffersForMeResponseE = Schema.Struct({
  offers: Schema.Array(ServerOfferE),
})
export type GetOffersForMeResponse = Schema.Schema.Type<
  typeof GetOffersForMeResponseE
>

export const GetOffersForMeCreatedOrModifiedAfterRequest = z
  .object({
    modifiedAt: IsoDatetimeString,
  })
  .readonly()
export const GetOffersForMeCreatedOrModifiedAfterRequestE = Schema.Struct({
  modifiedAt: IsoDatetimeStringE,
})
export type GetOffersForMeCreatedOrModifiedAfterRequest = Schema.Schema.Type<
  typeof GetOffersForMeCreatedOrModifiedAfterRequestE
>

export const GetOffersForMeCreatedOrModifiedAfterResponse = z
  .object({
    offers: z.array(ServerOffer),
  })
  .readonly()
export const GetOffersForMeCreatedOrModifiedAfterResponseE = Schema.Struct({
  offers: Schema.Array(ServerOfferE),
})
export type GetOffersForMeCreatedOrModifiedAfterResponse = Schema.Schema.Type<
  typeof GetOffersForMeCreatedOrModifiedAfterResponseE
>

export const ServerPrivatePart = z
  .object({
    userPublicKey: PublicKeyPemBase64,
    payloadPrivate: PrivatePayloadEncrypted,
  })
  .readonly()
export const ServerPrivatePartE = Schema.Struct({
  userPublicKey: PublicKeyPemBase64E,
  payloadPrivate: PrivatePayloadEncryptedE,
})
export type ServerPrivatePart = Schema.Schema.Type<typeof ServerPrivatePartE>

export const CreateNewOfferRequest = z
  .object({
    offerType: OfferType,
    payloadPublic: PublicPayloadEncrypted,
    offerPrivateList: z.array(ServerPrivatePart),
    countryPrefix: CountryPrefix,
    adminId: OfferAdminId,
    offerId: OfferId.optional(),
  })
  .readonly()
export const CreateNewOfferRequestE = Schema.Struct({
  offerType: OfferTypeE,
  payloadPublic: PublicPayloadEncryptedE,
  offerPrivateList: Schema.Array(ServerPrivatePartE),
  countryPrefix: CountryPrefixE,
  adminId: OfferAdminIdE,
  offerId: Schema.optional(OfferIdE),
})
export type CreateNewOfferRequest = Schema.Schema.Type<
  typeof CreateNewOfferRequestE
>

export const CreateNewOfferResponse = ServerOfferBase.extend({
  adminId: OfferAdminId,
})
export const CreateNewOfferResponseE = Schema.Struct({
  adminId: OfferAdminIdE, // TODO is this really necessary? Shouldn't client generate it and store it?
  ...ServerOfferE.fields,
})
export type CreateNewOfferResponse = Schema.Schema.Type<
  typeof CreateNewOfferResponseE
>

export const RefreshOfferRequest = z.object({
  adminIds: z.array(OfferAdminId).readonly(),
})
export const RefreshOfferRequestE = Schema.Struct({
  adminIds: Schema.Array(OfferAdminIdE),
})
export type RefreshOfferRequest = Schema.Schema.Type<
  typeof RefreshOfferRequestE
>

export const RefreshOfferResponse = z.array(OfferId)
export const RefreshOfferResponseE = Schema.Array(OfferIdE)
export type RefreshOfferResponse = Schema.Schema.Type<
  typeof RefreshOfferResponseE
>

export const DeleteOfferRequest = z
  .object({
    adminIds: z.array(OfferAdminId),
  })
  .readonly()
export const DeleteOfferRequestE = Schema.Struct({
  adminIds: Schema.split(',').pipe(
    Schema.compose(
      Schema.transform(
        Schema.Array(Schema.String),
        Schema.Array(Schema.String),
        {
          encode: (a) => a,
          decode: Array.dedupe,
        }
      )
    ),
    Schema.compose(Schema.Array(OfferAdminIdE))
  ),
})
export type DeleteOfferRequest = Schema.Schema.Type<typeof DeleteOfferRequestE>

export const DeleteOfferResponse = NoContentResponse
export const DeleteOfferResponseE = NoContentResponseE
export type DeleteOfferResponse = Schema.Schema.Type<typeof NoContentResponseE>

export const OfferPrivateListItem = z.object({
  userPublicKey: PublicKeyPemBase64,
  payloadPrivate: PrivatePayloadEncrypted,
})
export const OfferPrivateListItemE = Schema.Struct({
  userPublicKey: PublicKeyPemBase64E,
  payloadPrivate: PrivatePayloadEncryptedE,
})
export type OfferPrivateListItem = Schema.Schema.Type<
  typeof OfferPrivateListItemE
>

export const UpdateOfferRequest = z.object({
  adminId: OfferAdminId,
  payloadPublic: PublicPayloadEncrypted,
  offerPrivateList: z.array(OfferPrivateListItem),
})
export const UpdateOfferRequestE = Schema.Struct({
  adminId: OfferAdminIdE,
  payloadPublic: PublicPayloadEncryptedE,
  offerPrivateList: Schema.Array(OfferPrivateListItemE),
})
export type UpdateOfferRequest = Schema.Schema.Type<typeof UpdateOfferRequestE>

export const UpdateOfferResponse = ServerOffer
export const UpdateOfferResponseE = ServerOfferE
export type UpdateOfferResponse = Schema.Schema.Type<
  typeof UpdateOfferResponseE
>

export const CreatePrivatePartRequest = z.object({
  adminId: OfferAdminId,
  offerPrivateList: z.array(ServerPrivatePart),
})
export const CreatePrivatePartRequestE = Schema.Struct({
  adminId: OfferAdminIdE,
  offerPrivateList: Schema.Array(ServerPrivatePartE),
})
export type CreatePrivatePartRequest = Schema.Schema.Type<
  typeof CreatePrivatePartRequestE
>

export const CreatePrivatePartResponse = NoContentResponse
export const CreatePrivatePartResponseE = NoContentResponseE

export type CreatePrivatePartResponse = Schema.Schema.Type<
  typeof CreatePrivatePartResponseE
>

export class CanNotDeletePrivatePartOfAuthor extends Schema.TaggedError<CanNotDeletePrivatePartOfAuthor>(
  'CanNotDeletePrivatePartOfAuthor'
)('CanNotDeletePrivatePartOfAuthor', {
  status: Schema.Literal(400),
}) {}

export const DeletePrivatePartRequest = z.object({
  adminIds: z.array(OfferAdminId),
  publicKeys: z.array(PublicKeyPemBase64),
})
export const DeletePrivatePartRequestE = Schema.Struct({
  adminIds: Schema.Array(OfferAdminIdE),
  publicKeys: Schema.Array(PublicKeyPemBase64E),
})
export type DeletePrivatePartRequest = Schema.Schema.Type<
  typeof DeletePrivatePartRequestE
>

export const DeletePrivatePartResponse = NoContentResponse
export const DeletePrivatePartResponseE = NoContentResponseE
export type DeletePrivatePartResponse = Schema.Schema.Type<
  typeof CreatePrivatePartResponseE
>

export const RemovedOfferIdsRequest = z.object({
  offerIds: z.array(OfferId),
})
export const RemovedOfferIdsRequestE = Schema.Struct({
  offerIds: Schema.Array(OfferIdE),
})
export type RemovedOfferIdsRequest = Schema.Schema.Type<
  typeof RemovedOfferIdsRequestE
>

export const RemovedOfferIdsResponse = RemovedOfferIdsRequest
export const RemovedOfferIdsResponseE = RemovedOfferIdsRequestE
export type RemovedOfferIdsResponse = Schema.Schema.Type<
  typeof RemovedOfferIdsRequestE
>

export const ReportOfferRequest = z.object({
  offerId: OfferId,
})

export const ReportOfferRequestE = Schema.Struct({
  offerId: OfferIdE,
})
export type ReportOfferRequest = Schema.Schema.Type<typeof ReportOfferRequestE>

export const ReportOfferResponse = NoContentResponse
export const ReportOfferResponseE = NoContentResponseE
export type ReportOfferResponse = Schema.Schema.Type<
  typeof ReportOfferResponseE
>

export const DeleteUserResponse = NoContentResponse
export const DeleteUserResponseE = NoContentResponseE
export type DeleteUserResponse = Schema.Schema.Type<typeof DeleteUserResponseE>
