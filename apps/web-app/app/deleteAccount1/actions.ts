'use server'

import {decodeFormData} from '@/src/server/formData'
import {type ErrorFormState} from '@/src/shared/formState'
import {Effect, Result, Schema} from 'effect'
import {isRedirectError} from 'next/dist/client/components/redirect-error'
import {redirect} from 'next/navigation'

const deleteAccount1FormSchema = Schema.Struct({
  phoneNumber: Schema.String,
  turnstileToken: Schema.String.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): '' => '')),
    Schema.withConstructorDefault(Effect.sync((): '' => ''))
  ),
})

async function handleResponseError(error: {
  response: {
    headers: Record<string, string>
    status: number
    text: Effect.Effect<string, unknown>
  }
}): Promise<ErrorFormState> {
  const body = await Effect.runPromise(
    Effect.catch(error.response.text, () => Effect.succeed(''))
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
      Schema.decodeUnknownEffect(E164PhoneNumber)(rawPhoneNumber)
    )
    const decodedTurnstileToken =
      Schema.decodeResult(TurnstileToken)(turnstileToken)

    if (Result.isFailure(decodedTurnstileToken)) {
      return {
        error: 'Human verification failed. Please try again.',
      }
    }

    const userApi = await createUserPublicApi()
    const result = await Effect.runPromise(
      Effect.result(
        userApi.initEraseUser({
          phoneNumber,
          turnstileToken: decodedTurnstileToken.success,
        })
      )
    )

    if (Result.isFailure(result)) {
      if (
        result.failure._tag === 'UnableToSendVerificationSmsError' &&
        result.failure.reason === 'InvalidPhoneNumber'
      ) {
        return {
          error: 'Invalid phone number.',
        }
      }

      if (result.failure._tag === 'PreviousCodeNotExpiredError') {
        return {
          error: 'A code was already sent recently. Please wait a bit.',
        }
      }

      if (result.failure._tag === 'TurnstileVerificationError') {
        return {
          error: 'Human verification failed. Please try again.',
        }
      }

      if (
        result.failure._tag === 'UnableToSendVerificationSmsError' &&
        result.failure.reason === 'MaxAttemptsReached'
      ) {
        return {
          error: 'Too many attempts. Please try again later.',
        }
      }

      if (result.failure._tag === 'UnableToSendVerificationSmsError') {
        return {
          error:
            'Unable to send SMS verification. Disable VPN/proxy and try again.',
        }
      }

      if (
        result.failure._tag === 'HttpClientError' &&
        'response' in result.failure.reason
      ) {
        return await handleResponseError(result.failure.reason)
      }

      console.error('submitDeleteAccount1 failed', result.failure)

      return {
        error: 'Unknown error.',
      }
    }

    redirect(
      `/deleteAccount2/${encodeURIComponent(String(result.success.verificationId))}`
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
