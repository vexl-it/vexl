import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Either, pipe, Record} from 'effect'
import {atom} from 'jotai'
import {needsFullContactsReplaceAfterContactEditAtom} from '../contacts/atom/contactsStore'
import {offersStateAtom} from '../marketplace/atoms/offersState'
import {mergeIncomingOffersToState} from '../marketplace/atoms/refreshOffersActionAtom/utils/mergeIncomingOffersToState'
import {mergeIncomingNotesToState} from '../notes/atoms/mergeIncomingNotesToState'
import {notesStateAtom} from '../notes/atoms/notesState'
import {sessionDataOrDummyAtom} from '../session'
import {
  type CannotRemoveMainPhoneNumberError,
  identityKeyOfPhoneNumber,
  type PhoneNumberNotInAccountError,
  phoneNumbersOfSession,
  removePhoneNumbersFromSession,
} from '../session/sessionPhoneNumbers'

/**
 * Offers and notes that came only to the forgotten identities disappear, the
 * others lose what those identities knew about their authors.
 */
const forgetIdentitiesInOffersAndNotesActionAtom = atom(
  null,
  (
    _get,
    set,
    {
      identities,
      mainIdentity,
    }: {
      identities: readonly PublicKeyPemBase64[]
      mainIdentity: PublicKeyPemBase64
    }
  ) => {
    set(offersStateAtom, (old) => ({
      ...old,
      extraIdentitiesContactOffersNextPageParam: Record.filter(
        old.extraIdentitiesContactOffersNextPageParam ?? {},
        (_, identity) => !Array.contains(identities, identity)
      ),
      offers: mergeIncomingOffersToState({
        incomingOffers: [],
        storedOffers: old.offers,
        removedOffersIds: {
          clubs: [],
          contacts: Array.map(identities, (identity) => ({
            identity,
            removedIds: Array.map(old.offers, (one) => one.offerInfo.offerId),
          })),
        },
        mainIdentity,
      }),
    }))
    set(notesStateAtom, (old) => ({
      ...old,
      extraIdentitiesNotesNextPageParam: Record.filter(
        old.extraIdentitiesNotesNextPageParam ?? {},
        (_, identity) => !Array.contains(identities, identity)
      ),
      notes: mergeIncomingNotesToState({
        incomingNotes: [],
        storedNotes: old.notes,
        removedNoteIds: Array.map(identities, (identity) => ({
          identity,
          removedIds: Array.map(old.notes, (one) => one.noteInfo.noteId),
        })),
        mainIdentity,
      }),
    }))
  }
)

export const dropPhoneNumbersFromSessionActionAtom = atom(
  null,
  (
    get,
    set,
    phoneNumbers: readonly E164PhoneNumber[]
  ): Either.Either<
    void,
    PhoneNumberNotInAccountError | CannotRemoveMainPhoneNumberError
  > => {
    const session = get(sessionDataOrDummyAtom)
    return Either.map(
      removePhoneNumbersFromSession(session, phoneNumbers),
      (updatedSession) => {
        set(sessionDataOrDummyAtom, updatedSession)
        // Imports skip own numbers. A dropped number may be an ordinary contact
        // now, so the next import sends the full list again.
        set(needsFullContactsReplaceAfterContactEditAtom, true)
        set(forgetIdentitiesInOffersAndNotesActionAtom, {
          identities: pipe(
            phoneNumbersOfSession(session),
            Array.filter((one) =>
              Array.contains(phoneNumbers, one.phoneNumber)
            ),
            Array.map(identityKeyOfPhoneNumber)
          ),
          mainIdentity: identityKeyOfPhoneNumber(session),
        })
      }
    )
  }
)
