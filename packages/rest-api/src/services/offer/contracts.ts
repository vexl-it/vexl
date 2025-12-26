import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  OfferAdminId,
  OfferId,
  OfferType,
  PrivatePayloadEncrypted,
  PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {IdNumeric} from '@vexl-next/domain/src/utility/IdNumeric'
import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Schema} from 'effect'
import {RequestBaseWithChallenge} from '../../challenges/contracts'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {createPageResponse, PageRequestMeta} from '../../Pagination.brand'

export class ReportOfferLimitReachedError extends Schema.TaggedError<ReportOfferLimitReachedError>(
  'ReportOfferLimitReachedError'
)('ReportOfferLimitReachedError', {
  status: Schema.optionalWith(Schema.Literal(429), {default: () => 429}),
}) {}

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

export const ServerOffer = Schema.Struct({
  id: IdNumeric,
  offerId: OfferId,
  expiration: Schema.optional(UnixMilliseconds),
  publicPayload: PublicPayloadEncrypted,
  privatePayload: PrivatePayloadEncrypted,
  createdAt: IsoDatetimeString,
  modifiedAt: IsoDatetimeString,
})
export type ServerOffer = Schema.Schema.Type<typeof ServerOffer>

export const GetClubOffersForMeRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
})
export type GetClubOffersForMeRequest = typeof GetClubOffersForMeRequest.Type

export const GetOffersForMeCreatedOrModifiedAfterRequest = Schema.Struct({
  modifiedAt: IsoDatetimeString,
})
export type GetOffersForMeCreatedOrModifiedAfterRequest =
  typeof GetOffersForMeCreatedOrModifiedAfterRequest.Type

export const GetOffersForMeCreatedOrModifiedAfterPaginatedRequest =
  PageRequestMeta
export type GetOffersForMeCreatedOrModifiedAfterPaginatedRequest =
  typeof GetOffersForMeCreatedOrModifiedAfterPaginatedRequest.Type

export const GetClubOffersForMeCreatedOrModifiedAfterRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  modifiedAt: IsoDatetimeString,
})
export type GetClubOffersForMeCreatedOrModifiedAfterRequest =
  typeof GetClubOffersForMeCreatedOrModifiedAfterRequest.Type

export const GetClubOffersForMeCreatedOrModifiedAfterPaginatedRequest =
  Schema.Struct({
    ...RequestBaseWithChallenge.fields,
    ...PageRequestMeta.fields,
  })
export type GetClubOffersForMeCreatedOrModifiedAfterPaginatedRequest =
  typeof GetClubOffersForMeCreatedOrModifiedAfterPaginatedRequest.Type

export const GetOffersForMeCreatedOrModifiedAfterResponse = Schema.Struct({
  offers: Schema.Array(ServerOffer),
})
export type GetOffersForMeCreatedOrModifiedAfterResponse =
  typeof GetOffersForMeCreatedOrModifiedAfterResponse.Type

export const GetOffersForMeCreatedOrModifiedAfterPaginatedResponse =
  createPageResponse(ServerOffer)

export type GetOffersForMeCreatedOrModifiedAfterPaginatedResponse =
  typeof GetOffersForMeCreatedOrModifiedAfterPaginatedResponse.Type

export const ServerPrivatePart = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  payloadPrivate: PrivatePayloadEncrypted,
})
export type ServerPrivatePart = Schema.Schema.Type<typeof ServerPrivatePart>

export const CreateNewOfferRequest = Schema.Struct({
  offerType: OfferType,
  payloadPublic: PublicPayloadEncrypted,
  offerPrivateList: Schema.Array(ServerPrivatePart),
  countryPrefix: CountryPrefix,
  adminId: OfferAdminId,
  offerId: Schema.optional(OfferId),
})
export type CreateNewOfferRequest = typeof CreateNewOfferRequest.Type

export const CreateNewOfferResponse = Schema.Struct({
  adminId: OfferAdminId, // TODO is this really necessary? Shouldn't client generate it and store it?
  ...ServerOffer.fields,
})
export type CreateNewOfferResponse = typeof CreateNewOfferResponse.Type

export const RefreshOfferRequest = Schema.Struct({
  adminIds: Schema.Array(OfferAdminId),
})
export type RefreshOfferRequest = Schema.Schema.Type<typeof RefreshOfferRequest>

