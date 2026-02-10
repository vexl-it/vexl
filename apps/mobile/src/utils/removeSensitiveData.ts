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

export function toExtraWithRemovedSensitiveData(
  extra: Record<string, unknown>
): Record<string, string> {
  return Object.entries(extra).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [key]:
        // Keep errors to get stacktrace
        value instanceof Error ? value : toJsonWithRemovedSensitiveData(value),
    }
  }, {})
}
