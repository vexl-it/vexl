import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Effect, Option, Schema} from 'effect'
import {File} from 'expo-file-system'
import {
  type ChatKeys,
  getChatImagesDirectory,
} from '../../../utils/fsDirectories'
import reportError from '../../../utils/reportError'
import {type ChatMessageWithState} from '../domain'

function saveBase64ImageToStorage(
  base64: UriString,
  chatKeys: ChatKeys
): Effect.Effect<UriString | undefined> {
  return Effect.try(() => {
    const [prefix, content] = base64.split(',')
    const suffix = prefix?.match(/:image\/(.+?);/)?.at(1)
    if (!suffix || !content) throw new Error('Not valid base64')

    const directory = Option.getOrThrow(getChatImagesDirectory(chatKeys))
    directory.create({intermediates: true, idempotent: true})
    const file = new File(directory, `${generateUuid()}.${suffix}`)
    file.write(content, {encoding: 'base64'})

    return Schema.decodeSync(UriString)(file.uri)
  }).pipe(
    Effect.catchAll((e) => {
      reportError('error', new Error('Error while processing message image'), {
        e,
      })
      return Effect.succeed(undefined)
    })
  )
}

/**
 * Stores revealed identity photos, received as base64, to files.
 */
export default function replaceBase64UriWithImageFileUri(
  message: ChatMessageWithState,
  chatKeys: ChatKeys
): Effect.Effect<ChatMessageWithState> {
  if (message.state === 'receivedButRequiresNewerVersion')
    return Effect.succeed(message)

  const {deanonymizedUser, image, tradeChecklistUpdate} = message.message
  const identity = tradeChecklistUpdate?.identity
  if (!deanonymizedUser && !identity) return Effect.succeed(message)

  return Effect.all({
    image: image
      ? saveBase64ImageToStorage(image, chatKeys)
      : Effect.succeed(undefined),
    identityImage: identity?.image
      ? saveBase64ImageToStorage(identity.image, chatKeys)
      : Effect.succeed(undefined),
  }).pipe(
    Effect.map(({image, identityImage}) => ({
      ...message,
      message: {
        ...message.message,
        image,
        tradeChecklistUpdate: identity
          ? {identity: {...identity, image: identityImage}}
          : tradeChecklistUpdate,
      },
    }))
  )
}
