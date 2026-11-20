'use client'

import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Page,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
  UploadIcon,
  buttonClassName,
  cx,
} from '@/src/components/ui'
import {useBannedNumbersApi} from '@/src/hooks/useBannedNumbersApi'
import {
  bannedNumbersErrorMessage,
  parseBannedNumbersCsv,
  type ParsedBannedNumbersCsv,
} from '@/src/services/bannedNumbers'
import {
  MAX_BANNED_NUMBERS_BATCH_SIZE,
  type AddBannedNumbersResponse,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Effect} from 'effect'
import {useState} from 'react'

const EXAMPLE_CSV = `+420800123456,Example Bank helpline
+420800123457,"Example Carrier, prepaid support"
+420800123458`

interface CsvFile extends ParsedBannedNumbersCsv {
  readonly name: string
}

const sumAddResults = Array.reduce<
  AddBannedNumbersResponse,
  AddBannedNumbersResponse
>({addedCount: 0, alreadyBannedCount: 0}, (sum, result) => ({
  addedCount: sum.addedCount + result.addedCount,
  alreadyBannedCount: sum.alreadyBannedCount + result.alreadyBannedCount,
}))

const numbersCount = (count: number): string =>
  `${count} ${count === 1 ? 'number' : 'numbers'}`

export default function ImportBannedNumbersPage() {
  const bannedNumbersApi = useBannedNumbersApi()
  const [file, setFile] = useState<CsvFile | null>(null)
  const [result, setResult] = useState<AddBannedNumbersResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleFileChosen = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const chosen = event.target.files?.[0]
    // Lets the same file be picked again after fixing it.
    event.target.value = ''
    if (!chosen) return

    setResult(null)
    setError(null)
    setFile({name: chosen.name, ...parseBannedNumbersCsv(await chosen.text())})
  }

  const handleBan = async ({numbers}: CsvFile) => {
    setSubmitting(true)
    setError(null)
    try {
      setResult(
        await bannedNumbersApi((client) =>
          Effect.forEach(
            Array.chunksOf(numbers, MAX_BANNED_NUMBERS_BATCH_SIZE),
            (chunk) => client.addBannedNumbers({payload: {numbers: chunk}})
          ).pipe(Effect.map(sumAddResults))
        )
      )
    } catch (banError) {
      setError(
        `${bannedNumbersErrorMessage(banError)}${
          numbers.length > MAX_BANNED_NUMBERS_BATCH_SIZE
            ? ` The file was sent in batches of ${MAX_BANNED_NUMBERS_BATCH_SIZE}, so earlier batches may already be banned.`
            : ''
        }`
      )
    } finally {
      setSubmitting(false)
    }
  }

  const filePicker = (
    <label
      className={cx(
        buttonClassName({variant: file ? 'secondary' : 'primary'}),
        'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus',
        submitting && 'pointer-events-none opacity-50'
      )}
    >
      <UploadIcon />
      {file ? 'Choose another file' : 'Choose CSV file'}
      <input
        type="file"
        accept=".csv,text/csv,text/plain"
        disabled={submitting}
        onChange={(event) => {
          void handleFileChosen(event)
        }}
        className="sr-only"
      />
    </label>
  )

  return (
    <Page narrow>
      <PageHeader
        title="Import banned numbers"
        description="Ban a list of numbers from a CSV file. Only for public service numbers like banks and carriers, never for private individuals."
        back={{href: '/banned-numbers', label: 'Banned numbers'}}
      />

      <Card title="File format" actions={filePicker}>
        <div className="space-y-3 text-sm text-ink-muted">
          <p>
            One number per line in international format, optionally followed by
            a comma and a note. No header row. Nothing is banned until you
            review the file below.
          </p>
          <pre className="overflow-x-auto rounded-control bg-canvas px-3 py-2 font-mono text-xs text-ink">
            {EXAMPLE_CSV}
          </pre>
          <p>
            The server limits how many new numbers can be banned per month. A
            file that goes over the limit is rejected and bans nothing.
          </p>
        </div>
      </Card>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {result ? (
        <Alert
          tone="success"
          title={`Banned ${numbersCount(result.addedCount)}`}
          action={
            <ButtonLink href="/banned-numbers" size="sm">
              View the list
            </ButtonLink>
          }
        >
          {result.alreadyBannedCount > 0
            ? `${numbersCount(result.alreadyBannedCount)} from the file had been banned before.`
            : null}
        </Alert>
      ) : null}

      {file && Array.isNonEmptyReadonlyArray(file.skippedRows) ? (
        <Card
          flush
          title={
            <span className="flex items-center gap-2">
              Skipped rows
              <Badge tone="warning">{file.skippedRows.length}</Badge>
            </span>
          }
          description="Lines that cannot be banned as written. Fix them in the file and choose it again, or go on without them."
        >
          <div className="max-h-72 overflow-y-auto">
            <Table
              head={
                <>
                  <Th align="right">Line</Th>
                  <Th>Content</Th>
                  <Th>Problem</Th>
                </>
              }
            >
              {Array.map(file.skippedRows, (row) => (
                <Tr key={row.line}>
                  <Td align="right" className="tabular-nums text-ink-muted">
                    {row.line}
                  </Td>
                  <Td className="min-w-40 font-mono text-xs wrap-anywhere">
                    {row.content}
                  </Td>
                  <Td className="min-w-40">
                    <span className="text-danger-ink">{row.problem}</span>
                  </Td>
                </Tr>
              ))}
            </Table>
          </div>
        </Card>
      ) : null}

      {file ? (
        <Card
          flush
          title={
            <span className="flex items-center gap-2">
              {result ? 'Sent to be banned' : 'To be banned'}
              <Badge tone={result ? 'success' : 'neutral'}>
                {file.numbers.length}
              </Badge>
            </span>
          }
          description={file.name}
          actions={
            result ? null : (
              <Button
                variant="primary"
                loading={submitting}
                disabled={!Array.isNonEmptyReadonlyArray(file.numbers)}
                onClick={() => {
                  void handleBan(file)
                }}
              >
                Ban {numbersCount(file.numbers.length)}
              </Button>
            )
          }
        >
          <div className="max-h-[28rem] overflow-y-auto">
            <Table
              head={
                <>
                  <Th>Number</Th>
                  <Th>Note</Th>
                </>
              }
              empty={
                <EmptyState
                  title="No valid numbers in this file"
                  description="Check the format above and choose the file again."
                />
              }
            >
              {Array.map(file.numbers, (number) => (
                <Tr key={number.phoneNumber}>
                  <Td className="font-mono whitespace-nowrap">
                    {number.phoneNumber}
                  </Td>
                  <Td className="min-w-48 break-words text-ink-muted">
                    {number.note ?? '—'}
                  </Td>
                </Tr>
              ))}
            </Table>
          </div>
        </Card>
      ) : null}
    </Page>
  )
}
