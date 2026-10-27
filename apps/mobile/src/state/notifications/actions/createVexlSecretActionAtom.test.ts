import {
  VexlNotificationToken,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Effect, Schema} from 'effect'
import {createStore} from 'jotai'
import {sessionNotificationTokenAtom} from '../../session'
import {vexlNotificationTokenAtom} from '../vexlNotificationTokenAtom'
import {createVexlSecretActionAtom} from './createVexlSecretActionAtom'

const newSecret = Schema.decodeSync(VexlNotificationTokenSecret)(
  'vexl_nt_secret_new'
)

jest.mock('../../../utils/atomUtils/atomWithParsedMmkvStorage', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    atomWithParsedMmkvStorage: (_key: string, initial: unknown) =>
      Object.assign(atom(initial), {flushNow: jest.fn()}),
  }
})
jest.mock('../../../api', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    apiAtom: atom({
      notification: {
        createNotificationSecret: () =>
          Effect.succeed({secret: 'vexl_nt_secret_new'}),
      },
    }),
  }
})
jest.mock('../../session', () => {
  const {atom} = jest.requireActual('jotai')
  return {sessionNotificationTokenAtom: atom('vexl_nt_old')}
})
jest.mock('../../../utils/environment', () => ({versionCode: 1}))
jest.mock('../../../utils/localization/I18nProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {translationAtom: atom({t: () => 'en'})}
})
jest.mock('./syncVexlNotificationTokensActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {syncVexlNotificationTokensActionAtom: atom(null, () => Effect.void)}
})

describe('createVexlSecretActionAtom', () => {
  it('stores the new secret and drops the session token minted from the old one', async () => {
    const store = createStore()
    expect(store.get(sessionNotificationTokenAtom)).toBe(
      Schema.decodeSync(VexlNotificationToken)('vexl_nt_old')
    )

    await Effect.runPromise(
      store.set(createVexlSecretActionAtom, {expoNotificationToken: null})
    )

    expect(store.get(vexlNotificationTokenAtom).secret).toBe(newSecret)
    expect(store.get(sessionNotificationTokenAtom)).toBeUndefined()
  })
})
