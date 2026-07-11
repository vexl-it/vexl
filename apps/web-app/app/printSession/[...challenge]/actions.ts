'use server'

import {decodeFormData} from '@/src/server/formData'
import {createUserPublicApi} from '@/src/server/userApi'
import {type PrintSessionFormState} from '@/src/shared/formState'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {Effect, Either, Schema} from 'effect'

const printSessionFormSchema = Schema.Struct({
  signature: EcdsaSignature,
  pubKey: PublicKeyPemBase64,
})

export async function submitPrintSession(
  _previousState: PrintSessionFormState,
  formData: FormData
): Promise<PrintSessionFormState> {
  try {
    const {pubKey, signature} = decodeFormData(printSessionFormSchema, formData)
    const userApi = await createUserPublicApi()
    const verificationResult = await Effect.runPromise(
      Effect.either(
        userApi.verifyChallenge({
          signature,
          userPublicKey: pubKey,
        })
      )
    )

    if (Either.isLeft(verificationResult)) {
      if (verificationResult.left._tag === 'InvalidVerificationError') {
        return {
          error: 'Verification expired. Please start over.',
          session: null,
        }
      }

      console.error('submitPrintSession failed', verificationResult.left)

      return {
        error: 'Unnexpected error happended. Please try again or start over.',
        session: null,
      }
    }

    return {
      error: null,
      session: {
        hash: verificationResult.right.hash,
        publicKey: pubKey,
        signature: verificationResult.right.signature,
      },
    }
  } catch (error) {
    return {
      error: 'Unnexpected error happended. Please try again or start over.',
      session: null,
    }
  }
}
