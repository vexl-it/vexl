import {type ImportContactsRequest} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Effect} from 'effect'
import {atom} from 'jotai'
import {contactApisAtom} from '../../../api/contactApiForSession'
import {sessionDataOrDummyAtom} from '../../session'
import {withoutOwnPhoneNumbers} from './contactImportUtils'
import {needsFullContactsReplaceAfterContactEditAtom} from './contactsStore'

/**
 * Imports the same contacts under every phone number of the account. When the
 * import fails for any number, the next import replaces the full list under
 * all of them, so numbers that missed this one catch up.
 */
export const importContactsForAllPhoneNumbersActionAtom = atom(
  null,
  (get, set, request: ImportContactsRequest) => {
    const contactApis = get(contactApisAtom)
    const requestWithoutOwnNumbers = {
      ...request,
      contacts: withoutOwnPhoneNumbers(
        request.contacts,
        get(sessionDataOrDummyAtom)
      ),
    }

    // Sequential so each number's import sees the contacts the previous one
    // committed, and contact-service does not push about them twice
    return Effect.forEach(contactApis, (contactApi) =>
      contactApi.importContacts(requestWithoutOwnNumbers)
    ).pipe(
      // The response does not depend on the number it was imported under
      Effect.map(Array.headNonEmpty),
      Effect.tapError(() =>
        Effect.sync(() => {
          if (contactApis.length > 1)
            set(needsFullContactsReplaceAfterContactEditAtom, true)
        })
      )
    )
  }
)
