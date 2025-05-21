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
import {type StoredContact} from '../domain'
import {hashPhoneNumber} from '../utils'
import {storedContactsAtom} from './contactsStore'

function normalizeContact(
  contact: StoredContact
): Effect.Effect<StoredContact> {
  const E164PhoneNumber = toE164PhoneNumberWithDefaultCountryCode(
    contact.info.rawNumber
  )
  if (Option.isNone(E164PhoneNumber)) {
    return Effect.succeed({
      ...contact,
      flags: {
        ...contact.flags,
        invalidNumber: 'invalid',
      },
    })
  }

  const hash = hashPhoneNumber(E164PhoneNumber.value)
  if (hash._tag === 'Left') {
    reportError('warn', new Error('Error while hashing phone number'), {
      left: hash.left,
    })
    return Effect.succeed(contact)
  }

  return Effect.succeed({
    ...contact,
    computedValues: Option.some({
      normalizedNumber: E164PhoneNumber.value,
      hash: hash.right,
    }),
    flags: {
      ...contact.flags,
      invalidNumber: 'valid',
    },
  })
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

    onProgress({total: storedContacts.length, percentDone: 0})

    const {normalized, toNormalize} = storedContacts.reduce(
      (acc, c) => {
        if (Option.isSome(c.computedValues)) {
          return {...acc, normalized: [...acc.normalized, c]}
        } else {
          return {...acc, toNormalize: [...acc.toNormalize, c]}
        }
      },
      {normalized: [] as StoredContact[], toNormalize: [] as StoredContact[]}
    )

    return pipe(
      toNormalize,
      Array.filter((c) => Option.isNone(c.computedValues)),
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
