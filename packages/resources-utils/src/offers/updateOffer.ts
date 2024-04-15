import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type IntendedConnectionLevel,
  type OfferAdminId,
  type OfferInfo,
  type OfferPublicPart,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type OfferPrivateApi} from '@vexl-next/rest-api/src/services/offer'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import decryptOffer, {
  type ErrorDecryptingOffer,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'
import updateOwnerPrivatePayoad from './updateOwnerPrivatePayload'
import encryptOfferPublicPayload, {
  type ErrorEncryptingPublicPart,
} from './utils/encryptOfferPublicPayload'
import {type PrivatePartEncryptionError} from './utils/encryptPrivatePart'

export type ApiErrorUpdatingOffer = ExtractLeftTE<
  ReturnType<OfferPrivateApi['updateOffer']>
>
export default function updateOffer({
  offerApi,
  adminId,
  publicPayload,
  symmetricKey,
  ownerKeypair,
  intendedConnectionLevel,
}: {
  offerApi: OfferPrivateApi
  adminId: OfferAdminId
  publicPayload: OfferPublicPart
  symmetricKey: SymmetricKey
  ownerKeypair: PrivateKeyHolder
  intendedConnectionLevel: IntendedConnectionLevel
}): TE.TaskEither<
  | ApiErrorUpdatingOffer
  | ErrorEncryptingPublicPart
  | PrivatePartEncryptionError
  | ExtractLeftTE<ReturnType<OfferPrivateApi['createPrivatePart']>>
  | ErrorDecryptingOffer
  | NonCompatibleOfferVersionError,
  OfferInfo
> {
  return pipe(
    TE.Do,
    TE.chainW(() =>
      encryptOfferPublicPayload({offerPublicPart: publicPayload, symmetricKey})
    ),
    TE.chainW((encryptedPayload) =>
      pipe(
        offerApi.updateOffer({
          adminId,
          payloadPublic: encryptedPayload,
          offerPrivateList: [],
        }),
        TE.chainW(decryptOffer(ownerKeypair))
      )
    ),
    TE.chainFirstW(() =>
      updateOwnerPrivatePayoad({
        api: offerApi,
        ownerCredentials: ownerKeypair,
        symmetricKey,
        adminId,
        intendedConnectionLevel,
      })
    )
  )
}

// export interface UpdateOfferResult {
//   encryptionErrors: PrivatePartEncryptionError[]
//   offerInfo: OfferInfo
// }

// export function updateOfferReencryptForAll({
//   offerApi,
//   adminId,
//   publicPayload,
//   ownerKeyPair,
//   contactApi,
//   intendedConnectionLevel,
// }: {
//   offerApi: OfferPrivateApi
//   contactApi: ContactPrivateApi
//   adminId: OfferAdminId
//   publicPayload: OfferPublicPart
//   ownerKeyPair: PrivateKeyHolder
//   intendedConnectionLevel: IntendedConnectionLevel
// }): TE.TaskEither<
//   | ErrorGeneratingSymmetricKey
//   | ErrorEncryptingPublicPart
//   | ApiErrorUpdatingOffer
//   | ErrorConstructingPrivatePayloads
//   | ErrorDecryptingOffer
//   | ApiErrorFetchingContactsForOffer,
//   UpdateOfferResult
// > {
//   return pipe(
//     TE.Do,
//     TE.bindW('symmetricKey', () => TE.fromEither(generateSymmetricKey())),
//     TE.bindW('privatePayloads', ({symmetricKey}) =>
//       fetchInfoAndGeneratePrivatePayloads({
//         contactApi,
//         ownerCredentials: ownerKeyPair,
//         symmetricKey,
//         intendedConnectionLevel,
//       })
//     ),
//     TE.bindW('response', ({symmetricKey, privatePayloads}) =>
//       pipe(
//         updateOffer({
//           privatePayloads: [],
//           symmetricKey,
//           ownerKeypair: ownerKeyPair,
//           offerApi,
//           adminId,
//           publicPayload,
//         })
//       )
//     ),
//     TE.map(({response, privatePayloads}) => ({
//       offerInfo: response,
//       encryptionErrors: privatePayloads.errors,
//     }))
//   )
// }
