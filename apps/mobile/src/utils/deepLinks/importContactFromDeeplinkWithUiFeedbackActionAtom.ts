import {Effect} from 'effect'
import {atom} from 'jotai'
import {addContactWithUiFeedbackAtom} from '../../state/contacts/atom/addContactWithUiFeedbackAtom'
import {type ImportContactFromLinkPayload} from '../../state/contacts/domain'
import {hashPhoneNumberE} from '../../state/contacts/utils'

export const handleImportContactFromDeepLinkActionAtom = atom(
  null,
  (get, set, contactData: ImportContactFromLinkPayload) => {
    return Effect.gen(function* (_) {
      const numberHash = yield* _(hashPhoneNumberE(contactData.numberToDisplay))

      yield* _(
        Effect.promise(async () => {
          await set(addContactWithUiFeedbackAtom, {
            info: {
              name: contactData.name,
              label: contactData.label,
              numberToDisplay: contactData.numberToDisplay,
              rawNumber: contactData.numberToDisplay,
            },
            computedValues: {
              normalizedNumber: contactData.numberToDisplay,
              hash: numberHash,
            },
          })
        })
      )
    })
  }
)
