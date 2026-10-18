import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Effect, Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import {fetchMessagesForNotifiedInboxActionAtom} from './fetchMessagesForNotifiedInboxActionAtom'

const mockKnownKey = generatePrivateKey()
const mockFetchInbox = jest.fn()
const mockFetchAll = jest.fn()
jest.mock('../../notifications/fcmCypherToKeyHolderAtom', () => ({
  getKeyHolderForNotificationTokenOrCypherActionAtom: jest
    .requireActual('jotai')
    .atom(null, (_: unknown, __: unknown, token: string) =>
      token === 'vexl_nt_known' ? mockKnownKey : undefined
    ),
}))
jest.mock('./fetchNewMessagesActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    __esModule: true,
    default: atom(null, () => Effect.sync(mockFetchAll)),
    fetchAndStoreMessagesForInboxHandleNotificationsActionAtom: atom(
      null,
      (_: unknown, __: unknown, args: unknown) =>
        Effect.sync(() => mockFetchInbox(args))
    ),
  }
})

const store = getDefaultStore()
const token = Schema.decodeSync(VexlNotificationToken)

describe('fetchMessagesForNotifiedInboxActionAtom', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches the inbox the token belongs to', async () => {
    await Effect.runPromise(
      store.set(fetchMessagesForNotifiedInboxActionAtom, token('vexl_nt_known'))
    )

    expect(mockFetchInbox).toHaveBeenCalledWith({
      key: mockKnownKey.publicKeyPemBase64,
    })
    expect(mockFetchAll).not.toHaveBeenCalled()
  })

  it('fetches all inboxes for a token minted after the backup was exported', async () => {
    await Effect.runPromise(
      store.set(
        fetchMessagesForNotifiedInboxActionAtom,
        token('vexl_nt_unknown')
      )
    )

    expect(mockFetchAll).toHaveBeenCalledTimes(1)
    expect(mockFetchInbox).not.toHaveBeenCalled()
  })
})
