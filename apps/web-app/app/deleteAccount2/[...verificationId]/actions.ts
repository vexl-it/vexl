'use server'

import {decodeFormData} from '@/src/server/formData'
import {type ErrorFormState} from '@/src/shared/formState'
import {Effect, Result, Schema} from 'effect'
import {isRedirectError} from 'next/dist/client/components/redirect-error'
import {redirect} from 'next/navigation'

const deleteAccount2FormSchema = Schema.Struct({
  code: Schema.String,
  verificationId: Schema.String,
})

export async function submitDeleteAccount2(
  _previousState: ErrorFormState,
  formData: FormData
): Promise<ErrorFormState> {
  try {
    const {code, verificationId: rawVerificationId} = decodeFormData(
      deleteAccount2FormSchema,
      formData
    )
    const [
      {createUserPublicApi},
      {createContactsPublicApi},
      {EraseUserVerificationId},
    ] = await Promise.all([
      import('@/src/server/userApi'),
      import('@/src/server/contactApi'),
      import('@vexl-next/rest-api/src/services/user/contracts'),
    ])
    const verificationId = Effect.runSync(
      Schema.decodeUnknownEffect(EraseUserVerificationId)(rawVerificationId)
    )
    const userApi = await createUserPublicApi()
    const contactsApi = await createContactsPublicApi()
    const verificationResult = await Effect.runPromise(
      Effect.result(
        userApi.verifyAndEraseUser({
          code,
          verificationId,
        })
      )
    )

    if (Result.isFailure(verificationResult)) {
      if (verificationResult.failure._tag === 'UnableToVerifySmsCodeError') {
        if (verificationResult.failure.reason === 'BadCode') {
          return {
            error: 'Wrong code provided.',
          }
        }

        if (verificationResult.failure.reason === 'Expired') {
          return {
            error: 'Verification expired. Please resend the code.',
          }
        }

        if (verificationResult.failure.reason === 'MaxAttemptsReached') {
          return {
            error: 'Too many attempts. Please resend the code and try again.',
          }
        }
      }

      if (
        verificationResult.failure._tag === 'VerificationNotFoundError' ||
        verificationResult.failure._tag === 'InvalidVerificationError'
      ) {
        return {
          error: 'Bad verification code.',
        }
      }

      console.error(
        'submitDeleteAccount2 verification failed',
        verificationResult.failure
      )

      return {
        error: 'Unexpected error. Try to resend the code and try again.',
      }
    }

    const eraseFromNetworkResult = await Effect.runPromise(
      Effect.result(
        contactsApi.eraseUserFromNetwork({
          token:
            verificationResult.success
              .shortLivedTokenForErasingUserOnContactService,
        })
      )
    )

    if (Result.isFailure(eraseFromNetworkResult)) {
      console.error(
        'submitDeleteAccount2 eraseUserFromNetwork failed',
        eraseFromNetworkResult.failure
      )

      return {
        error:
          'Your account was deleted, but we could not finish removing your network data. Please contact Vexl support.',
      }
    }

    if (process.env.NEXT_PUBLIC_DEBUG_DATA === 'true') {
      redirect(
        `/printSession/${verificationResult.success.shortLivedTokenForErasingUserOnContactService}`
      )
    }

    redirect('/deleteAccount4')
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      '_tag' in error &&
      error._tag === 'ErrorParsingFormData'
    ) {
      return {
        error: 'Fill in the code, please.',
      }
    }

    console.error('submitDeleteAccount2 unexpected error', error)

    return {
      error: 'Unexpected error. Try to resend the code and try again.',
    }
  }
}
