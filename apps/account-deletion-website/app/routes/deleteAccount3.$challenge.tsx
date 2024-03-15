import {type ActionFunction} from '@remix-run/node'
import {
  Form,
  Link,
  json,
  redirect,
  useActionData,
  useParams,
} from '@remix-run/react'
import {
  PublicKeyPemBase64,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import * as E from 'fp-ts/lib/Either'
import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {useEffect, useState} from 'react'
import {z} from 'zod'
import LoadingAwareSubmitButton from '../LoadingAwareSubmitButton'
import {
  createContactsPrivateApi,
  createUserPrivateApi,
  createUserPublicApi,
  ecdsaSign,
  getKeypair,
  parseFormData,
} from '../utils'

export default function deleteAccount3(): JSX.Element {
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
      {!!(signature && keypair) && (
        <Form method="post">
          <p>
            Phone number verified. You are about to delete your account. This
            action is irreversible. Do really you want to delete your account?
          </p>
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
            label="Yes, delete my account"
          />
        </Form>
      )}
    </div>
  )
}

export const action: ActionFunction = async ({request}) => {
  return await pipe(
    request,
    parseFormData(
      z.object({signature: z.string(), pubKey: PublicKeyPemBase64})
    ),
    TE.bindW('verificationResult', ({pubKey, signature}) =>
      createUserPublicApi().verifyChallenge({
        signature,
        userPublicKey: pubKey,
      })
    ),
    TE.map(({verificationResult, pubKey}) => ({
      contactsPrivateApi: createContactsPrivateApi({
        hash: verificationResult.hash,
        publicKey: pubKey,
        signature: verificationResult.signature,
      }),
      userPrivateApi: createUserPrivateApi({
        hash: verificationResult.hash,
        publicKey: pubKey,
        signature: verificationResult.signature,
      }),
    })),
    TE.chainFirstTaskK(({contactsPrivateApi}) => {
      return pipe(
        contactsPrivateApi.createUser({firebaseToken: null}),
        T.chain(() => contactsPrivateApi.deleteUser())
      )
    }),
    TE.chainFirstTaskK(({userPrivateApi}) => userPrivateApi.deleteUser()),
    TE.matchW(
      (e) => {
        if (e._tag === 'VerificationNotFound') {
          return json({
            error: 'Verification expired. Please start over.',
          })
        }
        return json({
          error: 'Unnexpected error happended. Please try again or start over.',
        })
      },
      () => redirect('/deleteAccount4')
    )
  )()
}
