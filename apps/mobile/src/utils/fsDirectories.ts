import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {hashMD5} from '@vexl-next/resources-utils/src/utils/crypto'
import {Option} from 'effect'
import {Directory, File, Paths} from 'expo-file-system'
import * as E from 'fp-ts/Either'
import reportError from './reportError'

export const IMAGES_DIRECTORY = 'chat-images'
export const PROFILE_PICTURE_DIRECTORY = 'profilePicture'
const CONTACTS_BACKUP_FILE = 'vexl-contacts-backup.vcf'
const ACCOUNT_BACKUP_DIRECTORY = 'account-backup'

export function getContactsBackupFile(): File {
  return new File(Paths.cache, CONTACTS_BACKUP_FILE)
}

// Lives in the cache dir, which neither iOS nor Android include in device backups.
export function getAccountBackupDirectory(): Directory {
  return new Directory(Paths.cache, ACCOUNT_BACKUP_DIRECTORY)
}

export function deleteIfExists(path: Directory | File): void {
  if (path.exists) path.delete()
}

export async function deleteAllFiles(): Promise<void> {
  const documentDirectory = Paths.document
  if (!documentDirectory) return

  deleteIfExists(new Directory(documentDirectory, IMAGES_DIRECTORY))
  deleteIfExists(new Directory(documentDirectory, PROFILE_PICTURE_DIRECTORY))
  deleteIfExists(getContactsBackupFile())
  deleteIfExists(getAccountBackupDirectory())
}

export interface ChatKeys {
  inboxKey: PublicKeyPemBase64
  otherSideKey: PublicKeyPemBase64
}

export function getChatImagesDirectory({
  inboxKey,
  otherSideKey,
}: ChatKeys): Option.Option<Directory> {
  const chatDirectory = hashMD5(`${inboxKey}${otherSideKey}`)
  if (E.isLeft(chatDirectory)) return Option.none()

  return Option.some(
    new Directory(Paths.document, IMAGES_DIRECTORY, chatDirectory.right)
  )
}

export function deleteChatFiles(chatKeys: ChatKeys): void {
  try {
    Option.map(getChatImagesDirectory(chatKeys), deleteIfExists)
  } catch (e) {
    reportError('warn', new Error('Error while deleting chat files'), {e})
  }
}
