import {Schema} from '@effect/schema'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  OfferAdminIdE,
  OfferIdE,
  OfferTypeE,
  PrivatePayloadEncryptedE,
  PublicPayloadEncryptedE,
} from '@vexl-next/domain/src/general/offers'
import {IdNumericE} from '@vexl-next/domain/src/utility/IdNumeric'
import {IsoDatetimeStringE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array} from 'effect'
import {NoContentResponse} from '../../NoContentResponse.brand'

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

export const ServerOffer = Schema.Struct({
  id: IdNumericE,
  offerId: OfferIdE,
  expiration: Schema.optional(UnixMillisecondsE), // Depreciated
  publicPayload: PublicPayloadEncryptedE,
  privatePayload: PrivatePayloadEncryptedE,
  createdAt: IsoDatetimeStringE,
  modifiedAt: IsoDatetimeStringE,
})
export type ServerOffer = Schema.Schema.Type<typeof ServerOffer>

export const GetOffersByIdsRequest = Schema.Struct({
  ids: Schema.compose(Schema.split(','), Schema.Array(OfferIdE)),
})
export type GetOffersByIdsRequest = Schema.Schema.Type<
  typeof GetOffersByIdsRequest
>

export const GetOfferByIdsResponse = Schema.Array(ServerOffer)
export type GetOfferByIdsResponse = Schema.Schema.Type<
  typeof GetOfferByIdsResponse
>

export const GetOffersForMeResponse = Schema.Struct({
  offers: Schema.Array(ServerOffer),
})
export type GetOffersForMeResponse = Schema.Schema.Type<
  typeof GetOffersForMeResponse
>

export const GetOffersForMeCreatedOrModifiedAfterRequest = Schema.Struct({
  modifiedAt: IsoDatetimeStringE,
})
export type GetOffersForMeCreatedOrModifiedAfterRequest = Schema.Schema.Type<
  typeof GetOffersForMeCreatedOrModifiedAfterRequest
>

export const GetOffersForMeCreatedOrModifiedAfterResponse = Schema.Struct({
  offers: Schema.Array(ServerOffer),
})
export type GetOffersForMeCreatedOrModifiedAfterResponse = Schema.Schema.Type<
  typeof GetOffersForMeCreatedOrModifiedAfterResponse
>

export const ServerPrivatePart = Schema.Struct({
  userPublicKey: PublicKeyPemBase64E,
  payloadPrivate: PrivatePayloadEncryptedE,
})
export type ServerPrivatePart = Schema.Schema.Type<typeof ServerPrivatePart>

export const CreateNewOfferRequest = Schema.Struct({
  offerType: OfferTypeE,
  payloadPublic: PublicPayloadEncryptedE,
  offerPrivateList: Schema.Array(ServerPrivatePart),
  countryPrefix: CountryPrefixE,
  adminId: OfferAdminIdE,
  offerId: Schema.optional(OfferIdE),
})
export type CreateNewOfferRequest = Schema.Schema.Type<
  typeof CreateNewOfferRequest
>

export const CreateNewOfferResponse = Schema.Struct({
  adminId: OfferAdminIdE, // TODO is this really necessary? Shouldn't client generate it and store it?
  ...ServerOffer.fields,
})
export type CreateNewOfferResponse = Schema.Schema.Type<
  typeof CreateNewOfferResponse
>

export const RefreshOfferRequest = Schema.Struct({
  adminIds: Schema.Array(OfferAdminIdE),
})
export type RefreshOfferRequest = Schema.Schema.Type<typeof RefreshOfferRequest>

export const RefreshOfferResponse = Schema.Array(OfferIdE)
export type RefreshOfferResponse = Schema.Schema.Type<
  typeof RefreshOfferResponse
>

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
    Schema.compose(Schema.Array(OfferAdminIdE))
  ),
})
export type DeleteOfferRequest = Schema.Schema.Type<typeof DeleteOfferRequest>

export const DeleteOfferResponse = NoContentResponse
export type DeleteOfferResponse = Schema.Schema.Type<typeof NoContentResponse>

export const OfferPrivateListItem = Schema.Struct({
  userPublicKey: PublicKeyPemBase64E,
  payloadPrivate: PrivatePayloadEncryptedE,
})
export type OfferPrivateListItem = Schema.Schema.Type<
  typeof OfferPrivateListItem
>

export const UpdateOfferRequest = Schema.Struct({
  adminId: OfferAdminIdE,
  payloadPublic: PublicPayloadEncryptedE,
  offerPrivateList: Schema.Array(OfferPrivateListItem),
})
export type UpdateOfferRequest = Schema.Schema.Type<typeof UpdateOfferRequest>

export const UpdateOfferResponse = ServerOffer
export type UpdateOfferResponse = Schema.Schema.Type<typeof UpdateOfferResponse>

