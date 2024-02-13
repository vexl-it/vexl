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
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {z} from 'zod'
import {parseJson, safeParse} from '../../utils/parsing'

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
      safeParse(UriString),
      E.fold(
        () => payload,
        (image) => ({...payload, image})
      )
    )
  }
  return payload
}

export type ErrorParsingChatMessage = BasicError<'ErrorParsingChatMessage'>
export interface ErrorChatMessageRequiresNewerVersion {
  _tag: 'ErrorChatMessageRequiresNewerVersion'
  message: ChatMessageRequiringNewerVersion
}

const ChatMessageRequiringNewerVersionWithDefaults = z.object({
  minimalRequiredVersion: SemverString,
  senderPublicKey: PublicKeyPemBase64,
  messageParsed: z.unknown(),
  serverMessage: ServerMessage,
  myVersion: SemverString.optional(),
  time: UnixMilliseconds.catch(() => unixMillisecondsNow()),
  uuid: ChatMessageId.catch(() => generateChatMessageId()),
  text: z.literal('-').catch('-'),
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

      const minimalRequiredVersionParsed = SemverString.safeParse(
        unsafeMinimalRequiredVersion
      )
      if (!minimalRequiredVersionParsed.success)
        return E.left(
          toError('ErrorParsingChatMessage')(minimalRequiredVersionParsed.error)
        )

      if (compareSemver(appVersion)('>=', minimalRequiredVersionParsed.data)) {
        // Is compatible
        return E.right(payloadJson)
      }

      const errorDataParsed =
        ChatMessageRequiringNewerVersionWithDefaults.safeParse({
          messageParsed: payloadJson,
          serverMessage,
          senderPublicKey: serverMessage.senderPublicKey,
          ...(payloadJson as any),
        })
      if (!errorDataParsed.success)
        return E.left(toError('ErrorParsingChatMessage')(errorDataParsed.error))

      return E.left({
        _tag: 'ErrorChatMessageRequiresNewerVersion',
        message: {
          ...errorDataParsed.data,
          myVersion: errorDataParsed.data.myVersion,
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
    lastReceivedVersion: payload.lastReceivedVersion,
    tradeChecklistUpdate: payload.tradeChecklistUpdate,
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
    console.log(
      `Parsing chat message: ${JSON.stringify(JSON.parse(jsonString), null, 2)}`
    )
    return pipe(
      E.right(jsonString),
      E.chainW(parseJson),
      E.chainFirstW(ensureCompatibleVersion({appVersion, serverMessage})),
      E.chainW(safeParse(ChatMessagePayload)),
      E.map(setImageForBackwardCompatibility),
      E.map(chatMessagePayloadToChatMessage(serverMessage.senderPublicKey)),
      E.mapLeft((error) => {
        if (error._tag === 'ErrorChatMessageRequiresNewerVersion') return error
        return toError('ErrorParsingChatMessage')(error)
      })
    )
  }
}
