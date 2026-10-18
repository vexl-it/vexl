import {Effect, Either, Schema} from 'effect'
import {atom} from 'jotai'
import {globalDialogAtom} from '../components/GlobalDialog'
import {translationAtom} from '../utils/localization/I18nProvider'
import {storage} from '../utils/mmkv/effectMmkv'
import {waitForNextAnimationFrameEffect} from '../utils/runAfterAnimationFrames'

// Persisted, so the notice survives an app restart right after the wipe
const ACCOUNT_MOVED_NOTICE_KEY = 'accountMovedToAnotherDeviceNotice'
const AccountMovedNoticePending = Schema.Literal(true)

export function markAccountMovedNoticePending(): void {
  storage.saveVerified(
    ACCOUNT_MOVED_NOTICE_KEY,
    AccountMovedNoticePending
  )(true)
}

function isAccountMovedNoticePending(): boolean {
  return Either.isRight(
    storage.getVerified(ACCOUNT_MOVED_NOTICE_KEY, AccountMovedNoticePending)
  )
}

const isNoticeShownAtom = atom(false)

/**
 * iOS drops a modal presented while the logged-in screens are still being
 * torn down, so wait for the logged-out UI to settle first. Call it whenever
 * the logged-out UI becomes active.
 */
export const showAccountMovedNoticeIfPendingActionAtom = atom(
  null,
  (get, set): Effect.Effect<void> =>
    Effect.gen(function* (_) {
      if (get(isNoticeShownAtom) || !isAccountMovedNoticePending()) return
      set(isNoticeShownAtom, true)

      yield* _(waitForNextAnimationFrameEffect())
      yield* _(waitForNextAnimationFrameEffect())

      const {t} = get(translationAtom)
      yield* _(
        set(globalDialogAtom, {
          title: t('loggedInOnAnotherDevice.title'),
          subtitle: t('loggedInOnAnotherDevice.text'),
          positiveButtonText: t('common.gotIt'),
        })
      )
      storage._storage.remove(ACCOUNT_MOVED_NOTICE_KEY)
    }).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          set(isNoticeShownAtom, false)
        })
      )
    )
)
