'use client'

import {
  Button,
  Field,
  FormMessage,
  Input,
  Modal,
  type AlertTone,
} from '@/src/components/ui'
import {useBannedNumbersApi} from '@/src/hooks/useBannedNumbersApi'
import {
  bannedNumbersErrorMessage,
  parseNumberToBan,
} from '@/src/services/bannedNumbers'
import {Either} from 'effect'
import {useId, useState} from 'react'

export function BanNumberModal({
  open,
  onClose,
  onBanned,
}: {
  readonly open: boolean
  readonly onClose: () => void
  readonly onBanned: (feedback: {
    readonly tone: AlertTone
    readonly message: string
  }) => void
}) {
  const bannedNumbersApi = useBannedNumbersApi()
  const formId = useId()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [note, setNote] = useState('')
  const [invalidInput, setInvalidInput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const close = () => {
    setPhoneNumber('')
    setNote('')
    setInvalidInput(null)
    setError(null)
    onClose()
  }

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const numberToBan = parseNumberToBan(phoneNumber.trim(), note.trim())
    if (Either.isLeft(numberToBan)) {
      setInvalidInput(numberToBan.left)
      return
    }

    setInvalidInput(null)
    setError(null)
    setSubmitting(true)
    try {
      const {addedCount} = await bannedNumbersApi((client) =>
        client.addBannedNumbers({payload: {numbers: [numberToBan.right]}})
      )
      onBanned(
        addedCount > 0
          ? {
              tone: 'success',
              message: `Banned ${numberToBan.right.phoneNumber}.`,
            }
          : {
              tone: 'info',
              message: `${numberToBan.right.phoneNumber} was already banned.`,
            }
      )
      close()
    } catch (banError) {
      setError(bannedNumbersErrorMessage(banError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Ban a number"
      description="Only for public service numbers like banks and carriers, never for private individuals."
      footer={
        <>
          <Button onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            loading={submitting}
          >
            Ban number
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
        className="space-y-5"
      >
        <Field
          label="Phone number"
          required
          hint="International format, starting with + and the country code."
          error={invalidInput}
        >
          <Input
            type="tel"
            required
            value={phoneNumber}
            onChange={(event) => {
              setPhoneNumber(event.target.value)
            }}
            placeholder="+420 800 123 456"
            invalid={invalidInput !== null}
            className="font-mono"
          />
        </Field>
        <Field label="Note" hint="Optional. Whose number it is and why.">
          <Input
            value={note}
            onChange={(event) => {
              setNote(event.target.value)
            }}
            maxLength={500}
            placeholder="Example Bank helpline"
          />
        </Field>
        <FormMessage error={error} />
      </form>
    </Modal>
  )
}
