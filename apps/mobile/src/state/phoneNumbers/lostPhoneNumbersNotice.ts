import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect, Schema} from 'effect'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {globalDialogAtom} from '../../components/GlobalDialog'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {getInternationalPhoneNumber} from '../../utils/getInternationalPhoneNumber'
import {translationAtom} from '../../utils/localization/I18nProvider'

/**
 * Numbers dropped from the account because someone logged in with them on
 * another device. Persisted until the user dismisses the notice.
 */
export const lostPhoneNumbersNoticeAtom = atomWithParsedMmkvStorage(
  'lostPhoneNumbersNotice',
  {phoneNumbers: []},
  Schema.Struct({phoneNumbers: Schema.Array(E164PhoneNumber)})
)

export const addLostPhoneNumbersToNoticeActionAtom = atom(
  null,
  (_get, set, lost: readonly E164PhoneNumber[]) => {
    set(lostPhoneNumbersNoticeAtom, (prev) => ({
      phoneNumbers: Array.dedupe([...prev.phoneNumbers, ...lost]),
    }))
  }
)

export const dismissLostPhoneNumbersNoticeActionAtom = atom(
  null,
  (_get, set, dismissed: readonly E164PhoneNumber[]) => {
    set(lostPhoneNumbersNoticeAtom, (prev) => ({
      phoneNumbers: Array.difference(prev.phoneNumbers, dismissed),
    }))
  }
)

const isNoticeShownAtom = atom(false)

export const showLostPhoneNumbersNoticeIfPendingActionAtom = atom(
  null,
  (get, set): Effect.Effect<void> =>
    Effect.gen(function* (_) {
      const {phoneNumbers} = get(lostPhoneNumbersNoticeAtom)
      if (
        get(isNoticeShownAtom) ||
        !Array.isNonEmptyReadonlyArray(phoneNumbers)
      )
        return
      set(isNoticeShownAtom, true)

      const {t} = get(translationAtom)
      yield* _(
        Effect.forEach(
          phoneNumbers,
          (phoneNumber) =>
            set(globalDialogAtom, {
              title: t('loggedInOnAnotherDevice.phoneNumberRemoved.title'),
              subtitle: t('loggedInOnAnotherDevice.phoneNumberRemoved.text', {
                phoneNumber: getInternationalPhoneNumber(phoneNumber),
              }),
              positiveButtonText: t('common.gotIt'),
            }),
          {discard: true}
        )
      )
      set(dismissLostPhoneNumbersNoticeActionAtom, phoneNumbers)
    }).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          set(isNoticeShownAtom, false)
        })
      )
    )
)

/**
 * Tells the user about numbers removed from the account, also the ones lost
 * while the app was closed.
 */
export function useShowLostPhoneNumbersNotice(): void {
  const lostPhoneNumbersNotice = useAtomValue(lostPhoneNumbersNoticeAtom)
  const showNoticeIfPending = useSetAtom(
    showLostPhoneNumbersNoticeIfPendingActionAtom
  )

  useEffect(() => {
    Effect.runFork(showNoticeIfPending())
  }, [lostPhoneNumbersNotice, showNoticeIfPending])
}
