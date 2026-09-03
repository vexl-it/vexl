import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Array, Effect, Option, pipe, Record} from 'effect'
import * as Notifications from 'expo-notifications'
import * as O from 'fp-ts/Option'
import {atom, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {apiAtom} from '../api'
import {offerProgressModalActionAtoms} from '../components/UploadingOfferProgressModal/atoms'
import clearMmkvStorageAndEmptyAtoms from '../utils/clearMmkvStorageAndEmptyAtoms'
import {deleteAllFiles} from '../utils/fsDirectories'
import {translationAtom} from '../utils/localization/I18nProvider'
import {formatInteger} from '../utils/localization/formatting'
import {formattingLocaleAtom} from '../utils/localization/formattingLocaleAtom'
import notEmpty from '../utils/notEmpty'
import {clearBackgroundNotificationSocketActionAtom} from '../utils/notifications/backgroundNotificationSocket'
import {showDebugNotificationIfEnabled} from '../utils/notifications/showDebugNotificationIfEnabled'
import reportError from '../utils/reportError'
import {waitForNextAnimationFrameEffect} from '../utils/runAfterAnimationFrames'
import deleteAllInboxesActionAtom from './chat/atoms/deleteAllInboxesActionAtom'
import {selectedChatTagFiltersAtom} from './chatTags/atoms'
import {clubsToKeyHolderAtom} from './clubs/atom/clubsToKeyHolderV2Atom'
import {clubsWithMembersAtom} from './clubs/atom/clubsWithMembersAtom'
import {clearPersistentDataAboutReachAndImportedContactsActionAtom} from './connections/atom/reachNumberWithoutClubsConnectionsMmkvAtom'
import {deleteOffersActionAtom} from './marketplace/atoms/deleteOffersActionAtom'
import {myOffersAtom} from './marketplace/atoms/myOffers'
import {invalidateVexlSecretActionAtom} from './notifications/actions/invalidateVexlSecretActionAtom'
import {sessionAtom} from './session'

async function failSilently<T>(promise: Promise<T>): Promise<
  | {success: true; result: T}
  | {
      success: false
      error: unknown
    }
> {
  return await promise
    .then((result) => ({success: true as const, result}))
    .catch((e) => {
      return {success: false as const, error: e as unknown}
    })
}

export const logoutActionAtom = atom(null, async (get, set) => {
  const {t} = get(translationAtom)
  const formattingLocale = get(formattingLocaleAtom)

  const showDeleteAccountProgressFrame = ({
    percentage,
    stepLabel,
  }: {
    percentage: number
    stepLabel: string
  }): void => {
    set(offerProgressModalActionAtoms.show, {
      title: t('account.deleteAccountProgress.title'),
      belowProgressLeft: stepLabel,
      belowProgressRight: t('progressBar.percentDone', {
        percentDone: formatInteger(percentage, formattingLocale),
      }),
      bottomText: t('contacts.importProgress.bottomTextCanTakeAWhile'),
      indicateProgress: {type: 'progress', percentage},
    })
  }

  void showDebugNotificationIfEnabled({
    title: 'Logging out',
    subtitle: 'logoutAtom',
    body: 'logging out from logout atom',
  })

  set(selectedChatTagFiltersAtom, new Set())

  // Clear connections reach and imported contacts count from persistent storage
  set(clearPersistentDataAboutReachAndImportedContactsActionAtom)

  try {
    // The account-deletion confirmation dialog resolves while its native
    // modal is still unmounting; iOS silently drops a modal presented in
    // that window, so give React two frames to finish the teardown first.
    await Effect.runPromise(
      waitForNextAnimationFrameEffect().pipe(
        Effect.andThen(waitForNextAnimationFrameEffect())
      )
    )

    showDeleteAccountProgressFrame({
      percentage: 0,
      stepLabel: t('account.deleteAccountProgress.deletingOffers'),
    })

    // Background notification socket first: stop the service and wipe its
    // native credentials before user data is destroyed, so no notification
    // can arrive mid-logout and no native state survives an interrupted one.
    await failSilently(set(clearBackgroundNotificationSocketActionAtom))

    // offer service
    await failSilently(
      Effect.runPromise(
        set(deleteOffersActionAtom, {
          adminIds: get(myOffersAtom)
            .map((offer) => offer.ownershipInfo?.adminId)
            .filter(notEmpty),
        })
      )
    )

    showDeleteAccountProgressFrame({
      percentage: 10,
      stepLabel: t('account.deleteAccountProgress.leavingClubs'),
    })

    await failSilently(
      pipe(
        get(clubsWithMembersAtom),
        Array.filterMap((club) =>
          Record.get(get(clubsToKeyHolderAtom), club.club.uuid).pipe(
            Option.map((clubKeys) =>
              get(apiAtom)
                .contact.leaveClub({
                  clubUuid: club.club.uuid,
                  keyPair: clubKeys.oldKeyPair,
                  keyPairV2: clubKeys.keyPair,
                })
                .pipe(Effect.ignore)
            )
          )
        ),
        Effect.all,
        Effect.runPromise
      )
    )

    showDeleteAccountProgressFrame({
      percentage: 20,
      stepLabel: t('account.deleteAccountProgress.closingChats'),
    })

    // chat service
    const chatSpan = {start: 20, end: 75}
    await failSilently(
      set(deleteAllInboxesActionAtom, {
        onProgress: ({step, stepCompleted, stepTotal, completed, total}) => {
          if (total === 0) return

          showDeleteAccountProgressFrame({
            percentage: Math.round(
              chatSpan.start +
                (completed / total) * (chatSpan.end - chatSpan.start)
            ),
            stepLabel: t(
              step === 'closingChats'
                ? 'account.deleteAccountProgress.closingChatsProgress'
                : 'account.deleteAccountProgress.deletingOffersProgress',
              {
                current: formatInteger(stepCompleted, formattingLocale),
                total: formatInteger(stepTotal, formattingLocale),
              }
            ),
          })
        },
      })()
    )

    showDeleteAccountProgressFrame({
      percentage: 75,
      stepLabel: t('account.deleteAccountProgress.deletingAccountData'),
    })

    // contact service
    await failSilently(effectToTaskEither(get(apiAtom).contact.deleteUser())())

    // User service
    await failSilently(effectToTaskEither(get(apiAtom).user.deleteUser())())

    // Notification badge
    await failSilently(Notifications.setBadgeCountAsync(0))

    // Invalidate vexl notification secret on server (before clearing local storage)
    await failSilently(Effect.runPromise(set(invalidateVexlSecretActionAtom)))

    showDeleteAccountProgressFrame({
      percentage: 90,
      stepLabel: t('account.deleteAccountProgress.clearingLocalData'),
    })

    // session
    set(sessionAtom, O.none)

    // Local storage
    await clearMmkvStorageAndEmptyAtoms()

    // files
    await failSilently(deleteAllFiles())

    // firebase token
    await failSilently(Notifications.unregisterForNotificationsAsync())

    await Effect.runPromise(
      set(offerProgressModalActionAtoms.hideDeffered, {
        data: {
          title: t('account.deleteAccountProgress.titleDone'),
          bottomText: t('account.deleteAccountProgress.bottomTextDone'),
          indicateProgress: {type: 'progress', percentage: 100},
        },
        delayMs: 1500,
      })
    )
  } catch (e) {
    reportError('error', new Error('Critical error while logging out'), {e})

    try {
      set(sessionAtom, O.none)
      await clearMmkvStorageAndEmptyAtoms()
      await failSilently(Notifications.unregisterForNotificationsAsync())
      await failSilently(set(clearBackgroundNotificationSocketActionAtom))
    } finally {
      set(offerProgressModalActionAtoms.hide)
    }
  }
})

export function useLogout(): () => Promise<void> {
  const logout = useSetAtom(logoutActionAtom)

  return useCallback(async () => {
    await logout()
  }, [logout])
}
