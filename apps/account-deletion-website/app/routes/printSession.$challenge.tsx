import {type ActionFunction} from '@remix-run/node'
import {Form, Link, json, useActionData, useParams} from '@remix-run/react'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Schema} from 'effect'
import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {useEffect, useState} from 'react'
import LoadingAwareSubmitButton from '../LoadingAwareSubmitButton'
import {
  createUserPublicApi,
  ecdsaSign,
  getKeypair,
  parseFormData,
} from '../utils'

export default function printSession(): JSX.Element {
  const params = useParams()
  const [signature, setSignature] = useState<string | null>(null)
  const [keypair, setKeypair] = useState<PrivateKeyHolder | null>(null)
  const [error, setError] = useState<boolean>(false)

  const actionData = useActionData<typeof action>()

  useEffect(() => {
    pipe(
      getKeypair(),
      E.bindTo('keypair'),
      E.bindW('challenge', () =>
        pipe(params.challenge, E.fromNullable({_tag: 'noChallenge'} as const))
      ),
      E.bindW('signature', ({keypair, challenge}) =>
        ecdsaSign(keypair)(challenge)
      ),
      E.matchW(
        (e) => {
          console.error('Error signing challenge', e)
          setError(true)
        },
        ({signature, keypair}) => {
          setSignature(signature)
          setKeypair(keypair)
        }
      )
    )
  }, [params.challenge])

  return (
    <div>
      {!!error && (
        <div>
          Error signing you in. <Link to="/">Try again</Link>
        </div>
      )}
      {JSON.stringify(actionData)}
      {!!(signature && keypair) && (
        <Form method="post">
          {!!actionData?.error && (
            <>
              {' '}
              <p className="error">{actionData.error}</p>
              <Link to="/">Start over</Link>
            </>
          )}
          <input
            type="hidden"
            name="pubKey"
            value={keypair.publicKeyPemBase64}
          />
          <input type="hidden" name="signature" value={signature} />
          <LoadingAwareSubmitButton
            formAction="/deleteAccount3"
            label="Login and print info"
          />
        </Form>
      )}
    </div>
  )
}

export const action: ActionFunction = async ({request}) => {
  return await pipe(
    effectToTaskEither(
      parseFormData(
        Schema.Struct({signature: EcdsaSignature, pubKey: PublicKeyPemBase64E})
      )(request)
    ),
    TE.bindW('verificationResult', ({pubKey, signature}) =>
      effectToTaskEither(
        createUserPublicApi().verifyChallenge({
          body: {
            signature,
            userPublicKey: pubKey,
          },
        })
      )
    ),
    TE.matchW(
      (e) => {
        if (e._tag === 'InvalidVerificationError') {
          return json({
            error: 'Verification expired. Please start over.',
          })
        }
        return json({
          error: 'Unnexpected error happended. Please try again or start over.',
        })
      },
      ({verificationResult, pubKey}) =>
        json({
          hash: verificationResult.hash,
          publicKey: pubKey,
          signature: verificationResult.signature,
        })
    )
  )()
}
