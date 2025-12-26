import {
  ChatMessagePayload,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import {Either, Option, Schema, type ParseResult} from 'effect/index'
import {pipe} from 'fp-ts/lib/function'
import {stringifyToJson, type JsonStringifyError} from '../../utils/parsing'

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
      Schema.decodeUnknownOption(Base64String),
      Option.match({
        onNone: () => message.deanonymizedUser,
        onSome: (image) => ({
          name,
          partialPhoneNumber,
          imageBase64: image,
        }),
      })
    )
  }

  return undefined
}

export default function serializeChatMessage(
  message: ChatMessage
): Either.Either<string, JsonStringifyError | ParseResult.ParseError> {
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
      myVersion: message.myVersion,
      goldenAvatarType: message.goldenAvatarType,
      lastReceivedVersion: message.lastReceivedVersion,
      deanonymizedUser: deanonymizedUserToPayload(message),
      myFcmCypher: message.myFcmCypher,
      lastReceivedFcmCypher: message.lastReceivedFcmCypher,
      senderClubsUuids: message.senderClubsUuids,
      commonFriends: message.commonFriends,
      friendLevel: message.friendLevel,
    } satisfies ChatMessagePayload,
    Schema.decodeUnknownEither(ChatMessagePayload),
    Either.flatMap(stringifyToJson)
  )
}
