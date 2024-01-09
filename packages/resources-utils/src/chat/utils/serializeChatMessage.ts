import {
  ChatMessagePayload,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {
  type JsonStringifyError,
  type ZodParseError,
  safeParse,
  stringifyToJson,
} from '../../utils/parsing'
import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'

function deanonymizedUserToPayload(
  message: ChatMessage
): ChatMessagePayload['deanonymizedUser'] | undefined {
  if (
    (message.messageType === 'REQUEST_REVEAL' ||
      message.messageType === 'APPROVE_REVEAL' ||
      message.messageType === 'REQUEST_CONTACT_REVEAL' ||
      message.messageType === 'APPROVE_CONTACT_REVEAL') &&
    message.deanonymizedUser
  ) {
    const {name, partialPhoneNumber} = message.deanonymizedUser

    if (!message.image) return message.deanonymizedUser

    return pipe(
      message.image?.replace(/data:image\/.*;base64,/, ''),
      safeParse(Base64String),
      E.match(
        () => message.deanonymizedUser,
        (image) => ({
          name,
          partialPhoneNumber,
          imageBase64: image,
        })
      )
    )
  }

  return undefined
}

export default function serializeChatMessage(
  message: ChatMessage
): E.Either<JsonStringifyError | ZodParseError<ChatMessagePayload>, string> {
  return pipe(
    {
      time: message.time,
      text: message.text,
      uuid: message.uuid,
      image: message.image,
      repliedTo: message.repliedTo,
      messageType: message.messageType,
      minimalRequiredVersion: message.minimalRequiredVersion,
      tradeChecklistUpdate: message.tradeChecklistUpdate,
      deanonymizedUser: deanonymizedUserToPayload(message),
    } satisfies ChatMessagePayload,
    safeParse(ChatMessagePayload),
    E.chainW(stringifyToJson)
  )
}