export const CreatePrivatePartRequest = Schema.Struct({
  adminId: OfferAdminIdE,
  offerPrivateList: Schema.Array(ServerPrivatePart),
})
export type CreatePrivatePartRequest = Schema.Schema.Type<
  typeof CreatePrivatePartRequest
>

export const CreatePrivatePartResponse = NoContentResponse

export type CreatePrivatePartResponse = Schema.Schema.Type<
  typeof CreatePrivatePartResponse
>

export class CanNotDeletePrivatePartOfAuthor extends Schema.TaggedError<CanNotDeletePrivatePartOfAuthor>(
  'CanNotDeletePrivatePartOfAuthor'
)('CanNotDeletePrivatePartOfAuthor', {
  status: Schema.Literal(400),
}) {}

export const DeletePrivatePartRequest = Schema.Struct({
  adminIds: Schema.Array(OfferAdminIdE),
  publicKeys: Schema.Array(PublicKeyPemBase64E),
})
export type DeletePrivatePartRequest = Schema.Schema.Type<
  typeof DeletePrivatePartRequest
>

export const DeletePrivatePartResponse = NoContentResponse
export type DeletePrivatePartResponse = Schema.Schema.Type<
  typeof DeletePrivatePartResponse
>

export const RemovedOfferIdsRequest = Schema.Struct({
  offerIds: Schema.Array(OfferIdE),
})
export type RemovedOfferIdsRequest = Schema.Schema.Type<
  typeof RemovedOfferIdsRequest
>

export const RemovedOfferIdsResponse = RemovedOfferIdsRequest
export type RemovedOfferIdsResponse = Schema.Schema.Type<
  typeof RemovedOfferIdsRequest
>

export const ReportOfferRequest = Schema.Struct({
  offerId: OfferIdE,
})
export type ReportOfferRequest = Schema.Schema.Type<typeof ReportOfferRequest>

export const ReportOfferResponse = NoContentResponse
export type ReportOfferResponse = Schema.Schema.Type<typeof ReportOfferResponse>

export const DeleteUserResponse = NoContentResponse
export type DeleteUserResponse = Schema.Schema.Type<typeof DeleteUserResponse>

export const CreateNewOfferErrors = Schema.Union(
  MissingOwnerPrivatePartError,
  DuplicatedPublicKeyError
)

export const UpdateOfferErrors = Schema.Union(
  MissingOwnerPrivatePartError,
  DuplicatedPublicKeyError
)

export const CreatePrivatePartErrors = Schema.Union(DuplicatedPublicKeyError)

export const DeletePrivatePartErrors = Schema.Union(
  CanNotDeletePrivatePartOfAuthor
)

export const ReportOfferEndpointErrors = Schema.Union(
  ReportOfferLimitReachedError
)

export const GetOffersByIdsInput = Schema.Struct({
  query: GetOffersByIdsRequest,
})
export type GetOffersByIdsInput = Schema.Schema.Type<typeof GetOffersByIdsInput>

export const GetOffersForMeModifiedOrCreatedAfterInput = Schema.Struct({
  query: GetOffersForMeCreatedOrModifiedAfterRequest,
})
export type GetOffersForMeModifiedOrCreatedAfterInput = Schema.Schema.Type<
  typeof GetOffersForMeModifiedOrCreatedAfterInput
>

export const CreateNewOfferInput = Schema.Struct({
  body: CreateNewOfferRequest,
})
export type CreateNewOfferInput = Schema.Schema.Type<typeof CreateNewOfferInput>

export const RefreshOfferInput = Schema.Struct({
  body: RefreshOfferRequest,
})
export type RefreshOfferInput = Schema.Schema.Type<typeof RefreshOfferInput>

export const DeleteOfferInput = Schema.Struct({
  query: DeleteOfferRequest,
})
export type DeleteOfferInput = Schema.Schema.Type<typeof DeleteOfferInput>

export const UpdateOfferInput = Schema.Struct({
  body: UpdateOfferRequest,
})
export type UpdateOfferInput = Schema.Schema.Type<typeof UpdateOfferInput>

export const CreatePrivatePartInput = Schema.Struct({
  body: CreatePrivatePartRequest,
})
export type CreatePrivatePartInput = Schema.Schema.Type<
  typeof CreatePrivatePartInput
>

export const DeletePrivatePartInput = Schema.Struct({
  body: DeletePrivatePartRequest,
})
export type DeletePrivatePartInput = Schema.Schema.Type<
  typeof DeletePrivatePartInput
>

export const GetRemovedOffersInput = Schema.Struct({
  body: RemovedOfferIdsRequest,
})
export type GetRemovedOffersInput = Schema.Schema.Type<
  typeof GetRemovedOffersInput
>

export const ReportOfferInput = Schema.Struct({
  body: ReportOfferRequest,
})
export type ReportOfferInput = Schema.Schema.Type<typeof ReportOfferInput>
