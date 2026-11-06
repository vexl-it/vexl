'use client'

import {ACCEPTED_CMS_IMAGE_TYPES} from '@/src/services/cms/domain'
import {useState, type ReactNode} from 'react'

export const inputClassName =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'

export function Field({
  label,
  children,
}: {
  readonly label: string
  readonly children: ReactNode
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {children}
    </label>
  )
}

export function ImageField({
  label,
  value,
  onChange,
  uploadImage,
}: {
  readonly label: string
  readonly value: string
  readonly onChange: (url: string) => void
  readonly uploadImage: (file: File) => Promise<string>
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      onChange(await uploadImage(file))
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Failed to upload image'
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="text-sm">
      <Field label={label}>
        <input
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
          }}
          placeholder="https://resources.vexl.it/…"
          className={inputClassName}
        />
      </Field>
      <div className="mt-2 flex items-center gap-3">
        {!!value && (
          <img src={value} alt="" className="h-16 w-16 rounded object-cover" />
        )}
        <label className="cursor-pointer rounded-md bg-white px-3 py-1.5 font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept={ACCEPTED_CMS_IMAGE_TYPES}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void handleFile(file)
            }}
          />
        </label>
        {!!value && (
          <button
            type="button"
            onClick={() => {
              onChange('')
            }}
            className="text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        )}
      </div>
      {!!error && <p className="mt-1 text-red-600">{error}</p>}
    </div>
  )
}

export function FormMessage({
  error,
  success,
}: {
  readonly error: string | null
  readonly success?: string | null
}) {
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
        {error}
      </div>
    )
  }
  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
        {success}
      </div>
    )
  }
  return null
}
