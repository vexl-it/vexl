import {type KeyPairV2} from '@vexl-next/cryptography/src/KeyHolder'
import {
  decryptBackupFile,
  type BackupPin,
  type EncryptedBackupFile,
} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {Effect, Option} from 'effect'
import {atom} from 'jotai'

// In memory only, while the restore flow runs.
export const backupFileToRestoreAtom = atom<Option.Option<EncryptedBackupFile>>(
  Option.none()
)
export const backupKeyPairAtom = atom<Option.Option<KeyPairV2>>(Option.none())

export const clearBackupToRestoreActionAtom = atom(null, (_, set) => {
  set(backupFileToRestoreAtom, Option.none())
  set(backupKeyPairAtom, Option.none())
})

export const isBackupForKeyPair = (
  file: EncryptedBackupFile,
  keyPair: KeyPairV2
): boolean => file.publicKey === keyPair.publicKey

export const decryptBackupToRestoreActionAtom = atom(
  null,
  (get, _, pin: BackupPin) =>
    Effect.all({
      file: get(backupFileToRestoreAtom),
      keyPair: get(backupKeyPairAtom),
    }).pipe(
      Effect.flatMap(({file, keyPair}) =>
        decryptBackupFile({file, pin, keyPair})
      )
    )
)
