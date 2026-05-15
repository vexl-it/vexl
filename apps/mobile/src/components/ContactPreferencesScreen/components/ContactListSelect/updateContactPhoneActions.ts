import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {Linking} from 'react-native'
import {addContactToPhoneActionAtom} from '../../../../state/contacts/atom/addContactToPhoneWithUIFeedbackAtom'
import {type StoredContactWithComputedValues} from '../../../../state/contacts/domain'
import {areContactsPermissionsGranted} from '../../../../state/contacts/utils'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {showErrorAlert} from '../../../ErrorAlert'
import {globalDialogAtom} from '../../../GlobalDialog'

type PhoneSaveResult =
  | 'notRequested'
  | 'saved'
  | 'permissionsMissing'
  | 'failed'

interface SaveContactToPhoneParams {
  readonly name: string
  readonly number: E164PhoneNumber
  readonly phoneContactId: StoredContactWithComputedValues['info']['nonUniqueContactId']
  readonly saveToPhone: boolean
}

export const saveContactToPhoneIfRequestedActionAtom = atom(
  null,
  (
    get,
    set,
    params: SaveContactToPhoneParams
  ): Effect.Effect<PhoneSaveResult> => {
    const {t} = get(translationAtom)

    if (!params.saveToPhone) {
      return Effect.succeed('notRequested' satisfies PhoneSaveResult)
    }

    return Effect.gen(function* (_) {
      const contactsPermissionsGranted = yield* _(
        areContactsPermissionsGranted().pipe(
          Effect.catchAll(() => Effect.succeed(false))
        )
      )

      if (!contactsPermissionsGranted) {
        return 'permissionsMissing' satisfies PhoneSaveResult
      }

      const phoneContactSaved = yield* _(
        set(addContactToPhoneActionAtom, {
          customName: params.name,
          number: params.number,
          phoneContactId: params.phoneContactId,
        }).pipe(
          Effect.match({
            onFailure: (e) => {
              if (e._tag === 'ErrorAddingContactToPhoneContacts') {
                showErrorAlert({
                  title: t('contacts.errorAddingContactToYourPhoneContacts'),
                  error: e,
                })
              }

              return false
            },
            onSuccess: () => true,
          })
        )
      )

      return phoneContactSaved
        ? ('saved' satisfies PhoneSaveResult)
        : ('failed' satisfies PhoneSaveResult)
    })
  }
)

export const showContactUpdateSavedDialogActionAtom = atom(
  null,
  (get, set, phoneSaveResult: PhoneSaveResult): Effect.Effect<void> => {
    const {t} = get(translationAtom)

    if (phoneSaveResult === 'permissionsMissing') {
      return Effect.gen(function* (_) {
        const shouldOpenSettings = yield* _(
          set(globalDialogAtom, {
            title: t('addContactDialog.contactAddedToVexlOnlyTitle'),
            subtitle: t('addContactDialog.contactAddedToVexlOnlyDescription'),
            positiveButtonText: t('common.openSettings'),
            negativeButtonText: t('common.close'),
          })
        )

        if (shouldOpenSettings) {
          yield* _(
            Effect.sync(() => {
              void Linking.openSettings()
            })
          )
        }
      })
    }

    if (phoneSaveResult === 'failed') {
      return Effect.void
    }

    return pipe(
      set(globalDialogAtom, {
        title: t('addContactDialog.changesSaved'),
      }),
      Effect.asVoid
    )
  }
)
