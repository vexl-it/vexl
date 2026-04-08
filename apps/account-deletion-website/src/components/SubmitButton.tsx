'use client'

import {useFormStatus} from 'react-dom'

export default function SubmitButton({
  label,
  pendingLabel = 'Loading...',
}: {
  label: string
  pendingLabel?: string
}) {
  const {pending} = useFormStatus()

  return (
    <input
      className="button"
      type="submit"
      value={pending ? pendingLabel : label}
      disabled={pending}
    />
  )
}
