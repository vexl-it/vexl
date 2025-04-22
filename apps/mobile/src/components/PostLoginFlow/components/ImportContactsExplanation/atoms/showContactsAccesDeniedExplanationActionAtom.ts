import {Effect, pipe} from 'effect'
import {atom} from 'jotai'
import {translationAtom} from '../../../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../../../AreYouSureDialog'

export const showContactsAccessDeniedExplanationActionAtom = atom(
  null,
  (get, set) => {
    const {t} = get(translationAtom)

    return pipe(
      set(askAreYouSureActionAtom, {
        steps: [
          {
            type: 'StepWithText',
            title: t(
              'postLoginFlow.allowContacts.errors.contactsPermissionsDenied'
            ),
            description: t(
              'postLoginFlow.allowContacts.errors.permissionsDeniedDescription'
            ),
            positiveButtonText: t('common.ok'),
          },
        ],
        variant: 'info',
      }),
      Effect.match({
        onSuccess: () => true,
        onFailure: () => true,
      })
    )
  }
)
