import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ChatMessageId,
  ChatMessagePayload,
  ServerMessage,
  generateChatMessageId,
  type ChatMessage,
  type ChatMessageRequiringNewerVersion,
} from '@vexl-next/domain/src/general/messaging'
import {
  SemverString,
  compare as compareSemver,
} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {
  UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {toError, type BasicError} from '@vexl-next/domain/src/utility/errors'
import {Either, Option, Schema, flow} from 'effect'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {effectToEither} from '../../effect-helpers/TaskEitherConverter'
import {parseJson} from '../../utils/parsing'

function setImageForBackwardCompatibility(
  payload: ChatMessagePayload
): ChatMessagePayload {
  if (payload.image) return payload

  if (
    (payload.messageType === 'APPROVE_REVEAL' ||
      payload.messageType === 'REQUEST_REVEAL') &&
    payload.deanonymizedUser?.imageBase64
  ) {
    return pipe(
      `data:image/jpg;base64,${payload.deanonymizedUser.imageBase64}`,
      Schema.decodeUnknownOption(UriString),
      Option.match({
        onNone: () => payload,
        onSome: (image) => ({...payload, image}),
      })
    )
  }
  return payload
}

export type ErrorParsingChatMessage = BasicError<'ErrorParsingChatMessage'>
export interface ErrorChatMessageRequiresNewerVersion {
  _tag: 'ErrorChatMessageRequiresNewerVersion'
  message: ChatMessageRequiringNewerVersion
}

const ChatMessageRequiringNewerVersionWithDefaults = Schema.Struct({
  minimalRequiredVersion: SemverString,
  senderPublicKey: PublicKeyPemBase64,
  messageParsed: Schema.Unknown,
  serverMessage: ServerMessage,
  myVersion: Schema.optionalWith(SemverString, {nullable: true}),
  time: UnixMilliseconds.pipe(
    Schema.annotations({
      decodingFallback: () => Either.right(unixMillisecondsNow()),
    })
  ),
  uuid: ChatMessageId.pipe(
    Schema.annotations({
      decodingFallback: () => Either.right(generateChatMessageId()),
    })
  ),
  text: Schema.Literal('-').pipe(
    Schema.annotations({
      decodingFallback: () => Either.right('-'),
    })
  ),
})

function ensureCompatibleVersion({
  appVersion,
  serverMessage,
}: {
  appVersion: SemverString
  serverMessage: ServerMessage
}): (
  payloadJson: unknown
) => E.Either<
  ErrorChatMessageRequiresNewerVersion | ErrorParsingChatMessage,
  unknown
> {
  return (payloadJson) => {
    try {
      const unsafeMinimalRequiredVersion = (payloadJson as any)
        .minimalRequiredVersion
      // If it's not set, we assume it's sent from earlier versions and this is compatible
      if (!unsafeMinimalRequiredVersion) return E.right(payloadJson)

      const minimalRequiredVersionParsed = pipe(
        Schema.decodeUnknownOption(SemverString)(unsafeMinimalRequiredVersion)
      )
      if (Option.isNone(minimalRequiredVersionParsed))
        return E.left(
          toError('ErrorParsingChatMessage')(
            new Error('Invalid semver version')
          )
        )

      if (compareSemver(appVersion)('>=', minimalRequiredVersionParsed.value)) {
        // Is compatible
        return E.right(payloadJson)
      }

      const errorDataParsed = Schema.decodeUnknownOption(
        ChatMessageRequiringNewerVersionWithDefaults
      )({
        messageParsed: payloadJson,
        serverMessage,
        senderPublicKey: serverMessage.senderPublicKey,
        ...(payloadJson as any),
      })
      if (Option.isNone(errorDataParsed))
        return E.left(
          toError('ErrorParsingChatMessage')(
            new Error('Failed to parse error data')
          )
        )

      return E.left({
        _tag: 'ErrorChatMessageRequiresNewerVersion',
        message: {
          ...errorDataParsed.value,
          myVersion: errorDataParsed.value.myVersion,
          messageType: 'REQUIRES_NEWER_VERSION',
        },
      } satisfies ErrorChatMessageRequiresNewerVersion)
    } catch (error) {
      return E.left(toError('ErrorParsingChatMessage')(error))
    }
  }
}

export function chatMessagePayloadToChatMessage(
  senderPublicKey: PublicKeyPemBase64
): (payload: ChatMessagePayload) => ChatMessage {
  return (payload) => ({
    uuid: payload.uuid,
    time: payload.time,
    minimalRequiredVersion: payload.minimalRequiredVersion,
    repliedTo: payload.repliedTo,
    text: payload.text ?? '-',
    messageType: payload.messageType,
    image: payload.image,
    deanonymizedUser: payload.deanonymizedUser
      ? {
          name: payload.deanonymizedUser.name,
          partialPhoneNumber: payload.deanonymizedUser.partialPhoneNumber,
          fullPhoneNumber: payload.deanonymizedUser.fullPhoneNumber,
        }
      : undefined,
    senderPublicKey,
    myVersion: payload.myVersion,
    goldenAvatarType: payload.goldenAvatarType,
    lastReceivedVersion: payload.lastReceivedVersion,
    tradeChecklistUpdate: payload.tradeChecklistUpdate,
    myFcmCypher: payload.myFcmCypher,
    lastReceivedFcmCypher: payload.lastReceivedFcmCypher,
    senderClubsUuids: payload.senderClubsUuids,
    commonFriends: payload.commonFriends,
    friendLevel: payload.friendLevel,
  })
}

export function parseChatMessage({
  appVersion,
  serverMessage,
}: {
  appVersion: SemverString
  serverMessage: ServerMessage
}): (
  jsonString: string
) => E.Either<
  ErrorParsingChatMessage | ErrorChatMessageRequiresNewerVersion,
  ChatMessage
> {
  return (jsonString) => {
    return pipe(
      E.right(jsonString),
      E.chainW(parseJson),
      E.chainFirstW(ensureCompatibleVersion({appVersion, serverMessage})),
      E.chainW(flow(Schema.decodeUnknown(ChatMessagePayload), effectToEither)),
      E.map(setImageForBackwardCompatibility),
      E.map(chatMessagePayloadToChatMessage(serverMessage.senderPublicKey)),
      E.mapLeft((error) => {
        if (error._tag === 'ErrorChatMessageRequiresNewerVersion') return error
        return toError('ErrorParsingChatMessage')(error)
      })
    )
  }
}
