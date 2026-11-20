import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Effect, Option, Schema} from 'effect'
import {
  hashForClient,
  serverHashPhoneNumber,
} from '../../utils/serverHashContact'
import {type DummyUser} from '../routes/contacts/utils'
import {type MockedContexts} from './runPromiseInMockedEnvironment'

// Another phone number of the same account: same keys, own hash, no token.
export const generateAnotherNumber = (
  account: DummyUser,
  numberRaw: string
): Effect.Effect<DummyUser, unknown, MockedContexts> =>
  Effect.gen(function* (_) {
    const phoneNumber = Schema.decodeSync(E164PhoneNumber)(numberRaw)
    const hashedNumber = yield* _(hashPhoneNumber(phoneNumber))
    const serverHashedNumber = yield* _(serverHashPhoneNumber(hashedNumber))
    return {
      ...account,
      phoneNumber,
      hashedNumber,
      authHeaders: yield* _(
        createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: account.keys.publicKeyPemBase64,
        })
      ),
      vexlNotificationToken: Option.none(),
      serverHashedNumber,
      serverHashedNumberForClient: yield* _(hashForClient(serverHashedNumber)),
    }
  })
