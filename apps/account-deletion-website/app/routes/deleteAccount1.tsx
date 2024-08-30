import {Schema} from '@effect/schema'
import {json, type ActionFunction} from '@remix-run/node'
import {Form, redirect, useActionData} from '@remix-run/react'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import * as TE from 'fp-ts/lib/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import LoadingAwareSubmitButton from '../LoadingAwareSubmitButton'
import {createUserPublicApi, parseFormData} from '../utils'

export default function deleteAccount1(): JSX.Element {
  const actionData = useActionData<typeof action>()

  return (
    <div>
      <p>
        To delete your account, login with the phone number you used in the Vexl
        app.
      </p>
      {!!actionData?.error && <p className="error">{actionData.error}</p>}
      <Form id="input-number" method="post">
        <label>
          <div className="label">Phone number</div>
          <input
            className="input-field"
            name="phoneNumber"
            aria-label="Your phone number with prefix"
            type="text"
            placeholder="+420 123 123 123"
          />
        </label>
        <LoadingAwareSubmitButton formAction="/deleteAccount1" label="Next" />
      </Form>
    </div>
  )
}

export const action: ActionFunction = async ({request}) => {
  return await pipe(
    TE.Do,
    TE.chainW(() =>
      effectToTaskEither(
        parseFormData(Schema.Struct({phoneNumber: E164PhoneNumberE}))(request)
      )
    ),
    TE.chainW(({phoneNumber}) =>
      effectToTaskEither(
        createUserPublicApi().initPhoneVerification({body: {phoneNumber}})
      )
    ),
    (a) => a,
    TE.matchW(
      (e) => {
        if (
          e._tag === 'ErrorParsingFormData' ||
          e._tag === 'UnableToSendVerificationSmsError'
        ) {
          return json({error: 'Invalid phone number.'})
        }

        if (e._tag === 'PreviousCodeNotExpiredError')
          return json({
            error:
              'Previous verification still in progress. Wait 5 minutes and try again.',
          })

        return json({error: 'Unknown error.'})
      },
      (result) => {
        return redirect(`/deleteAccount2/${String(result.verificationId)}`)
      }
    )
  )()
}
