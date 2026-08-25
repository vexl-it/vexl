import {Effect} from 'effect'
import {getPermissionsAsync} from 'expo-contacts'
import {atom} from 'jotai'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import {globalDialogAtom} from '../../GlobalDialog'

/**
 * Shown when the onboarding contact import finished without a single
 * importable contact even though contacts permissions were granted. The
 * typical cause is iOS 18+ limited contacts access with no (or no valid)
 * contacts selected - which the system reports as a granted permission.
 */
export const showNoContactsFoundExplanationActionAtom = atom(
  null,
  (get, set) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const accessPrivileges = yield* _(
        Effect.tryPromise(async () => await getPermissionsAsync()),
        Effect.map((permissions) => permissions.accessPrivileges),
        Effect.catchAll(() => Effect.succeed(undefined))
      )

      reportError(
        'warn',
        new Error('Onboarding contact import found no importable contacts'),
        {accessPrivileges}
      )

      const limitedAccess = accessPrivileges === 'limited'

      yield* _(
        set(globalDialogAtom, {
          title: limitedAccess
            ? t('postLoginFlow.contactsImport.limitedAccess.title')
            : t('postLoginFlow.contactsImport.noContactsFound.title'),
          subtitle: limitedAccess
            ? t('postLoginFlow.contactsImport.limitedAccess.description')
            : t('postLoginFlow.contactsImport.noContactsFound.description'),
          positiveButtonText: t('common.ok'),
        }),
        Effect.match({onSuccess: () => true, onFailure: () => true})
      )
    })
  }
)
