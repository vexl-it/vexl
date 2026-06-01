'use server'

import {decodeFormData} from '@/src/server/formData'
import {type ErrorFormState} from '@/src/shared/formState'
import {Effect, Either, Schema} from 'effect'
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
      Schema.decodeUnknown(EraseUserVerificationId)(rawVerificationId)
    )
    const userApi = await createUserPublicApi()
    const contactsApi = await createContactsPublicApi()
    const verificationResult = await Effect.runPromise(
      Effect.either(
        userApi.verifyAndEraseUser({
          code,
          verificationId,
        })
      )
    )

    if (Either.isLeft(verificationResult)) {
      if (verificationResult.left._tag === 'UnableToVerifySmsCodeError') {
        if (verificationResult.left.reason === 'BadCode') {
          return {
            error: 'Wrong code provided.',
          }
        }

        if (verificationResult.left.reason === 'Expired') {
          return {
            error: 'Verification expired. Please resend the code.',
          }
        }

        if (verificationResult.left.reason === 'MaxAttemptsReached') {
          return {
            error: 'Too many attempts. Please resend the code and try again.',
          }
        }
      }

      if (
        verificationResult.left._tag === 'VerificationNotFoundError' ||
        verificationResult.left._tag === 'InvalidVerificationError'
      ) {
        return {
          error: 'Bad verification code.',
        }
      }

      console.error(
        'submitDeleteAccount2 verification failed',
        verificationResult.left
      )

      return {
        error: 'Unexpected error. Try to resend the code and try again.',
      }
    }

    const eraseFromNetworkResult = await Effect.runPromise(
      Effect.either(
        contactsApi.eraseUserFromNetwork({
          token:
            verificationResult.right
              .shortLivedTokenForErasingUserOnContactService,
        })
      )
    )

    if (Either.isLeft(eraseFromNetworkResult)) {
      console.error(
        'submitDeleteAccount2 eraseUserFromNetwork failed',
        eraseFromNetworkResult.left
      )

      return {
        error: 'Unexpected error. Try to resend the code and try again.',
      }
    }

    if (process.env.NEXT_PUBLIC_DEBUG_DATA === 'true') {
      redirect(
        `/printSession/${verificationResult.right.shortLivedTokenForErasingUserOnContactService}`
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
