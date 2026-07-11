'use client'

import {
  createSignedChallenge,
  ensureBrowserPolyfills,
} from '@/src/client/session'
import SubmitButton from '@/src/components/SubmitButton'
import {emptyPrintSessionFormState} from '@/src/shared/formState'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import Link from 'next/link'
import {useActionState, useEffect, useState} from 'react'
import {submitPrintSession} from './actions'

export default function PrintSessionForm({challenge}: {challenge: string}) {
  const [signature, setSignature] = useState<string | null>(null)
  const [keypair, setKeypair] = useState<PrivateKeyHolder | null>(null)
  const [error, setError] = useState(false)
  const [state, formAction] = useActionState(
    submitPrintSession,
    emptyPrintSessionFormState
  )

  useEffect(() => {
    ensureBrowserPolyfills()

    const result = createSignedChallenge(challenge)
    if (!result.ok) {
      console.error('Error signing challenge', result.error)
      setError(true)
      return
    }

    setSignature(result.signature)
    setKeypair(result.keypair)
  }, [challenge])

  const debugOutput =
    state.session !== null
      ? JSON.stringify(state.session)
      : state.error
        ? JSON.stringify({error: state.error})
        : null

  return (
    <div>
      {error ? (
        <div>
          Error signing you in. <Link href="/">Try again</Link>
        </div>
      ) : null}
      {debugOutput}
      {signature !== null && keypair !== null ? (
        <form action={formAction}>
          {state.error ? (
            <>
              <p className="error">{state.error}</p>
              <Link href="/">Start over</Link>
            </>
          ) : null}
          <input
            type="hidden"
            name="pubKey"
            value={keypair.publicKeyPemBase64}
          />
          <input type="hidden" name="signature" value={signature} />
          <SubmitButton label="Login and print info" />
        </form>
      ) : null}
    </div>
  )
}
