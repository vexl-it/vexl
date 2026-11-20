'use client'

import {Button, Field, Input, Modal} from '@/src/components/ui'
import {useCallback, useState} from 'react'

interface PromptOptions {
  readonly title: string
  readonly label: string
  readonly hint?: string
  readonly initialValue?: string
  readonly confirmLabel: string
}

interface PendingPrompt {
  readonly options: PromptOptions
  readonly resolve: (value: string | null) => void
}

function PromptModal({
  options,
  onSettle,
}: {
  readonly options: PromptOptions
  readonly onSettle: (value: string | null) => void
}) {
  const [value, setValue] = useState(options.initialValue ?? '')

  return (
    <Modal
      open
      onClose={() => {
        onSettle(null)
      }}
      title={options.title}
      footer={
        <>
          <Button
            onClick={() => {
              onSettle(null)
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onSettle(value)
            }}
          >
            {options.confirmLabel}
          </Button>
        </>
      }
    >
      <Field label={options.label} hint={options.hint}>
        <Input
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
          }}
          // Not a form: this renders inside the editor's form.
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            onSettle(value)
          }}
        />
      </Field>
    </Modal>
  )
}

/** A promise-based replacement for `window.prompt`; render `dialog` once. */
export function useTextPrompt() {
  const [pending, setPending] = useState<PendingPrompt | null>(null)

  const prompt = useCallback(
    (options: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        setPending({options, resolve})
      }),
    []
  )

  const dialog = pending ? (
    <PromptModal
      options={pending.options}
      onSettle={(value) => {
        pending.resolve(value)
        setPending(null)
      }}
    />
  ) : null

  return {prompt, dialog}
}
