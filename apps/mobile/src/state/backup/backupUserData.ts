import {type UserNameAndUriAvatar} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {type BackupUserData} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {Option, Schema} from 'effect'
import {Directory, File, Paths} from 'expo-file-system'
import {PROFILE_PICTURE_DIRECTORY} from '../../utils/fsDirectories'
import reportError from '../../utils/reportError'
import resolveLocalUri from '../../utils/resolveLocalUri'

type BackupAvatar = NonNullable<BackupUserData['image']>

const readAvatar = (imageUri: UriString): Option.Option<BackupAvatar> =>
  Option.liftThrowable(() => {
    const file = new File(resolveLocalUri(imageUri))
    return {
      base64: Schema.decodeSync(Base64String)(file.base64Sync()),
      extension: file.extension.replace('.', '').toLowerCase() || 'jpeg',
    }
  })()

// A missing avatar file only costs the avatar, not the backup.
export const userDataForBackup = (
  realUserData: UserNameAndUriAvatar | undefined
): BackupUserData | undefined => {
  if (!realUserData) return undefined

  const image = realUserData.image
    ? readAvatar(realUserData.image.imageUri)
    : Option.none()
  if (realUserData.image && Option.isNone(image))
    reportError('warn', new Error('Could not read avatar for account backup'))

  return {
    userName: realUserData.userName,
    image: Option.getOrUndefined(image),
  }
}

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
