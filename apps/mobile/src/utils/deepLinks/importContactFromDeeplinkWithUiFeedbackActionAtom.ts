import {Effect, Option} from 'effect'
import {atom} from 'jotai'
import {addContactWithUiFeedbackActionAtom} from '../../state/contacts/atom/addContactWithUiFeedbackAtom'
import {type ImportContactFromLinkPayload} from '../../state/contacts/domain'
import {hashPhoneNumberE} from '../../state/contacts/utils'

export const handleImportContactFromDeepLinkActionAtom = atom(
  null,
  (get, set, contactData: ImportContactFromLinkPayload) =>
    Effect.gen(function* (_) {
      const numberHash = yield* _(hashPhoneNumberE(contactData.numberToDisplay))

      yield* _(
        set(addContactWithUiFeedbackActionAtom, {
          info: {
            name: contactData.name,
            label: Option.some(contactData.label),
            numberToDisplay: contactData.numberToDisplay,
            rawNumber: contactData.numberToDisplay,
            nonUniqueContactId: Option.none(),
          },
          computedValues: {
            normalizedNumber: contactData.numberToDisplay,
            hash: numberHash,
          },
        })
      )
    })
)
