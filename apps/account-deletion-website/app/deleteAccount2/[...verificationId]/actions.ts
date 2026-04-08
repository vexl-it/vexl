'use server'

import {createContactsPublicApi} from '@/src/server/contactApi'
import {decodeFormData} from '@/src/server/formData'
import {createUserPublicApi} from '@/src/server/userApi'
import {type ErrorFormState} from '@/src/shared/formState'
import {EraseUserVerificationId} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, Either, Schema} from 'effect'
import {isRedirectError} from 'next/dist/client/components/redirect-error'
import {redirect} from 'next/navigation'

const deleteAccount2FormSchema = Schema.Struct({
  code: Schema.String,
  verificationId: EraseUserVerificationId,
  debugData: Schema.optionalWith(Schema.BooleanFromString, {
    default: () => false,
  }),
})

export async function submitDeleteAccount2(
  _previousState: ErrorFormState,
  formData: FormData
): Promise<ErrorFormState> {
  try {
    const {code, debugData, verificationId} = decodeFormData(
      deleteAccount2FormSchema,
      formData
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

    if (debugData) {
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

    return {
      error: 'Unexpected error. Try to resend the code and try again.',
    }
  }
}
