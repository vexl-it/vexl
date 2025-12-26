import {
  generatePrivateKey,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {Array, Effect, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

import {SqlClient} from '@effect/sql'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {
  EcdsaSignature,
  hmacSignE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {UnableToVerifySignatureError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {cryptoConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {
  generateUserAuthData,
  hashPhoneNumber,
} from '@vexl-next/server-utils/src/generateUserAuthData'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {
  serverHashPhoneNumber,
  type ServerHashedNumber,
} from '../../../utils/serverHashContact'
import {makeTestCommonAndSecurityHeaders} from '../contacts/utils'

const keys = generatePrivateKey()
const phoneNumber = Schema.decodeSync(E164PhoneNumber)('+420733333333')

let oldHash: HashedPhoneNumber
let oldServerHash: ServerHashedNumber
let newHash: HashedPhoneNumber
let newServerHash: ServerHashedNumber
let authHeadersOld: {
  'public-key': PublicKeyPemBase64
  signature: EcdsaSignature
  hash: HashedPhoneNumber
}
let authHeadersNew: {
  'public-key': PublicKeyPemBase64
  signature: EcdsaSignature
  hash: HashedPhoneNumber
}

let hashesToImport: readonly HashedPhoneNumber[]

const queryContactsOldHash = SqlClient.SqlClient.pipe(
  Effect.flatMap(
    (sql) => sql`
      SELECT
        *
      FROM
        user_contact
      WHERE
        hash_from = ${oldServerHash}
    `
  )
)

const queryContactsNewHash = SqlClient.SqlClient.pipe(
  Effect.flatMap(
    (sql) => sql`
      SELECT
        *
      FROM
        user_contact
      WHERE
        hash_from = ${newServerHash}
    `
  )
)

const queryOldUser = SqlClient.SqlClient.pipe(
  Effect.flatMap(
    (sql) => sql`
      SELECT
        *
      FROM
        users
      WHERE
        hash = ${oldServerHash}
    `
  )
)

const queryNewUser = SqlClient.SqlClient.pipe(
  Effect.flatMap(
    (sql) => sql`
      SELECT
        *
      FROM
        users
      WHERE
        hash = ${newServerHash}
    `
  )
)

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const app = yield* _(NodeTestingApp)

      if (authHeadersNew) {
        yield* _(setAuthHeaders(authHeadersNew))
        yield* _(
          app.User.deleteUser({
            headers: makeTestCommonAndSecurityHeaders(authHeadersNew),
          })
        )
      }
      if (authHeadersOld) {
        yield* _(setAuthHeaders(authHeadersOld))
        yield* _(
          app.User.deleteUser({
            headers: makeTestCommonAndSecurityHeaders(authHeadersOld),
          })
        )
      }

      oldHash = yield* _(
        hmacSignE('vexlOldHmacKeyWhatever')(phoneNumber),
        Effect.flatMap(Schema.decode(HashedPhoneNumber))
      )

      oldServerHash = yield* _(serverHashPhoneNumber(oldHash))

      newHash = yield* _(
        cryptoConfig.hmacKey,
        Effect.flatMap((hash) => hmacSignE(hash)(phoneNumber)),
        Effect.flatMap(Schema.decode(HashedPhoneNumber))
      )

      newServerHash = yield* _(serverHashPhoneNumber(newHash))

      authHeadersOld = {
        'public-key': keys.publicKeyPemBase64,
        ...(yield* _(
          generateUserAuthData({
            phoneNumberHashed: oldHash,
            publicKey: keys.publicKeyPemBase64,
          })
        )),
      }

      authHeadersNew = {
        'public-key': keys.publicKeyPemBase64,
        ...(yield* _(
          generateUserAuthData({
            phoneNumberHashed: newHash,
            publicKey: keys.publicKeyPemBase64,
          })
        )),
      }

      yield* _(setAuthHeaders(authHeadersOld))

      const commonAndSecurityHeadersOld =
        makeTestCommonAndSecurityHeaders(authHeadersOld)

      yield* _(
        app.User.createUser({
          payload: {
            firebaseToken: null,
            expoToken: Schema.decodeSync(ExpoNotificationToken)('someToken'),
          },
          headers: commonAndSecurityHeadersOld,
        })
      )

      yield* _(setAuthHeaders(authHeadersNew))

      const commonAndSecurityHeadersNew =
        makeTestCommonAndSecurityHeaders(authHeadersNew)

      yield* _(
        app.User.createUser({
          payload: {
            firebaseToken: null,
            expoToken: Schema.decodeSync(ExpoNotificationToken)('someToken'),
          },
          headers: commonAndSecurityHeadersNew,
        })
      )

      hashesToImport = yield* _(
        [
          '+420777777777',
          '+420733333332',
          '+420733333334',
          '+420777777778',
          '+420733333335',
          '+420733333336',
        ],
        Schema.decodeSync(Schema.Array(E164PhoneNumber)),
        Array.map(hashPhoneNumber),
        Effect.all
      )

      yield* _(setAuthHeaders(authHeadersOld))
      yield* _(
        app.Contact.importContacts({
          payload: {
            contacts: hashesToImport,
            replace: true,
          },
          headers: commonAndSecurityHeadersOld,
        })
      )

      yield* _(setAuthHeaders(authHeadersNew))
      yield* _(
        app.Contact.importContacts({
          payload: {
            contacts: hashesToImport,
            replace: true,
          },
          headers: commonAndSecurityHeadersNew,
        })
      )
    })
  )
})

