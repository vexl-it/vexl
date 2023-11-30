import {getDefaultStore} from 'jotai'
import {sessionDataOrDummyAtom} from '../state/session'
import {replaceAll} from './replaceAll'
import crashlytics from '@react-native-firebase/crashlytics'

export default function removeSensitiveData(string: string): string {
  const session = getDefaultStore().get(sessionDataOrDummyAtom)
  const toReplace = [
    session.sessionCredentials.signature,
    session.sessionCredentials.hash,
    session.sessionCredentials.publicKey,
    session.phoneNumber,
    session.privateKey.privateKeyPemBase64,
  ]

  if (session.realUserData?.userName)
    toReplace.push(session.realUserData.userName)

  return replaceAll(string, toReplace, '[[stripped]]')
}

export function toJsonWithRemovedSensitiveData(object: any): string {
  try {
    const jsonString = JSON.stringify(object)
    return removeSensitiveData(jsonString)
  } catch (e) {
    crashlytics().recordError(
      new Error('Error stringify-ing object for crashlytics', {cause: e})
    )
    return '[[Error stringify-ing object]]'
  }
}
