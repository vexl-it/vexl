import {json, redirect, type ActionFunction} from '@remix-run/node'
import {Form, Link, useActionData, useParams} from '@remix-run/react'
import * as crypto from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {VerificationId} from '@vexl-next/rest-api/src/services/user/contracts'
import * as TE from 'fp-ts/lib/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {useEffect, useState} from 'react'
import {z} from 'zod'
import LoadingAwareSubmitButton from '../LoadingAwareSubmitButton'
import {createUserPublicApi, parseFormData, saveKeyPair} from '../utils'

export default function deleteAccount2(): JSX.Element {
  const params = useParams()
  const [keypair, setKeypair] =
    useState<crypto.KeyHolder.PrivateKeyHolder | null>(null)
  const actionData = useActionData<typeof action>()

  useEffect(() => {
    const keypair = crypto.KeyHolder.generatePrivateKey()
    setKeypair(keypair)
    saveKeyPair(keypair)
  }, [setKeypair])

  return (
    <div>
      {!!actionData?.error && <p className="error">{actionData.error}</p>}
      {!!keypair && (
        <Form id="input-number" method="post">
          <label>
            <div className="label">Code from message</div>
            <input
              className="input-field"
              name="code"
              required
              aria-label="Your phone number with prefix"
              type="tel"
              placeholder="code from message"
            />
          </label>
          <Link className="block-align-end" to="/deleteAccount1">
            Resent
          </Link>
          <input
            type="hidden"
            name="pubKey"
            value={keypair.publicKeyPemBase64}
          />
          <input
            type="hidden"
            name="debugData"
            // @ts-expect-error for debug only
            value={(window.debugData as boolean) ? 'true' : 'false'}
          />
          <input
            type="hidden"
            name="verificationId"
            value={params.verificationId}
          />
          <LoadingAwareSubmitButton formAction="/deleteAccount2" label="Next" />
        </Form>
      )}
    </div>
  )
}

export const action: ActionFunction = async ({request}) => {
  return await pipe(
    request,
    parseFormData(
      z.object({
        code: z.string(),
        pubKey: PublicKeyPemBase64,
        verificationId: z.coerce.number().pipe(VerificationId),
        debugData: z.coerce.boolean().default(false),
      })
    ),
    TE.bindTo('data'),
    TE.bindW('result', ({data: {verificationId, code, pubKey}}) =>
      createUserPublicApi().verifyPhoneNumber({
        id: verificationId,
        code,
        userPublicKey: pubKey,
      })
    ),
    TE.matchW(
      (left) => {
        if (left._tag === 'ErrorParsingFormData') {
          return json({error: 'Fill in the code, please.'})
        }
        if (left._tag === 'VerificationNotFound') {
          return json({error: 'Bad verification code.'})
        }
        return json({
          error: 'Unexpected error. Try to resend the code and try again.',
        })
      },
      ({result, data}) => {
        return data.debugData
          ? redirect(`/printSession/${result.challenge}`)
          : redirect(`/deleteAccount3/${result.challenge}`)
      }
    )
  )()
}
