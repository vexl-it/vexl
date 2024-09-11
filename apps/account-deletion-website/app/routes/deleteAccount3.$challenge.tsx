import {Schema} from '@effect/schema'
import {type ActionFunction} from '@remix-run/node'
import {
  Form,
  Link,
  json,
  redirect,
  useActionData,
  useParams,
} from '@remix-run/react'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import * as E from 'fp-ts/lib/Either'
import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {useEffect, useState} from 'react'
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
    TE.Do,
    TE.chainW(() =>
      effectToTaskEither(
        parseFormData(
          Schema.Struct({
            signature: EcdsaSignature,
            pubKey: PublicKeyPemBase64E,
          })
        )(request)
      )
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
        effectToTaskEither(
          contactsPrivateApi.createUser({body: {firebaseToken: null}})
        ),
        T.chain(() => effectToTaskEither(contactsPrivateApi.deleteUser()))
      )
    }),
    TE.chainFirstTaskK(({userPrivateApi}) =>
      effectToTaskEither(userPrivateApi.deleteUser())
    ),
    TE.matchW(
      (e) => {
        if (e._tag === 'VerificationNotFoundError') {
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

// return Effect.gen(function* (_) {
//   const parsedFormData = yield* _(
//     parseFormData(
//       Schema.Struct({signature: EcdsaSignature, pubKey: PublicKeyPemBase64E})
//     )(request)
//   )

//   const verificationResult = yield* _(
//     createUserPublicApi().verifyChallenge({
//       body: {
//         signature: parsedFormData.signature,
//         userPublicKey: parsedFormData.pubKey,
//       },
//     })
//   )

//   const apis = {
//     contactsPrivateApi: createContactsPrivateApi({
//       hash: verificationResult.hash,
//       publicKey: parsedFormData.pubKey,
//       signature: verificationResult.signature,
//     }),
//     userPrivateApi: createUserPrivateApi({
//       hash: verificationResult.hash,
//       publicKey: parsedFormData.pubKey,
//       signature: verificationResult.signature,
//     }),
//   }

//   yield* _(
//     taskEitherToEffect(
//       apis.contactsPrivateApi.createUser({firebaseToken: null})
//     )
//   )

//   yield* _(apis.userPrivateApi.deleteUser())
// }).pipe(
//   Effect.catchAll((e) => {
//     if (e._tag === 'VerificationNotFound') {
//       return json({
//         error: 'Verification expired. Please start over.',
//       })
//     }
//     return json({
//       error: 'Unnexpected error happended. Please try again or start over.',
//     })
//   }),
//   Effect.map(() => ({redirect: '/deleteAccount4'}))
// )
