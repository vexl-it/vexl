import {type IdentityRevealChatMessage} from '@vexl-next/domain/src/general/tradeChecklist'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Effect, Schema} from 'effect'
import {File} from 'expo-file-system'
import reportError from '../../../utils/reportError'
import {resizeImage} from '../../../utils/resizeImage'

export function replaceIdentityImageFileUriWithBase64(
  identityRevealChatMessage: IdentityRevealChatMessage | undefined
): Effect.Effect<IdentityRevealChatMessage | undefined> {
  const image = identityRevealChatMessage?.image

  if (!image) return Effect.succeed(identityRevealChatMessage)

  return resizeImage({path: image, maxSide: 512, quality: 85}).pipe(
    Effect.map(({uri}) =>
      Schema.decodeSync(UriString)(
        `data:image/jpeg;base64,${new File(uri).base64Sync()}`
      )
    ),
    Effect.map((image) => ({...identityRevealChatMessage, image})),
    Effect.catchAll((e) => {
      reportError(
        'error',
        new Error('Error while reading image as file as base64'),
        {e}
      )
      return Effect.succeed(identityRevealChatMessage)
    })
  )
}
