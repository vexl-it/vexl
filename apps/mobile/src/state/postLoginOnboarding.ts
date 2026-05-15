import {Array, Effect, Option, Schema} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {atom, useAtomValue} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {showErrorAlert} from '../components/ErrorAlert'
import {atomWithParsedMmkvStorage} from '../utils/atomUtils/atomWithParsedMmkvStorage'
import {translationAtom} from '../utils/localization/I18nProvider'
import {showCheckUpdatedPrivacyPolicySuggestionAtom} from '../utils/preferences'
import reportError from '../utils/reportError'
import {upsertInboxOnBeAndLocallyActionAtom} from './chat/hooks/useCreateInbox'
import {importedContactsCountAtom} from './contacts/atom/contactsStore'
import {notificationsEnabledAtom} from './notifications/areNotificationsEnabledAtom'
import {sessionDataOrDummyAtom} from './session'

const PostLoginFlowCompletedScreen = Schema.Literal(
  'contactsImport',
  'notificationSetup',
  'usageInfo'
)

export type PostLoginFlowCompletedScreen =
  typeof PostLoginFlowCompletedScreen.Type

const allPostLoginFlowScreens: readonly PostLoginFlowCompletedScreen[] = [
  'contactsImport',
  'notificationSetup',
  'usageInfo',
]

export const postLoginFlowProgressStorageAtom = atomWithParsedMmkvStorage(
  'postLoginFlowProgress1',
  {completedScreens: []},
  Schema.Struct({
    completedScreens: Schema.Array(PostLoginFlowCompletedScreen),
  })
)

export const postLoginFlowCompletedScreensAtom = focusAtom(
  postLoginFlowProgressStorageAtom,
  (o) => o.prop('completedScreens')
)

export const postLoginFlowEffectiveCompletedScreensAtom = atom((get) => {
  const completedScreens = get(postLoginFlowCompletedScreensAtom)
  const importedContactsCount = get(importedContactsCountAtom)
  const notificationsEnabled = get(notificationsEnabledAtom)
  const contactImportScreens: readonly PostLoginFlowCompletedScreen[] =
    importedContactsCount > 0 ? ['contactsImport'] : []
  const notificationSetupScreens: readonly PostLoginFlowCompletedScreen[] =
    Option.isSome(notificationsEnabled) &&
    notificationsEnabled.value.notifications
      ? ['notificationSetup']
      : []

  return pipe(
    [...completedScreens, ...contactImportScreens, ...notificationSetupScreens],
    Array.dedupe
  )
})

export const postLoginFlowFinishedAtom = atom((get) => {
  const completedScreens = get(postLoginFlowEffectiveCompletedScreensAtom)

  return pipe(
    allPostLoginFlowScreens,
    Array.every((screen) => pipe(completedScreens, Array.contains(screen)))
  )
})

export const completePostLoginFlowScreenActionAtom = atom(
  null,
  (get, set, screen: PostLoginFlowCompletedScreen) => {
    const completedScreens = get(postLoginFlowCompletedScreensAtom)

    if (Array.contains(completedScreens, screen)) return

    set(postLoginFlowCompletedScreensAtom, [...completedScreens, screen])
  }
)

export const resetPostLoginFlowProgressActionAtom = atom(null, (_, set) => {
  set(postLoginFlowProgressStorageAtom, {completedScreens: []})
})

export const finishPostLoginFlowActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return pipe(
    set(upsertInboxOnBeAndLocallyActionAtom, {
      for: 'userSesssion',
      key: get(sessionDataOrDummyAtom).privateKey,
    }),
    Effect.match({
      onFailure(e) {
        reportError('error', new Error('Error creating inbox'), {e})
        showErrorAlert({
          title: t('common.errorCreatingInbox'),
          error: e,
        })
      },
      onSuccess() {
        set(showCheckUpdatedPrivacyPolicySuggestionAtom, false)
        set(postLoginFlowCompletedScreensAtom, allPostLoginFlowScreens)
      },
    })
  )
})

export function useIsPostLoginFinished(): boolean {
  return useAtomValue(postLoginFlowFinishedAtom)
}