describe('updateBadOwnerHash', () => {
  describe('existing record with new hash exists', () => {
    it('Does not update anything if removePreviousUserIs false', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const app = yield* _(NodeTestingApp)
          yield* _(setAuthHeaders(authHeadersOld))
          const result = yield* _(
            app.User.updateBadOwnerHash({
              payload: {
                newData: {
                  hash: newHash,
                  signature: authHeadersNew.signature,
                },
                oldData: {
                  hash: oldHash,
                  signature: authHeadersOld.signature,
                },
                publicKey: keys.publicKeyPemBase64,
                removePreviousUser: false,
              },
            })
          )

          expect(result.updated).toEqual(false)
          expect(result.willDeleteExistingUserIfRan).toEqual(true)

          const oldContact = yield* _(queryContactsOldHash)
          const newContact = yield* _(queryContactsNewHash)

          expect(oldContact.length).toEqual(hashesToImport.length)
          expect(newContact.length).toEqual(hashesToImport.length)
        })
      )
    })
    it('Does properly update database when removePreviousUserIs true', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const app = yield* _(NodeTestingApp)
          yield* _(setAuthHeaders(authHeadersOld))
          const result = yield* _(
            app.User.updateBadOwnerHash({
              payload: {
                newData: {
                  hash: newHash,
                  signature: authHeadersNew.signature,
                },
                oldData: {
                  hash: oldHash,
                  signature: authHeadersOld.signature,
                },
                publicKey: keys.publicKeyPemBase64,
                removePreviousUser: true,
              },
            })
          )

          expect(result.updated).toEqual(true)

          const oldContact = yield* _(queryContactsOldHash)
          const newContact = yield* _(queryContactsNewHash)

          expect(oldContact.length).toEqual(0)
          expect(newContact.length).toEqual(hashesToImport.length)

          expect(yield* _(queryOldUser)).toHaveLength(0)
          expect(yield* _(queryNewUser)).toHaveLength(1)
        })
      )
    })
  })

  it('fails when signatures are invalid', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const someBadSignature =
          Schema.decodeSync(EcdsaSignature)('badSignature')

        yield* _(setAuthHeaders(authHeadersOld))
        const result1 = yield* _(
          app.User.updateBadOwnerHash({
            payload: {
              newData: {
                hash: newHash,
                signature: someBadSignature,
              },
              oldData: {
                hash: oldHash,
                signature: authHeadersOld.signature,
              },
              publicKey: keys.publicKeyPemBase64,
              removePreviousUser: true,
            },
          }),
          Effect.either
        )

        expectErrorResponse(UnableToVerifySignatureError)(result1)

        const result2 = yield* _(
          app.User.updateBadOwnerHash({
            payload: {
              newData: {
                hash: newHash,
                signature: authHeadersNew.signature,
              },
              oldData: {
                hash: oldHash,
                signature: someBadSignature,
              },
              publicKey: keys.publicKeyPemBase64,
              removePreviousUser: true,
            },
          }),
          Effect.either
        )

        expectErrorResponse(UnableToVerifySignatureError)(result2)
      })
    )
  })
  it('updates bad owner hash in database', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        // let's suppose There is only old user in the datase
        yield* _(setAuthHeaders(authHeadersNew))
        yield* _(
          app.User.deleteUser({
            headers: makeTestCommonAndSecurityHeaders(authHeadersNew),
          })
        )

        yield* _(setAuthHeaders(authHeadersOld))
        const result = yield* _(
          app.User.updateBadOwnerHash({
            payload: {
              newData: {
                hash: newHash,
                signature: authHeadersNew.signature,
              },
              oldData: {
                hash: oldHash,
                signature: authHeadersOld.signature,
              },
              publicKey: keys.publicKeyPemBase64,
              removePreviousUser: false,
            },
          })
        )

        expect(result.updated).toEqual(true)

        const oldContact = yield* _(queryContactsOldHash)
        const newContact = yield* _(queryContactsNewHash)

        expect(oldContact.length).toEqual(0)
        expect(newContact.length).toEqual(hashesToImport.length)
      })
    )
  })
})
