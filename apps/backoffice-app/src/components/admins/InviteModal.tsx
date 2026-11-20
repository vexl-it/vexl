'use client'

import {Button, Field, FormMessage, Input, Modal} from '@/src/components/ui'
import {createInvite} from '@/src/services/access/api'
import {
  type BackofficeSection,
  type CreateInviteRequest,
  type CreateInviteResponse,
} from '@/src/services/access/domain'
import {makeApiErrorMessage} from '@/src/services/apiErrorMessage'
import {Array} from 'effect'
import {useState} from 'react'
import {SectionPicker} from './sections'

const errorMessage = makeApiErrorMessage({})
const FORM_ID = 'invite-admin-form'

export type CreatedInvite = CreateInviteRequest & CreateInviteResponse

/** Mount it only while inviting, so the form starts empty every time. */
export function InviteModal({
  onClose,
  onCreated,
}: {
  readonly onClose: () => void
  readonly onCreated: (invite: CreatedInvite) => void
}) {
  const [label, setLabel] = useState('')
  const [sections, setSections] = useState<readonly BackofficeSection[]>([])
  const [sectionsError, setSectionsError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!Array.isNonEmptyReadonlyArray(sections)) {
      setSectionsError('Pick at least one section.')
      return
    }
    setCreating(true)
    setError(null)
    try {
      const request = {label: label.trim(), sections}
      onCreated({...request, ...(await createInvite(request))})
    } catch (createError) {
      setError(errorMessage(createError))
      setCreating(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Invite an admin"
      description="Creates a link the new admin opens to register their own passkey. It works once and expires after 5 minutes, so create it when they are ready."
      footer={
        <>
          <Button onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            loading={creating}
          >
            Create invite link
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="Label"
          required
          hint="Who or which device the passkey is for, e.g. “Jane – work laptop”. It cannot be changed later."
        >
          <Input
            type="text"
            required
            pattern=".*\S.*"
            title="Enter a label"
            maxLength={100}
            autoFocus
            autoComplete="off"
            value={label}
            onChange={(event) => {
              setLabel(event.target.value)
            }}
          />
        </Field>
        <SectionPicker
          selected={sections}
          onChange={(next) => {
            setSections(next)
            setSectionsError(null)
          }}
          error={sectionsError}
        />
        <FormMessage error={error} />
      </form>
    </Modal>
  )
}
