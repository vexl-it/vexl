'use client'

import SubmitButton from '@/src/components/SubmitButton'
import {emptyErrorFormState} from '@/src/shared/formState'
import Script from 'next/script'
import {useActionState, useEffect} from 'react'
import {submitDeleteAccount1} from './actions'

export default function DeleteAccount1Form() {
  const [state, formAction] = useActionState(
    submitDeleteAccount1,
    emptyErrorFormState
  )
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!state.error || !turnstileSiteKey) return
    window.turnstile?.reset()
  }, [state.error, turnstileSiteKey])

  return (
    <>
      {turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      ) : null}
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
        {turnstileSiteKey ? (
          <div
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
            data-action="delete-account-init"
            data-response-field-name="turnstileToken"
          />
        ) : null}
        <SubmitButton label="Next" />
      </form>
    </>
  )
}
