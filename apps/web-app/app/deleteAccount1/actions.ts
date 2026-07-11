'use server'

import {decodeFormData} from '@/src/server/formData'
import {type ErrorFormState} from '@/src/shared/formState'
import {Effect, Either, Schema} from 'effect'
import {isRedirectError} from 'next/dist/client/components/redirect-error'
import {redirect} from 'next/navigation'

const deleteAccount1FormSchema = Schema.Struct({
  phoneNumber: Schema.String,
  turnstileToken: Schema.optionalWith(Schema.String, {
    default: () => '',
  }),
})

async function handleResponseError(error: {
  _tag: 'ResponseError'
  response: {
    headers: Record<string, string>
    status: number
    text: Effect.Effect<string, unknown>
  }
}): Promise<ErrorFormState> {
  const body = await Effect.runPromise(
    Effect.catchAll(error.response.text, () => Effect.succeed(''))
  )

  console.error('submitDeleteAccount1 response error', {
    body,
    headers: error.response.headers,
    status: error.response.status,
  })

  if (error.response.status === 429) {
    return {
      error: 'Too many attempts. Please try again later.',
    }
  }

  if (error.response.status === 403) {
    return {
      error: 'Request blocked upstream. Please try again later.',
    }
  }

  return {
    error: 'Unexpected server response. Please try again later.',
  }
}

export async function submitDeleteAccount1(
  _previousState: ErrorFormState,
  formData: FormData
): Promise<ErrorFormState> {
  try {
    const {phoneNumber: rawPhoneNumber, turnstileToken} = decodeFormData(
      deleteAccount1FormSchema,
      formData
    )
    const [{createUserPublicApi}, {E164PhoneNumber}, {TurnstileToken}] =
      await Promise.all([
        import('@/src/server/userApi'),
        import('@vexl-next/domain/src/general/E164PhoneNumber.brand'),
        import('@vexl-next/rest-api/src/services/user/contracts'),
      ])
    const phoneNumber = Effect.runSync(
      Schema.decodeUnknown(E164PhoneNumber)(rawPhoneNumber)
    )
    const decodedTurnstileToken =
      Schema.decodeEither(TurnstileToken)(turnstileToken)

    if (Either.isLeft(decodedTurnstileToken)) {
      return {
        error: 'Human verification failed. Please try again.',
      }
    }

    const userApi = await createUserPublicApi()
    const result = await Effect.runPromise(
      Effect.either(
        userApi.initEraseUser({
          phoneNumber,
          turnstileToken: decodedTurnstileToken.right,
        })
      )
    )

    if (Either.isLeft(result)) {
      if (
        result.left._tag === 'UnableToSendVerificationSmsError' &&
        result.left.reason === 'InvalidPhoneNumber'
      ) {
        return {
          error: 'Invalid phone number.',
        }
      }

      if (result.left._tag === 'PreviousCodeNotExpiredError') {
        return {
          error: 'A code was already sent recently. Please wait a bit.',
        }
      }

      if (result.left._tag === 'TurnstileVerificationError') {
        return {
          error: 'Human verification failed. Please try again.',
        }
      }

      if (
        result.left._tag === 'UnableToSendVerificationSmsError' &&
        result.left.reason === 'MaxAttemptsReached'
      ) {
        return {
          error: 'Too many attempts. Please try again later.',
        }
      }

      if (result.left._tag === 'UnableToSendVerificationSmsError') {
        return {
          error:
            'Unable to send SMS verification. Disable VPN/proxy and try again.',
        }
      }

      if (result.left._tag === 'ResponseError') {
        return await handleResponseError(result.left)
      }

      console.error('submitDeleteAccount1 failed', result.left)

      return {
        error: 'Unknown error.',
      }
    }

    redirect(
      `/deleteAccount2/${encodeURIComponent(String(result.right.verificationId))}`
    )
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
        error: 'Invalid phone number.',
      }
    }

    console.error('submitDeleteAccount1 unexpected error', error)

    return {
      error: 'Unknown error.',
    }
  }
}
