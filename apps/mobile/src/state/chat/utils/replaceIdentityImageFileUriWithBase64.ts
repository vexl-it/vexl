import {type ChatMessage} from '@vexl-next/domain/src/general/messaging'
import {type IdentityRevealChatMessage} from '@vexl-next/domain/src/general/tradeChecklist'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Effect, Schema} from 'effect'
import {File} from 'expo-file-system'
import reportError from '../../../utils/reportError'
import {ReadingFileError, resizeImage} from '../../../utils/resizeImage'

// Undefined when the file can't be read, a local path is no use to the other side.
function imageFileUriToBase64(
  image: UriString | undefined
): Effect.Effect<UriString | undefined> {
  if (!image || image.startsWith('data:')) return Effect.succeed(image)

  return resizeImage({path: image, maxSide: 512, quality: 85}).pipe(
    Effect.flatMap(({uri}) =>
      Effect.try({
        try: () =>
          Schema.decodeSync(UriString)(
            `data:image/jpeg;base64,${new File(uri).base64Sync()}`
          ),
        catch: (cause) => new ReadingFileError({cause}),
      })
    ),
    Effect.catchAll((e) => {
      reportError(
        'error',
        new Error('Error while reading image as file as base64'),
        {e}
      )
      return Effect.succeed(undefined)
    })
  )
}

export function replaceIdentityImageFileUriWithBase64(
  identityRevealChatMessage: IdentityRevealChatMessage | undefined
): Effect.Effect<IdentityRevealChatMessage | undefined> {
  if (!identityRevealChatMessage?.image)
    return Effect.succeed(identityRevealChatMessage)

  return Effect.map(
    imageFileUriToBase64(identityRevealChatMessage.image),
    (image) => ({...identityRevealChatMessage, image})
  )
}

/**
 * Reveal photos of received messages are stored as files. A chat image of a
 * MESSAGE stays as it is.
 */
export function replaceRevealPhotosWithBase64(
  message: ChatMessage
): Effect.Effect<ChatMessage> {
  return Effect.all({
    image:
      message.messageType === 'MESSAGE'
        ? Effect.succeed(message.image)
        : imageFileUriToBase64(message.image),
    identity: replaceIdentityImageFileUriWithBase64(
      message.tradeChecklistUpdate?.identity
    ),
  }).pipe(
    Effect.map(({image, identity}) => ({
      ...message,
      image,
      tradeChecklistUpdate: identity
        ? {...message.tradeChecklistUpdate, identity}
        : message.tradeChecklistUpdate,
    }))
  )
}
