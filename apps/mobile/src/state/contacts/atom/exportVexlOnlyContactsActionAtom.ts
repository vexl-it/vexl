import {Array, Effect, Schema, pipe} from 'effect'
import {shareAsync} from 'expo-sharing'
import {atom} from 'jotai'
import {showErrorAlert} from '../../../components/ErrorAlert'
import {getContactsBackupFile} from '../../../utils/fsDirectories'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {contactsToVcardString} from '../../../utils/vCard'
import {vexlOnlyContactsAtom} from './vexlOnlyContactsAtoms'

class ContactsExportError extends Schema.TaggedError<ContactsExportError>(
  'ContactsExportError'
)('ContactsExportError', {
  cause: Schema.Unknown,
}) {}

export const exportVexlOnlyContactsActionAtom = atom(
  null,
  (get): Effect.Effect<boolean> => {
    const {t} = get(translationAtom)
    const vexlOnlyContacts = get(vexlOnlyContactsAtom)

    if (!Array.isNonEmptyArray(vexlOnlyContacts)) {
      return Effect.succeed(false)
    }

    const vcardString = contactsToVcardString(
      pipe(
        vexlOnlyContacts,
        Array.map((one) => ({
          name: one.info.name,
          phoneNumber: one.computedValues.normalizedNumber,
        }))
      )
    )

    return Effect.tryPromise({
      try: async () => {
        // Android share targets (Gmail, Drive) may read the content:// URI in
        // the background after the user is already back in Vexl, so the file
        // is not deleted after sharing. The next export overwrites it and
        // logout deletes it (deleteAllFiles).
        const backupFile = getContactsBackupFile()
        backupFile.write(vcardString, {encoding: 'utf8'})
        await shareAsync(backupFile.uri, {
          mimeType: 'text/vcard',
          UTI: 'public.vcard',
          dialogTitle: t('vexlOnlyContacts.exportSheetTitle'),
        })
      },
      catch: (e) => new ContactsExportError({cause: e}),
    }).pipe(
      Effect.as(true),
      Effect.catchAll((e) =>
        Effect.sync(() => {
          showErrorAlert({
            title: t('common.somethingWentWrong'),
            error: e,
          })
          return false
        })
      )
    )
  }
)
