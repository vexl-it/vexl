import {type OfferPrivateApi} from '@vexl-next/rest-api/src/services/offer'
import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import {
  encryptPrivatePart,
  type PrivatePartEncryptionError,
} from './utils/offerPrivatePayload'
import flattenTaskOfEithers from '../utils/flattenTaskOfEithers'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {type OfferPrivatePayloadToEncrypt} from './utils/constructPrivatePayloads'
import {type OfferAdminId} from '@vexl-next/domain/src/general/offers'

export type ApiErrorAddingPrivateParts = ExtractLeftTE<
  ReturnType<OfferPrivateApi['createPrivatePart']>
>

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
    TE.map(({lefts}) => lefts)
  )
}
