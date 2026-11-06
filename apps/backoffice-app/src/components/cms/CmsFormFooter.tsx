'use client'

import {type CmsStatus} from '@vexl-next/domain/src/general/cms'
import {FormMessage} from './fields'

interface Props {
  readonly status: CmsStatus
  readonly saving: boolean
  readonly error: string | null
  readonly success: string | null
  /** Validates the form, then saves. */
  readonly onSave: (publish: boolean) => void
  readonly onUnpublish: () => void
}

export function CmsFormFooter({
  status,
  saving,
  error,
  success,
  onSave,
  onUnpublish,
}: Props) {
  return (
    <div className="space-y-4">
      <FormMessage error={error} success={success} />
      <div className="flex flex-wrap justify-end gap-3">
        {status === 'published' && (
          <button
            type="button"
            disabled={saving}
            onClick={onUnpublish}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Unpublish
          </button>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            onSave(false)
          }}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          {status === 'published' ? 'Save' : 'Save draft'}
        </button>
        {status === 'draft' && (
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              onSave(true)
            }}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            Save and publish
          </button>
        )}
      </div>
    </div>
  )
}
