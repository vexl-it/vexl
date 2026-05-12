import {Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {globalDialogAtom} from '../../GlobalDialog'

export const showContactsAccessDeniedExplanationActionAtom = atom(
  null,
  (get, set) => {
    const {t} = get(translationAtom)

    return pipe(
      set(globalDialogAtom, {
        title: t(
          'postLoginFlow.allowContacts.errors.contactsPermissionsDenied'
        ),
        subtitle: t(
          'postLoginFlow.allowContacts.errors.permissionsDeniedDescription'
        ),
        positiveButtonText: t('common.ok'),
      }),
      Effect.match({
        onSuccess: () => true,
        onFailure: () => true,
      })
    )
  }
)
