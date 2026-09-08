import {fromImageUri} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {Effect, Option} from 'effect'
import {atom} from 'jotai'
import {addContactWithUiFeedbackActionAtom} from '../../state/contacts/atom/addContactWithUiFeedbackAtom'
import {type ImportContactFromLinkPayload} from '../../state/contacts/domain'
import {hashContactE} from '../../state/contacts/utils'

export const handleImportContactFromDeepLinkActionAtom = atom(
  null,
  (get, set, contactData: ImportContactFromLinkPayload) =>
    Effect.gen(function* (_) {
      const numberHash = yield* _(hashContactE(contactData.numberToDisplay))

      yield* _(
        set(addContactWithUiFeedbackActionAtom, {
          avatar: contactData.imageUri
            ? fromImageUri(contactData.imageUri)
            : undefined,
          info: {
            kind: 'phone',
            name: contactData.name,
            label: Option.some(contactData.label),
            rawValue: contactData.numberToDisplay,
            nonUniqueContactId: Option.none(),
          },
          computedValues: {
            normalizedValue: contactData.numberToDisplay,
            hash: numberHash,
          },
        })
      )
    })
)
