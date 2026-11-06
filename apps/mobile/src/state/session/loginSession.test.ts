import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateLoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {ecdsaVerifyE} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {loginSessionProofMessage} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect} from 'effect'
import {loginSessionWithProof} from './loginSession'

// contact-service verifies exactly this way (ensureLoginSessionProof).
it('signs a proof the server verifies with the session public key', async () => {
  const privateKey = generatePrivateKey()
  const loginSessionId = generateLoginSessionId()

  const {loginSessionProof} = await Effect.runPromise(
    loginSessionWithProof({privateKey, loginSessionId})
  )
  const verify = (
    publicKey: typeof privateKey.publicKeyPemBase64,
    signedFor: typeof loginSessionId
  ): Promise<boolean> =>
    Effect.runPromise(
      ecdsaVerifyE(publicKey)({
        data: loginSessionProofMessage({
          loginSessionId: signedFor,
          signedAt: loginSessionProof.signedAt,
        }),
        signature: loginSessionProof.signature,
      })
    )

  expect(await verify(privateKey.publicKeyPemBase64, loginSessionId)).toBe(true)
  expect(
    await verify(generatePrivateKey().publicKeyPemBase64, loginSessionId)
  ).toBe(false)
  expect(
    await verify(privateKey.publicKeyPemBase64, generateLoginSessionId())
  ).toBe(false)
})
