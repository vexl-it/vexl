import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {hashMD5} from '@vexl-next/resources-utils/src/utils/crypto'
import {Directory, Paths} from 'expo-file-system'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import reportError from './reportError'

export const IMAGES_DIRECTORY = 'chat-images'
export const PROFILE_PICTURE_DIRECTORY = 'profilePicture'

export async function deleteAllFiles(): Promise<void> {
  const documentDirectory = Paths.document
  if (!documentDirectory) return

  const imagesDirectory = new Directory(documentDirectory, IMAGES_DIRECTORY)
  imagesDirectory.delete()

  const profilePictureDirectory = new Directory(
    documentDirectory,
    PROFILE_PICTURE_DIRECTORY
  )
  profilePictureDirectory.delete()
}

export async function deleteChatFiles(
  myPublicKey: PublicKeyPemBase64,
  otherSidePublicKey: PublicKeyPemBase64
): Promise<void> {
  const documentDirectory = Paths.document
  if (!documentDirectory) return

  const chatImagesDir = pipe(
    hashMD5(`${myPublicKey}${otherSidePublicKey}`),
    E.mapLeft((e) => {
      reportError(
        'warn',
        new Error('Error getting MD5 of public key while deleting chat files'),
        {e}
      )
    }),
    E.getOrElse(() => '')
  )

  if (!chatImagesDir) return

  const imagesDirectory = new Directory(documentDirectory, IMAGES_DIRECTORY)
  const chatImagesDirectory = new Directory(imagesDirectory, chatImagesDir)

  chatImagesDirectory.delete()
}
