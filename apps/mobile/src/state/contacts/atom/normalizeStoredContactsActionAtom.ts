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
      const toNormalize = pipe(
        get(storedContactsAtom),
        Array.filter(needsNormalization)
      )

      if (!Array.isNonEmptyArray(toNormalize)) return

      const measure = startMeasure('Normalizing contacts')

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

      // Normalizing spans many animation frames, so the store can be written
      // to while we work (vcard import, manually added contact, and the MMKV
      // atom re-decoding the persisted blob on a change notification, which
      // rebuilds every object). Merge into the current value instead of
      // overwriting it with our stale snapshot, and key the merge by
      // rawNumber rather than object identity - the normalization outcome is
      // derived purely from rawNumber, so it stays valid even for an object
      // that was replaced meanwhile, while concurrent info/flag changes are
      // preserved. Contacts that need no normalization keep their object
      // identity for the identity caches downstream.
      const normalizedByRawNumber = new Map(
        pipe(
          Array.zip(toNormalize, normalizedContacts),
          Array.map(
            ([original, normalized]) =>
              [original.info.rawNumber, normalized] as const
          )
        )
      )
      set(storedContactsAtom, (prev) =>
        Array.map(prev, (contact) => {
          if (!needsNormalization(contact)) return contact

          const normalized = normalizedByRawNumber.get(contact.info.rawNumber)
          if (normalized === undefined) return contact

          return {
            ...contact,
            computedValues: normalized.computedValues,
            flags: {
              ...contact.flags,
              invalidNumber: normalized.flags.invalidNumber,
            },
          }
        })
      )
      measure()
    })
)

export default normalizeStoredContactsActionAtom
