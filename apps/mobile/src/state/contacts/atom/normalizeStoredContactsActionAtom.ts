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

function needsNormalization(contact: StoredContact): boolean {
  return (
    Option.isNone(contact.computedValues) &&
    contact.flags.invalidNumber !== 'invalid'
  )
}

export interface NormalizationProgress {
  readonly total: number
  readonly percentDone: number
}

export type NormalizationProgressListener = (
  progress: NormalizationProgress
) => void

const normalizeStoredContactsActionAtom = atom(
  null,
  (
    get,
    set,
    {onProgress}: {onProgress: NormalizationProgressListener} = {
      onProgress: () => {},
    }
  ): Effect.Effect<void> =>
    Effect.gen(function* (_) {
      const measure = startMeasure('Normalizing contacts')
      const [toNormalize, alreadyNormalized] = pipe(
        get(storedContactsAtom),
        Array.partition((contact) => !needsNormalization(contact))
      )

      if (Array.isEmptyArray(toNormalize)) return

      onProgress({total: toNormalize.length, percentDone: 0})

      const normalizedContacts = yield* _(
        pipe(
          toNormalize,
          Array.map(flow(normalizeContact, effectToTask)),
          sequenceTasksWithAnimationFrames(50, (percentage) => {
            onProgress({
              total: toNormalize.length,
              percentDone: percentage,
            })
          }),
          taskToEffect
        )
      )

      onProgress({total: toNormalize.length, percentDone: 1})
      set(storedContactsAtom, [...alreadyNormalized, ...normalizedContacts])
      measure()
    })
)

export default normalizeStoredContactsActionAtom
