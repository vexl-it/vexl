import {type OfferPrivateApi} from '@vexl-next/rest-api/dist/services/offer'
import {type OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {
  type OfferInfo,
  type OfferPublicPart,
  type SymmetricKey,
} from '@vexl-next/domain/dist/general/offers'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import encryptOfferPublicPayload, {
  type ErrorEncryptingPublicPart,
} from './utils/encryptOfferPublicPayload'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import decryptOffer, {
  type ErrorDecryptingOffer,
  type NonCompatibleOfferVersionError,
} from './decryptOffer'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {type CountryPrefix} from '@vexl-next/domain/dist/general/CountryPrefix.brand'

export type ApiErrorUpdatingOffer = ExtractLeftTE<
  ReturnType<OfferPrivateApi['updateOffer']>
>
export default function updateOffer({
  offerApi,
  adminId,
  publicPayload,
  countryPrefix,
  symmetricKey,
  ownerKeypair,
}: {
  offerApi: OfferPrivateApi
  adminId: OfferAdminId
  publicPayload: OfferPublicPart
  countryPrefix: CountryPrefix
  symmetricKey: SymmetricKey
  ownerKeypair: PrivateKeyHolder
}): TE.TaskEither<
  | ApiErrorUpdatingOffer
  | ErrorEncryptingPublicPart
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
          countryPrefix,
          payloadPublic: encryptedPayload,
          offerPrivateList: [],
        }),
        TE.chainW(decryptOffer(ownerKeypair))
      )
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
