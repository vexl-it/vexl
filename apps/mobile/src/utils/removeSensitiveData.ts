import {captureException} from '@sentry/react-native'
import {getDefaultStore} from 'jotai'
import {sensitiveValuesOfSession} from '../brands/Session.brand'
import {sessionDataOrDummyAtom} from '../state/session'
import {
  makeErrorJsonWithRemovedSensitiveData,
  makeErrorWithRemovedSensitiveData,
} from './errorSanitization'
import {replaceAll} from './replaceAll'

export default function removeSensitiveData(string: string): string {
  return replaceAll(
    string,
    sensitiveValuesOfSession(getDefaultStore().get(sessionDataOrDummyAtom)),
    '[[stripped]]'
  )
}

export function toJsonWithRemovedSensitiveData(object: any): string {
  try {
    const jsonString = JSON.stringify(object)
    return removeSensitiveData(jsonString)
  } catch (e) {
    captureException(
      new Error('Error stringify-ing object for sentry', {cause: e}),
      {level: 'warning'}
    )
    return '[[Error stringify-ing object]]'
  }
}

export const toErrorWithRemovedSensitiveData =
  makeErrorWithRemovedSensitiveData(removeSensitiveData)

export const toErrorJsonWithRemovedSensitiveData =
  makeErrorJsonWithRemovedSensitiveData(toJsonWithRemovedSensitiveData)

export function toExtraWithRemovedSensitiveData(
  extra: Record<string, unknown>
): Record<string, string> {
  return Object.entries(extra).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [key]:
        value instanceof Error
          ? toErrorJsonWithRemovedSensitiveData(value)
          : toJsonWithRemovedSensitiveData(value),
    }
  }, {})
}
