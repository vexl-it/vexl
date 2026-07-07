import {
  effectToTask,
  taskToEffect,
} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Array, Effect, flow, Option, pipe} from 'effect'
import {atom} from 'jotai'
import reportError from '../../../utils/reportError'
import {startMeasure} from '../../../utils/reportTime'
import sequenceTasksWithAnimationFrames from '../../../utils/sequenceTasksWithAnimationFrames'
import toE164PhoneNumberWithDefaultCountryCode from '../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import {type ContactComputedValues, type StoredContact} from '../domain'
import {hashPhoneNumber} from '../utils'
import {storedContactsAtom} from './contactsStore'

function markContactInvalid(contact: StoredContact): StoredContact {
  return {
    ...contact,
    flags: {
      ...contact.flags,
      invalidNumber: 'invalid',
    },
  }
}

function markContactValid(
  contact: StoredContact,
  computedValues: ContactComputedValues
): StoredContact {
  return {
    ...contact,
    computedValues: Option.some(computedValues),
    flags: {
      ...contact.flags,
      invalidNumber: 'valid',
    },
  }
}

function normalizeContact(
  contact: StoredContact
): Effect.Effect<StoredContact> {
  return Effect.sync(() => {
    const E164PhoneNumber = toE164PhoneNumberWithDefaultCountryCode(
      contact.info.rawNumber
    )
    if (Option.isNone(E164PhoneNumber)) {
      return markContactInvalid(contact)
    }

    const hash = hashPhoneNumber(E164PhoneNumber.value)
    if (hash._tag === 'Left') {
      reportError('warn', new Error('Error while hashing phone number'), {
        left: hash.left,
      })
      return contact
    }

    return markContactValid(contact, {
      normalizedNumber: E164PhoneNumber.value,
      hash: hash.right,
    })
  }).pipe(
    Effect.catchAllDefect(() => {
      reportError('warn', new Error('Error while normalizing contact'))
      return Effect.succeed(markContactInvalid(contact))
    })
  )
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
    const measure = startMeasure('Normalizing contacts')
    const storedContacts = get(storedContactsAtom)

    const [toNormalize, normalized] = pipe(
      storedContacts,
      Array.partition(
        (c) =>
          Option.isSome(c.computedValues) || c.flags.invalidNumber === 'invalid'
      )
    )

    if (Array.isEmptyArray(toNormalize)) return Effect.void

    onProgress({total: storedContacts.length, percentDone: 0})

    return pipe(
      toNormalize,
      Array.map(flow(normalizeContact, effectToTask)),
      sequenceTasksWithAnimationFrames(100, (percentage) => {
        onProgress({total: storedContacts.length, percentDone: percentage})
      }),
      taskToEffect,
      Effect.map((contacts) => {
        onProgress({total: storedContacts.length, percentDone: 1})

        set(storedContactsAtom, [...normalized, ...contacts])
        measure()
      })
    )
  }
)

export default normalizeStoredContactsActionAtom
