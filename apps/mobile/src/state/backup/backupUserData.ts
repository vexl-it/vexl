import {type UserNameAndUriAvatar} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {type BackupUserData} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {Effect, Option, Schema} from 'effect'
import {Directory, File, Paths} from 'expo-file-system'
import {PROFILE_PICTURE_DIRECTORY} from '../../utils/fsDirectories'
import reportError from '../../utils/reportError'
import {resizeImage} from '../../utils/resizeImage'

type BackupAvatar = NonNullable<BackupUserData['image']>

// A full-quality avatar alone could outgrow what a restore reads, so it is
// shrunk, and left out when it still doesn't fit.
const AVATAR_MAX_SIDE = 512
const AVATAR_QUALITY = 80
const MAX_AVATAR_BASE64_LENGTH = 1024 * 1024

const readResizedAvatar = (uri: string): string => {
  const file = new File(uri)
  try {
    return file.base64Sync()
  } finally {
    file.delete()
  }
}

const readAvatar = (
  imageUri: UriString
): Effect.Effect<Option.Option<BackupAvatar>> =>
  resizeImage({
    path: imageUri,
    maxSide: AVATAR_MAX_SIDE,
    quality: AVATAR_QUALITY,
  }).pipe(
    Effect.flatMap(({uri}) => Effect.try(() => readResizedAvatar(uri))),
    Effect.flatMap(Schema.decode(Base64String)),
    Effect.map((base64) =>
      base64.length <= MAX_AVATAR_BASE64_LENGTH
        ? Option.some({base64, extension: 'jpeg'})
        : Option.none()
    ),
    Effect.orElseSucceed(() => Option.none<BackupAvatar>())
  )

// A missing or oversized avatar only costs the avatar, not the backup.
export const userDataForBackup = (
  realUserData: UserNameAndUriAvatar | undefined
): Effect.Effect<BackupUserData | undefined> =>
  Effect.gen(function* () {
    if (!realUserData) return undefined

    const image = realUserData.image
      ? yield* readAvatar(realUserData.image.imageUri)
      : Option.none()
    if (realUserData.image && Option.isNone(image))
      reportError('warn', new Error('Could not back up the avatar'))

    return {
      userName: realUserData.userName,
      image: Option.getOrUndefined(image),
    }
  })

const writeAvatar = (avatar: BackupAvatar): Option.Option<UriString> =>
  Option.liftThrowable(() => {
    const directory = new Directory(Paths.document, PROFILE_PICTURE_DIRECTORY)
    if (!directory.exists) directory.create({intermediates: true})

    const file = new File(directory, `${generateUuid()}.${avatar.extension}`)
    file.write(avatar.base64, {encoding: 'base64'})
    return Schema.decodeSync(UriString)(file.uri)
  })()

export const restoredUserData = (
  userData: BackupUserData | undefined
): UserNameAndUriAvatar | undefined => {
  if (!userData) return undefined

  const imageUri = userData.image
    ? writeAvatar(userData.image)
    : Option.none<UriString>()
  if (userData.image && Option.isNone(imageUri))
    reportError('warn', new Error('Could not write restored avatar'))

  return {
    userName: userData.userName,
    image: Option.match(imageUri, {
      onNone: () => undefined,
      onSome: (uri) => ({type: 'imageUri', imageUri: uri}),
    }),
  }
}
