'use client'

import SubmitButton from '@/src/components/SubmitButton'
import {emptyErrorFormState} from '@/src/shared/formState'
import Link from 'next/link'
import {useActionState} from 'react'
import {submitDeleteAccount2} from './actions'

export default function DeleteAccount2Form({
  verificationId,
}: {
  verificationId: string
}) {
  const [state, formAction] = useActionState(
    submitDeleteAccount2,
    emptyErrorFormState
  )

  return (
    <form action={formAction} id="input-number">
      {state.error ? <p className="error">{state.error}</p> : null}
      <label>
        <div className="label">Code from message</div>
        <input
          className="input-field"
          name="code"
          required
          aria-label="Verification code from SMS"
          type="text"
          inputMode="numeric"
          placeholder="code from message"
        />
      </label>
      <Link className="block-align-end" href="/deleteAccount1">
        Resend
      </Link>
      <input type="hidden" name="verificationId" value={verificationId} />
      <p>
        You are about to delete your account. This action is irreversible. Do
        you really want to delete your account?
      </p>
      <SubmitButton label="Yes delete" />
    </form>
  )
}
