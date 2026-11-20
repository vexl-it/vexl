'use client'

import {Button, buttonClassName, cx, Field, Input} from '@/src/components/ui'
import {ACCEPTED_CMS_IMAGE_TYPES} from '@/src/services/cms/domain'
import {useState} from 'react'

export function ImageField({
  label,
  value,
  onChange,
  uploadImage,
  wide = false,
}: {
  readonly label: string
  readonly value: string
  readonly onChange: (url: string) => void
  readonly uploadImage: (file: File) => Promise<string>
  /** A full-width 16:9 preview instead of a round thumbnail. */
  readonly wide?: boolean
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
    <div className={cx('flex gap-3', wide ? 'flex-col' : 'items-start')}>
      {value ? (
        <img
          src={value}
          alt=""
          className={cx(
            'bg-canvas object-cover',
            wide
              ? 'aspect-video w-full rounded-control border border-line'
              : 'mt-7 size-9 shrink-0 rounded-full'
          )}
        />
      ) : null}
      <div className="min-w-0 flex-1 space-y-2">
        <Field
          label={label}
          error={error}
          hint="Paste a link or upload a PNG, JPEG, WebP or GIF."
        >
          <Input
            type="url"
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
            }}
            placeholder="https://…"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <label className={buttonClassName({size: 'sm'})}>
            {uploading ? 'Uploading…' : value ? 'Replace' : 'Upload'}
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
          {value ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange('')
              }}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
