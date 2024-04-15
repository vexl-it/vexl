import {type KeyHolder} from '@vexl-next/cryptography'
import {type PrivateKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  LocationPlaceId,
  OfferInfo,
  OfferPrivatePart,
  OfferPublicPart,
  type OfferLocation,
  type PrivatePayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {toError, type BasicError} from '@vexl-next/domain/src/utility/errors'
import {
  Latitude,
  Longitude,
  getDefaultRadius,
} from '@vexl-next/domain/src/utility/geoCoordinates'
import {type ServerOffer} from '@vexl-next/rest-api/src/services/offer/contracts'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {z} from 'zod'
import {stringToBoolean} from '../utils/booleanString'
import {
  aesGCMIgnoreTagDecrypt,
  eciesDecrypt,
  type CryptoError,
} from '../utils/crypto'
import {
  parseJson,
  safeParse,
  type JsonParseError,
  type ZodParseError,
} from '../utils/parsing'

const OfferLocationDeprecated = z.object({
  longitude: z.coerce.number().pipe(Longitude),
  latitude: z.coerce.number().pipe(Latitude),
  city: z.string(),
})
type OfferLocationDeprecated = z.TypeOf<typeof OfferLocationDeprecated>

const OfferLocationStateDeprecated = z.enum(['IN_PERSON', 'ONLINE'])
type OfferLocationStateDeprecated = z.TypeOf<
  typeof OfferLocationStateDeprecated
>

export interface ErrorDecryptingOffer
  extends BasicError<'ErrorDecryptingOffer'> {
  serverOffer: ServerOffer
}

export interface NonCompatibleOfferVersionError {
  _tag: 'NonCompatibleOfferVersionError'
}

function decryptedPayloadsToOffer({
  serverOffer,
  privatePayload,
  publicPayload,
}: {
  serverOffer: ServerOffer
  privatePayload: OfferPrivatePart
  publicPayload: OfferPublicPart
}): E.Either<ZodParseError<OfferInfo>, OfferInfo> {
  return pipe(
    E.right({
      id: serverOffer.id,
      offerId: serverOffer.offerId,
      privatePart: privatePayload,
      publicPart: publicPayload,
      createdAt: serverOffer.createdAt,
      modifiedAt: serverOffer.modifiedAt,
    }),
    E.chainW(safeParse(OfferInfo))
  )
}

function decodeLocation(
  offerJson: any
): E.Either<JsonParseError | ZodParseError<OfferLocationDeprecated>, unknown> {
  if (offerJson.locationV2)
    return E.right({...offerJson, location: offerJson.locationV2})

  return pipe(
    offerJson,
    E.right,
    E.map((one) => one.location ?? []),
    E.chainW(
      flow(
        A.map((oneLocationRaw: unknown) => {
          if (typeof oneLocationRaw === 'string') {
            return pipe(
              parseJson(oneLocationRaw),
              E.chainW(safeParse(OfferLocationDeprecated)),
              E.map((oneLocation) => {
                return {
                  placeId: LocationPlaceId.parse(oneLocation.city),
                  longitude: oneLocation.longitude,
                  latitude: oneLocation.latitude,
                  shortAddress: oneLocation.city,
                  address: oneLocation.city,
                  radius: getDefaultRadius(oneLocation.latitude),
                } satisfies OfferLocation
              })
            )
          }

          return E.right(oneLocationRaw)
        }),
        A.sequence(E.Applicative)
      )
    ),
    E.map((location) => ({...offerJson, location}))
  )
}

function decodeLocationState(
  offerJson: any
): E.Either<ZodParseError<OfferLocationStateDeprecated>, unknown> {
  if (offerJson.locationStateV2)
    return E.right({...offerJson, locationState: offerJson.locationStateV2})

  return pipe(
    offerJson,
    E.right,
    E.map((one) => one.locationState ?? []),
    E.chainW(safeParse(OfferLocationStateDeprecated)),
    E.map((locationState) => ({...offerJson, locationState: [locationState]}))
  )
}

export function decryptPrivatePart(
  privateKey: PrivateKeyPemBase64
): (
  encrypted: PrivatePayloadEncrypted
) => TE.TaskEither<
  CryptoError | JsonParseError | ZodParseError<OfferPrivatePart>,
  OfferPrivatePart
> {
  return (privatePayload) =>
    pipe(
      TE.right(privatePayload.substring(1)),
      TE.chainW(eciesDecrypt(privateKey)),
      TE.chainEitherKW(parseJson),
      TE.chainEitherKW(safeParse(OfferPrivatePart))
    )
}

// TODO write unit test for this function
export default function decryptOffer(
  privateKey: KeyHolder.PrivateKeyHolder
): (
  serverOffer: ServerOffer
) => TE.TaskEither<
  ErrorDecryptingOffer | NonCompatibleOfferVersionError,
  OfferInfo
> {
  return (serverOffer: ServerOffer) => {
    if (
      serverOffer.publicPayload.at(0) !== '0' ||
      serverOffer.privatePayload.at(0) !== '0'
    ) {
      return TE.left({
        _tag: 'NonCompatibleOfferVersionError',
      })
    }

    return pipe(
      TE.right(serverOffer),
      TE.bindTo('serverOffer'),
      TE.bindW('privatePayload', ({serverOffer}) => {
        return pipe(
          TE.right(serverOffer.privatePayload.substring(1)),
          TE.chainW(eciesDecrypt(privateKey.privateKeyPemBase64)),
          TE.chainEitherKW(parseJson),
          TE.chainEitherKW(safeParse(OfferPrivatePart))
        )
      }),
      TE.bindW('publicPayload', ({privatePayload, serverOffer}) => {
        return pipe(
          TE.right(serverOffer.publicPayload.substring(1)),
          TE.chainW(aesGCMIgnoreTagDecrypt(privatePayload.symmetricKey)),
          TE.chainEitherKW(parseJson),
          TE.map((one) => ({
            ...one,
            active: stringToBoolean(one.active),
          })),
          TE.chainEitherKW(decodeLocation),
          TE.chainEitherKW(decodeLocationState),
          TE.chainEitherKW(safeParse(OfferPublicPart))
        )
      }),
      TE.chainEitherKW(decryptedPayloadsToOffer),
      TE.mapLeft((error) => ({
        ...toError(
          'ErrorDecryptingOffer',
          'Error while decrypting offer'
        )(error),
        serverOffer,
      }))
    )
  }
}
