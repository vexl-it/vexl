import {captureException} from '@sentry/react-native'
import {getDefaultStore} from 'jotai'
import {sessionDataOrDummyAtom} from '../state/session'
import {replaceAll} from './replaceAll'

export default function removeSensitiveData(string: string): string {
  const session = getDefaultStore().get(sessionDataOrDummyAtom)
  const toReplace: string[] = [
    session.sessionCredentials.signature,
    session.sessionCredentials.hash,
    session.sessionCredentials.publicKey,
    session.phoneNumber,
    session.privateKey.privateKeyPemBase64,
    session.keyPairV2.privateKey,
  ].filter((one) => Boolean(one.trim()))

  const userName = session.realUserData?.userName

  if (userName) toReplace.push(userName)

  return replaceAll(string, toReplace, '[[stripped]]')
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

const errorToPlainObject = (
  error: Error,
  depth: number = 0
): Record<string, unknown> => {
  if (depth > 4) return {message: '[[truncated]]'}

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause:
      error.cause instanceof Error
        ? errorToPlainObject(error.cause, depth + 1)
        : error.cause,
  }
}

export function toErrorWithRemovedSensitiveData(error: Error): Error {
  const strippedError = new Error(removeSensitiveData(error.message))
  strippedError.name = error.name
  if (error.stack) strippedError.stack = removeSensitiveData(error.stack)
  return strippedError
}

export function toErrorJsonWithRemovedSensitiveData(error: Error): string {
  return toJsonWithRemovedSensitiveData(errorToPlainObject(error))
}

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
