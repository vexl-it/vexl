import {Effect} from 'effect/index'
import {atom} from 'jotai'
import {askAreYouSureActionAtom} from '../../../components/AreYouSureDialog'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {submitContactsActionAtom} from '../../contacts/atom/submitContactsActionAtom'
import {fistAndSecondLevelConnectionsReachAtom} from './connectionStateAtom'
import {persistentDataAboutReachAndImportedContactsAtom} from './reachNumberWithoutClubsConnectionsMmkvAtom'

const THRESHOLD_REACH_NUMBER = 30

/**
 * This atom should check if user needs to be prompted to import contacts and re-encrypt offers
 * There were scenarios when user had 0 connections after update even though they imported contacts and had reach over threshold
 * This atom does not take clubs connections into consideration
 */
export const checkUserNeedsToImportContactsAndReencryptOffersActionAtom = atom(
  null,
  (get, set) => {
    const {t} = get(translationAtom)
    const firstAndSecondLevelConnectionsReach = get(
      fistAndSecondLevelConnectionsReachAtom
    )
    const persistentDataAboutReachAndImportedContacts = get(
      persistentDataAboutReachAndImportedContactsAtom
    )

    if (
      firstAndSecondLevelConnectionsReach === 0 &&
      persistentDataAboutReachAndImportedContacts.reach >
        THRESHOLD_REACH_NUMBER &&
      persistentDataAboutReachAndImportedContacts.numberOfImportedContacts > 0
    ) {
      return Effect.gen(function* (_) {
        yield* _(
          set(askAreYouSureActionAtom, {
            steps: [
              {
                type: 'StepWithText',
                title: t('unexpectedReachDrop.title'),
                description: t('unexpectedReachDrop.description'),
                positiveButtonText: t('unexpectedReachDrop.actionTitle'),
              },
            ],
            variant: 'danger',
          })
        ).pipe(Effect.catchAll(Effect.succeed))

        yield* _(
          set(submitContactsActionAtom, {
            normalizeAndImportAll: true,
            showOfferReencryptionDialog: true,
          })
        )
      })
    }

    return Effect.void
  }
)