export const RefreshOfferResponse = Schema.Array(OfferId)
export type RefreshOfferResponse = typeof RefreshOfferResponse.Type

export const DeleteOfferRequest = Schema.Struct({
  adminIds: Schema.split(',').pipe(
    Schema.compose(
      Schema.transform(
        Schema.Array(Schema.String),
        Schema.Array(Schema.String),
        {
          encode: (a) => a,
          decode: (a) => {
            if (a.length === 1 && a[0] === '') return []

            return Array.dedupe(a)
          },
        }
      )
    ),
    Schema.compose(Schema.Array(OfferAdminId))
  ),
})
export type DeleteOfferRequest = Schema.Schema.Type<typeof DeleteOfferRequest>

export const DeleteOfferResponse = NoContentResponse
export type DeleteOfferResponse = Schema.Schema.Type<typeof NoContentResponse>

export const OfferPrivateListItem = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  payloadPrivate: PrivatePayloadEncrypted,
})
export type OfferPrivateListItem = typeof OfferPrivateListItem.Type

export const UpdateOfferRequest = Schema.Struct({
  adminId: OfferAdminId,
  payloadPublic: PublicPayloadEncrypted,
  offerPrivateList: Schema.Array(OfferPrivateListItem),
})
export type UpdateOfferRequest = Schema.Schema.Type<typeof UpdateOfferRequest>

export const UpdateOfferResponse = ServerOffer
export type UpdateOfferResponse = Schema.Schema.Type<typeof UpdateOfferResponse>

export const CreatePrivatePartRequest = Schema.Struct({
  adminId: OfferAdminId,
  offerPrivateList: Schema.Array(ServerPrivatePart),
})
export type CreatePrivatePartRequest = typeof CreatePrivatePartRequest.Type

export const CreatePrivatePartResponse = NoContentResponse

export type CreatePrivatePartResponse = typeof CreatePrivatePartResponse.Type

export class CanNotDeletePrivatePartOfAuthor extends Schema.TaggedError<CanNotDeletePrivatePartOfAuthor>(
  'CanNotDeletePrivatePartOfAuthor'
)('CanNotDeletePrivatePartOfAuthor', {
  status: Schema.Literal(400),
}) {}

export const DeletePrivatePartRequest = Schema.Struct({
  adminIds: Schema.Array(OfferAdminId),
  publicKeys: Schema.Array(PublicKeyPemBase64),
})
export type DeletePrivatePartRequest = typeof DeletePrivatePartRequest.Type

export const DeletePrivatePartResponse = NoContentResponse
export type DeletePrivatePartResponse = typeof DeletePrivatePartResponse.Type

export const RemovedOfferIdsRequest = Schema.Struct({
  offerIds: Schema.Array(OfferId),
})
export type RemovedOfferIdsRequest = typeof RemovedOfferIdsRequest.Type

export const RemovedClubOfferIdsRequest = Schema.Struct({
  ...RequestBaseWithChallenge.fields,
  offerIds: Schema.Array(OfferId),
})
export type RemovedClubOfferIdsRequest = typeof RemovedClubOfferIdsRequest.Type

export const RemovedOfferIdsResponse = RemovedOfferIdsRequest
export type RemovedOfferIdsResponse = typeof RemovedOfferIdsRequest.Type

export const ReportOfferRequest = Schema.Struct({
  offerId: OfferId,
})
export type ReportOfferRequest = Schema.Schema.Type<typeof ReportOfferRequest>

export const ReportOfferResponse = NoContentResponse
export type ReportOfferResponse = Schema.Schema.Type<typeof ReportOfferResponse>

export const ReportClubOfferRequest = Schema.Struct({
  offerId: OfferId,
  ...RequestBaseWithChallenge.fields,
})
export type ReportClubOfferRequest = Schema.Schema.Type<
  typeof ReportClubOfferRequest
>

export const ReportClubOfferResponse = NoContentResponse
export type ReportClubOfferResponse = Schema.Schema.Type<
  typeof ReportClubOfferResponse
>

export const DeleteUserResponse = NoContentResponse
export type DeleteUserResponse = Schema.Schema.Type<typeof DeleteUserResponse>
