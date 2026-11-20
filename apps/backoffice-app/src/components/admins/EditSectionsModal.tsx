'use client'

import {Alert, Button, FormMessage, Modal} from '@/src/components/ui'
import {updatePasskeySections} from '@/src/services/access/api'
import {type Passkey} from '@/src/services/access/domain'
import {makeApiErrorMessage} from '@/src/services/apiErrorMessage'
import {Array} from 'effect'
import {useState} from 'react'
import {SectionPicker} from './sections'

const errorMessage = makeApiErrorMessage({})

/** Mount it only while editing, so every passkey starts from its own state. */
export function EditSectionsModal({
  passkey,
  isOwn,
  isLastAdmin,
  onClose,
  onSaved,
}: {
  readonly passkey: Passkey
  readonly isOwn: boolean
  readonly isLastAdmin: boolean
  readonly onClose: () => void
  readonly onSaved: (passkey: Passkey) => void
}) {
  const [sections, setSections] = useState(passkey.sections)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unchanged =
    sections.length === passkey.sections.length &&
    Array.every(sections, (section) =>
      Array.contains(passkey.sections, section)
    )

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      onSaved(await updatePasskeySections(passkey.id, sections))
    } catch (saveError) {
      setError(errorMessage(saveError))
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Sections for “${passkey.label}”`}
      description="Pick what this passkey can open. The change applies as soon as you save, also to a session that is already signed in."
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={unchanged || !Array.isNonEmptyReadonlyArray(sections)}
            onClick={() => {
              void handleSave()
            }}
          >
            Save sections
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SectionPicker
          selected={sections}
          onChange={setSections}
          adminsLocked={isLastAdmin}
          error={
            Array.isNonEmptyReadonlyArray(sections)
              ? null
              : 'Pick at least one section. To remove all access, revoke the passkey.'
          }
        />
        {isOwn && !Array.contains(sections, 'admins') ? (
          <Alert tone="warning">
            This is your own passkey. Without Admins you lose this page and
            cannot give the access back to yourself.
          </Alert>
        ) : null}
        <FormMessage error={error} />
      </div>
    </Modal>
  )
}
