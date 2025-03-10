import {
  generatePrivateKey,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {Array, Effect, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

import {HttpClientRequest} from '@effect/platform'
import {SqlClient} from '@effect/sql'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  HashedPhoneNumberE,
  type HashedPhoneNumber,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {
  EcdsaSignature,
  hmacSignE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {cryptoConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {
  generateUserAuthData,
  hashPhoneNumber,
} from '@vexl-next/server-utils/src/generateUserAuthData'

const keys = generatePrivateKey()
const phoneNumber = Schema.decodeSync(E164PhoneNumberE)('+420733333333')

let oldHash: HashedPhoneNumber
let newHash: HashedPhoneNumber
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
        hash_from = ${oldHash}
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
        hash_from = ${newHash}
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
        hash = ${oldHash}
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
        hash = ${newHash}
    `
  )
)

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const app = yield* _(NodeTestingApp)

      if (authHeadersNew)
        yield* _(
          app.deleteUser({}, HttpClientRequest.setHeaders(authHeadersNew))
        )
      if (authHeadersOld)
        yield* _(
          app.deleteUser({}, HttpClientRequest.setHeaders(authHeadersOld))
        )

      oldHash = yield* _(
        hmacSignE('vexlOldHmacKeyWhatever')(phoneNumber),
        Effect.flatMap(Schema.decode(HashedPhoneNumberE))
      )

      newHash = yield* _(
        cryptoConfig.hmacKey,
        Effect.flatMap((hash) => hmacSignE(hash)(phoneNumber)),
        Effect.flatMap(Schema.decode(HashedPhoneNumberE))
      )

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

      yield* _(
        app.createUser(
          {
            body: {
              firebaseToken: null,
              expoToken: Schema.decodeSync(ExpoNotificationTokenE)('someToken'),
            },
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
            }),
          },
          HttpClientRequest.setHeaders({
            ...authHeadersOld,
          })
        )
      )

      yield* _(
        app.createUser(
          {
            body: {
              firebaseToken: null,
              expoToken: Schema.decodeSync(ExpoNotificationTokenE)('someToken'),
            },
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
            }),
          },
          HttpClientRequest.setHeaders({
            ...authHeadersNew,
          })
        )
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
        Schema.decodeSync(Schema.Array(E164PhoneNumberE)),
        Array.map(hashPhoneNumber),
        Effect.all
      )

      yield* _(
        app.importContacts(
          {
            body: {
              contacts: hashesToImport,
              replace: true,
            },
          },
          HttpClientRequest.setHeaders(authHeadersOld)
        )
      )

      yield* _(
        app.importContacts(
          {
            body: {
              contacts: hashesToImport,
              replace: true,
            },
          },
          HttpClientRequest.setHeaders(authHeadersNew)
        )
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
          const result = yield* _(
            app.updateBadOwnerHash(
              {
                body: {
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
              },
              HttpClientRequest.setHeaders(authHeadersOld)
            )
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
          const result = yield* _(
            app.updateBadOwnerHash(
              {
                body: {
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
              },
              HttpClientRequest.setHeaders(authHeadersOld)
            )
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

        const result1 = yield* _(
          app.updateBadOwnerHash(
            {
              body: {
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
            },
            HttpClientRequest.setHeaders(authHeadersOld)
          ),
          Effect.either
        )

        expect(result1).toHaveProperty('_tag', 'Left')
        if (result1._tag !== 'Left') return
        expect(result1.left.error).toHaveProperty(
          '_tag',
          'UnableToVerifySignatureError'
        )

        const result2 = yield* _(
          app.updateBadOwnerHash(
            {
              body: {
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
            },
            HttpClientRequest.setHeaders(authHeadersOld)
          ),
          Effect.either
        )

        expect(result2).toHaveProperty('_tag', 'Left')
        if (result2._tag !== 'Left') return

        expect(result2.left.error).toHaveProperty(
          '_tag',
          'UnableToVerifySignatureError'
        )
      })
    )
  })
  it('updates bad owner hash in database', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        // let's suppose There is only old user in the datase
        yield* _(
          app.deleteUser({}, HttpClientRequest.setHeaders(authHeadersNew))
        )

        const result = yield* _(
          app.updateBadOwnerHash(
            {
              body: {
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
            },
            HttpClientRequest.setHeaders(authHeadersOld)
          )
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
