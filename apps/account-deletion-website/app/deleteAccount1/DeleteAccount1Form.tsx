'use client'

import SubmitButton from '@/src/components/SubmitButton'
import {emptyErrorFormState} from '@/src/shared/formState'
import {useActionState} from 'react'
import {submitDeleteAccount1} from './actions'

export default function DeleteAccount1Form() {
  const [state, formAction] = useActionState(
    submitDeleteAccount1,
    emptyErrorFormState
  )

  return (
    <form action={formAction} id="input-number">
      {state.error ? <p className="error">{state.error}</p> : null}
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
      <SubmitButton label="Next" />
    </form>
  )
}
