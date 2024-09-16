import {type OfferAdminId} from '@vexl-next/domain/src/general/offers'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {effectToTaskEither} from '../effect-helpers/TaskEitherConverter'
import {type ExtractErrorFromEffect} from '../utils/ExtractErrorFromEffect'
import flattenTaskOfEithers from '../utils/flattenTaskOfEithers'
import {type OfferPrivatePayloadToEncrypt} from './utils/constructPrivatePayloads'
import {
  encryptPrivatePart,
  type PrivatePartEncryptionError,
} from './utils/encryptPrivatePart'

export type ApiErrorAddingPrivateParts = ExtractErrorFromEffect<
  ReturnType<OfferApi['createPrivatePart']>
>

export function addPrivatePartsToOffer({
  adminId,
  privateParts,
  api,
}: {
  adminId: OfferAdminId
  privateParts: OfferPrivatePayloadToEncrypt[]
  api: OfferApi
}): TE.TaskEither<ApiErrorAddingPrivateParts, PrivatePartEncryptionError[]> {
  return pipe(
    privateParts,
    A.map(encryptPrivatePart),
    A.sequence(T.ApplicativePar),
    flattenTaskOfEithers,
    TE.fromTask,
    TE.chainFirstW(({rights}) =>
      effectToTaskEither(
        api.createPrivatePart({body: {offerPrivateList: rights, adminId}})
      )
    ),
    TE.map(({lefts}) => lefts)
  )
}
