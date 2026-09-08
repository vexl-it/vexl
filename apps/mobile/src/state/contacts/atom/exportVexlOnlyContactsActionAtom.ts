import {Array, Effect, Option, Record, Schema, pipe} from 'effect'
import {shareAsync} from 'expo-sharing'
import {atom} from 'jotai'
import {showErrorAlert} from '../../../components/ErrorAlert'
import {askAreYouSureActionAtom} from '../../../components/GlobalDialog'
import {getContactsBackupFile} from '../../../utils/fsDirectories'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {contactsToVcardString, type VcardContact} from '../../../utils/vCard'
import {type StoredContactWithComputedValues} from '../domain'
import {vexlOnlyContactsAtom} from './vexlOnlyContactsAtoms'

class ContactsExportError extends Schema.TaggedError<ContactsExportError>(
  'ContactsExportError'
)('ContactsExportError', {
  cause: Schema.Unknown,
}) {}

// Rows of one person (shared contact id) become one card with every
// phone number and email; rows without an id get a card each
function groupIntoVcardContacts(
  contacts: readonly StoredContactWithComputedValues[]
): VcardContact[] {
  return pipe(
    contacts,
    Array.groupBy((contact) =>
      pipe(
        contact.info.nonUniqueContactId,
        Option.getOrElse(() => contact.computedValues.normalizedValue)
      )
    ),
    Record.values,
    Array.filterMap((rows) =>
      pipe(
        Array.head(rows),
        Option.map((first) => ({
          name: first.info.name,
          phoneNumbers: pipe(
            rows,
            Array.filter((row) => row.info.kind === 'phone'),
            Array.map((row) => row.computedValues.normalizedValue)
          ),
          emails: pipe(
            rows,
            Array.filter((row) => row.info.kind === 'email'),
            Array.map((row) => row.computedValues.normalizedValue)
          ),
        }))
      )
    )
  )
}

export const exportVexlOnlyContactsActionAtom = atom(
  null,
  (get, set): Effect.Effect<boolean> => {
    const {t} = get(translationAtom)
    const vexlOnlyContacts = get(vexlOnlyContactsAtom)

    if (!Array.isNonEmptyArray(vexlOnlyContacts)) {
      return Effect.succeed(false)
    }

    const vcardString = contactsToVcardString(
      groupIntoVcardContacts(vexlOnlyContacts)
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
      Effect.zipRight(
        set(askAreYouSureActionAtom, {
          variant: 'info',
          steps: [
            {
              type: 'StepWithText',
              title: t('vexlOnlyContacts.exportSuccessTitle'),
              description: t('vexlOnlyContacts.exportSuccessDescription'),
              positiveButtonText: t('common.gotIt'),
            },
          ],
        }).pipe(Effect.ignore)
      ),
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
