import {Array, Effect, Schema, pipe} from 'effect'
import {File, Paths} from 'expo-file-system'
import {shareAsync} from 'expo-sharing'
import {atom} from 'jotai'
import {showErrorAlert} from '../../../components/ErrorAlert'
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
        const backupFile = new File(Paths.cache, 'vexl-contacts-backup.vcf')
        if (backupFile.info().exists) backupFile.delete()
        backupFile.write(vcardString, {encoding: 'utf8'})
        try {
          await shareAsync(backupFile.uri, {
            mimeType: 'text/vcard',
            UTI: 'public.vcard',
            dialogTitle: t('vexlOnlyContacts.exportSheetTitle'),
          })
        } finally {
          // don't leave a plaintext dump of the user's contacts in the cache
          if (backupFile.info().exists) backupFile.delete()
        }
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
