'use client'

import {
  createInvite,
  deletePasskey,
  listPasskeys,
  updatePasskeySections,
} from '@/src/services/access/api'
import {
  ALL_SECTIONS,
  type BackofficeSection,
  type CreateInviteResponse,
  type Passkey,
  SECTION_NAMES,
} from '@/src/services/access/domain'
import {copyToClipboard} from '@/src/services/clipboard'
import {Array, pipe} from 'effect'
import {useCallback, useEffect, useState} from 'react'

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Request failed'

const formatDate = (iso: string | null): string =>
  iso === null ? 'Never' : new Date(iso).toLocaleString()

const toggleSection = (
  sections: readonly BackofficeSection[],
  section: BackofficeSection
): readonly BackofficeSection[] =>
  Array.contains(sections, section)
    ? Array.filter(sections, (current) => current !== section)
    : pipe(
        ALL_SECTIONS,
        Array.filter(
          (current) => current === section || Array.contains(sections, current)
        )
      )

const buttonClassName =
  'rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50'

function SectionCheckboxes({
  selected,
  onChange,
}: {
  readonly selected: readonly BackofficeSection[]
  readonly onChange: (sections: readonly BackofficeSection[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {Array.map(ALL_SECTIONS, (section) => (
        <label key={section} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Array.contains(selected, section)}
            onChange={() => {
              onChange(toggleSection(selected, section))
            }}
          />
          {SECTION_NAMES[section]}
        </label>
      ))}
    </div>
  )
}

function InviteForm() {
  const [label, setLabel] = useState('')
  const [sections, setSections] = useState<readonly BackofficeSection[]>([])
  const [invite, setInvite] = useState<CreateInviteResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!Array.isNonEmptyReadonlyArray(sections)) {
      setError('Pick at least one section')
      return
    }
    setCreating(true)
    setError(null)
    setCopied(false)
    try {
      setInvite(await createInvite({label: label.trim(), sections}))
      setLabel('')
      setSections([])
    } catch (createError) {
      setError(errorMessage(createError))
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async (url: string) => {
    try {
      await copyToClipboard(url)
      setCopied(true)
    } catch {
      setError('Clipboard copy is blocked. Copy the link manually.')
    }
  }

  return (
    <form
      onSubmit={handleCreate}
      className="mt-6 space-y-4 rounded-lg bg-white p-4 shadow-sm"
    >
      <h2 className="text-lg font-medium text-gray-900">Invite an admin</h2>
      <label className="block text-sm">
        <span className="block font-medium text-gray-700">Label</span>
        <input
          type="text"
          required
          maxLength={100}
          value={label}
          onChange={(event) => {
            setLabel(event.target.value)
          }}
          placeholder="Who or which device this passkey is for"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none"
        />
      </label>
      <SectionCheckboxes selected={sections} onChange={setSections} />
      <button type="submit" disabled={creating} className={buttonClassName}>
        {creating ? 'Creating...' : 'Create invite link'}
      </button>

      {!!error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {invite !== null && (
        <div className="space-y-2 rounded-md bg-gray-50 p-4 text-sm">
          <p className="text-gray-700">
            Send this link to the person. It works once and expires at{' '}
            {formatDate(invite.expiresAt)}.
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded bg-white px-2 py-1 font-mono text-xs text-gray-900">
              {invite.inviteUrl}
            </code>
            <button
              type="button"
              onClick={() => {
                void handleCopy(invite.inviteUrl)
              }}
              className={buttonClassName}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}

export default function AdminsPage() {
  const [passkeys, setPasskeys] = useState<readonly Passkey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{
    readonly id: string
    readonly sections: readonly BackofficeSection[]
  } | null>(null)

  const loadPasskeys = useCallback(async () => {
    setError(null)
    try {
      setPasskeys(await listPasskeys())
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPasskeys()
  }, [loadPasskeys])

  const handleSave = async () => {
    if (editing === null) return
    setError(null)
    try {
      const updated = await updatePasskeySections(editing.id, editing.sections)
      setPasskeys((current) =>
        Array.map(current, (passkey) =>
          passkey.id === updated.id ? updated : passkey
        )
      )
      setEditing(null)
    } catch (saveError) {
      setError(errorMessage(saveError))
    }
  }

  const handleDelete = async (passkey: Passkey) => {
    if (!window.confirm(`Delete the passkey "${passkey.label}"?`)) return
    setError(null)
    try {
      await deletePasskey(passkey.id)
      setPasskeys((current) =>
        Array.filter(current, (other) => other.id !== passkey.id)
      )
    } catch (deleteError) {
      setError(errorMessage(deleteError))
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Admins</h1>
      <p className="mt-2 text-sm text-gray-700">
        Every passkey signs in on its own and sees only its sections. Changes
        apply immediately.
      </p>

      <InviteForm />

      {!!error && (
        <div className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-8 overflow-x-auto">
        {loading ? (
          <div className="text-gray-600">Loading passkeys...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-300 overflow-hidden rounded-lg bg-white shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Label
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Sections
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Created
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Last used
                </th>
                <th className="relative px-3 py-3.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {Array.map(passkeys, (passkey) => (
                <tr key={passkey.id}>
                  <td className="px-3 py-4 text-sm font-medium text-gray-900">
                    {passkey.label}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-700">
                    {editing?.id === passkey.id ? (
                      <SectionCheckboxes
                        selected={editing.sections}
                        onChange={(sections) => {
                          setEditing({id: passkey.id, sections})
                        }}
                      />
                    ) : (
                      pipe(
                        passkey.sections,
                        Array.map((section) => SECTION_NAMES[section]),
                        Array.join(', ')
                      )
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(passkey.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(passkey.lastUsedAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                    {editing?.id === passkey.id ? (
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          disabled={
                            !Array.isNonEmptyReadonlyArray(editing.sections)
                          }
                          onClick={() => {
                            void handleSave()
                          }}
                          className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(null)
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing({
                              id: passkey.id,
                              sections: passkey.sections,
                            })
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit sections
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleDelete(passkey)
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
