import {type OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {type OfferPrivateApi} from '@vexl-next/rest-api/dist/services/offer'
import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import {
  encryptPrivatePart,
  type OfferPrivatePayloadToEncrypt,
  type PrivatePartEncryptionError,
} from './utils/offerPrivatePayload'
import flattenTaskOfEithers from '../utils/flattenTaskOfEithers'
import {type BasicError, toError} from '@vexl-next/domain/dist/utility/errors'

export type ApiErrorAddingPrivateParts =
  BasicError<'ApiErrorAddingPrivateParts'>
export function addPrivatePartsToOffer({
  adminId,
  privateParts,
  api,
}: {
  adminId: OfferAdminId
  privateParts: OfferPrivatePayloadToEncrypt[]
  api: OfferPrivateApi
}): TE.TaskEither<ApiErrorAddingPrivateParts, PrivatePartEncryptionError[]> {
  return pipe(
    privateParts,
    A.map(encryptPrivatePart),
    A.sequence(T.ApplicativePar),
    flattenTaskOfEithers,
    TE.fromTask,
    TE.chainFirstW(({rights}) =>
      api.createPrivatePart({offerPrivateList: rights, adminId})
    ),
    TE.map(({lefts}) => lefts),
    TE.mapLeft(toError('ApiErrorAddingPrivateParts'))
  )
}
