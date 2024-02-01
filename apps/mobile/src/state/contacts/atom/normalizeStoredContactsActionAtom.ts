import * as A from 'fp-ts/Array'
import {pipe} from 'fp-ts/lib/function'
import {isNone} from 'fp-ts/lib/Option'
import * as T from 'fp-ts/Task'
import {atom} from 'jotai'
import reportError from '../../../utils/reportError'
import sequenceTasksWithAnimationFrames from '../../../utils/sequenceTasksWithAnimationFrames'
import toE164PhoneNumberWithDefaultCountryCode from '../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {hasComputedValues, type StoredContact} from '../domain'
import {hashPhoneNumber} from '../utils'
import {storedContactsAtom} from './contactsStore'

function normalizeContactIfNotNormalizedYet(
  contact: StoredContact
): T.Task<StoredContact> {
  return async () => {
    if (
      hasComputedValues(contact) ||
      contact.flags.invalidNumber === 'invalid'
    ) {
      return contact
    }

    const E164PhoneNumber = toE164PhoneNumberWithDefaultCountryCode(
      contact.info.rawNumber
    )
    if (isNone(E164PhoneNumber)) {
      return {
        ...contact,
        flags: {
          ...contact.flags,
          invalidNumber: 'invalid',
        },
      }
    }

    const hash = hashPhoneNumber(E164PhoneNumber.value)
    if (hash._tag === 'Left') {
      reportError('warn', new Error('Error while hasing phone number'), {
        left: hash.left,
      })
      return contact
    }

    return {
      ...contact,
      computedValues: {
        normalizedNumber: E164PhoneNumber.value,
        hash: hash.right,
      },
      flags: {
        ...contact.flags,
        invalidNumber: 'valid',
      },
    }
  }
}

const normalizeStoredContactsActionAtom = atom(
  null,
  (
    get,
    set,
    {
      onProgress,
    }: {onProgress: (d: {total: number; percentDone: number}) => void} = {
      onProgress: () => {},
    }
  ) => {
    const storedContacts = get(storedContactsAtom)
    onProgress({total: storedContacts.length, percentDone: 0})

    return pipe(
      storedContacts,
      A.map(normalizeContactIfNotNormalizedYet),
      sequenceTasksWithAnimationFrames(100, (percentage) => {
        onProgress({total: storedContacts.length, percentDone: percentage})
      }),
      T.map((contacts) => {
        set(storedContactsAtom, [...contacts])
      })
    )
  }
)

export default normalizeStoredContactsActionAtom
