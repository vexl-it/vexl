'use client'

import {useAdminApi} from '@/src/hooks/useAdminApi'
import {
  bannedNumbersErrorMessage,
  parseBannedNumbersCsv,
  type InvalidCsvRow,
} from '@/src/services/bannedNumbers'
import {makeBannedNumbersAdminClient} from '@/src/services/contactInternalApi'
import {
  BannedNumberToAdd,
  MAX_BANNED_NUMBERS_BATCH_SIZE,
  type AddBannedNumbersResponse,
  type BannedNumberAdminInfo,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {useCallback, useEffect, useRef, useState} from 'react'

const PAGE_SIZE = 50

interface AddSummary extends AddBannedNumbersResponse {
  readonly duplicateCount: number
  readonly invalidRows: readonly InvalidCsvRow[]
}

const sumAddResults = Array.reduce<
  AddBannedNumbersResponse,
  AddBannedNumbersResponse
>({addedCount: 0, alreadyBannedCount: 0}, (sum, result) => ({
  addedCount: sum.addedCount + result.addedCount,
  alreadyBannedCount: sum.alreadyBannedCount + result.alreadyBannedCount,
}))

export default function BannedNumbersPage() {
  const bannedNumbersApi = useAdminApi(
    makeBannedNumbersAdminClient,
    bannedNumbersErrorMessage
  )
  const [items, setItems] = useState<readonly BannedNumberAdminInfo[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const [newPhoneNumber, setNewPhoneNumber] = useState('')
  const [newNote, setNewNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState<AddSummary | null>(null)

  const latestLoadRef = useRef(0)
  const loadPage = useCallback(
    async (pageToken: string | null) => {
      latestLoadRef.current += 1
      const loadId = latestLoadRef.current
      const isSuperseded = (): boolean => loadId !== latestLoadRef.current

      setLoading(true)
      setError(null)
      // A cursor only continues the search it came from.
      if (pageToken === null) setNextPageToken(null)
      try {
        const page = await bannedNumbersApi((client, headers) =>
          client.listBannedNumbers({
            headers,
            payload: {
              limit: PAGE_SIZE,
              search,
              nextPageToken: pageToken ?? undefined,
            },
          })
        )
        if (isSuperseded()) return

        setItems((current) =>
          pageToken === null ? page.items : [...current, ...page.items]
        )
        setNextPageToken(page.hasNext ? page.nextPageToken : null)
      } catch (loadError) {
        if (!isSuperseded()) setError(bannedNumbersErrorMessage(loadError))
      } finally {
        if (!isSuperseded()) setLoading(false)
      }
    },
    [bannedNumbersApi, search]
  )

  // Bumped after adding numbers, so the list reloads with the search that is
  // active by then.
  const [reloadCount, setReloadCount] = useState(0)
  useEffect(() => {
    void loadPage(null)
  }, [loadPage, reloadCount])

  const addNumbers = async (
    numbers: readonly BannedNumberToAdd[],
    csvIssues: Pick<AddSummary, 'duplicateCount' | 'invalidRows'>
  ) => {
    setSubmitting(true)
    setError(null)
    setSummary(null)
    try {
      const result = await bannedNumbersApi((client, headers) =>
        Effect.forEach(
          Array.chunksOf(numbers, MAX_BANNED_NUMBERS_BATCH_SIZE),
          (chunk) =>
            client.addBannedNumbers({headers, payload: {numbers: chunk}})
        ).pipe(Effect.map(sumAddResults))
      )
      setSummary({...result, ...csvIssues})
      setReloadCount((count) => count + 1)
      return true
    } catch (addError) {
      setError(bannedNumbersErrorMessage(addError))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdd = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const note = newNote.trim()
    const numberToAdd = Schema.decodeUnknownOption(BannedNumberToAdd)({
      phoneNumber: newPhoneNumber.trim(),
      ...(note ? {note} : {}),
    })
    if (Option.isNone(numberToAdd)) {
      setError('Enter the number in E.164 format, e.g. +420800123456.')
      return
    }

    const added = await addNumbers([numberToAdd.value], {
      duplicateCount: 0,
      invalidRows: [],
    })
    if (added) {
      setNewPhoneNumber('')
      setNewNote('')
    }
  }

  const handleCsvUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    // Lets the same file be picked again after fixing it.
    event.target.value = ''
    if (!file) return

    const {numbers, ...csvIssues} = parseBannedNumbersCsv(await file.text())
    await addNumbers(numbers, csvIssues)
  }

  const handleDelete = async (bannedNumber: BannedNumberAdminInfo) => {
    if (!window.confirm(`Unban ${bannedNumber.phoneNumber}?`)) return

    setError(null)
    try {
      await bannedNumbersApi((client, headers) =>
        client.deleteBannedNumber({headers, path: {id: bannedNumber.id}})
      )
      setItems((current) =>
        pipe(
          current,
          Array.filter((one) => one.id !== bannedNumber.id)
        )
      )
    } catch (deleteError) {
      setError(bannedNumbersErrorMessage(deleteError))
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Banned numbers</h1>
        <p className="mt-2 text-sm text-gray-700">
          Only for public service numbers like banks and carriers, never for
          private individuals.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-end"
        >
          <label className="text-sm sm:w-48">
            <span className="block font-medium text-gray-700">
              Phone number
            </span>
            <input
              type="tel"
              required
              value={newPhoneNumber}
              onChange={(event) => {
                setNewPhoneNumber(event.target.value)
              }}
              placeholder="+420800123456"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <label className="flex-1 text-sm">
            <span className="block font-medium text-gray-700">Note</span>
            <input
              type="text"
              maxLength={500}
              value={newNote}
              onChange={(event) => {
                setNewNote(event.target.value)
              }}
              placeholder="Optional"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            Ban
          </button>
        </form>

        <label className="block rounded-lg bg-white p-4 text-sm shadow-sm">
          <span className="block font-medium text-gray-700">Upload CSV</span>
          <span className="mt-1 block text-gray-500">
            One E.164 number per line, optionally followed by a comma and a
            note.
          </span>
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            disabled={submitting}
            onChange={(event) => {
              void handleCsvUpload(event)
            }}
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
      </div>

      {!!error && (
        <div className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {!!summary && <AddSummaryBox summary={summary} />}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          setSearch(searchInput.trim())
        }}
        className="mt-8 max-w-sm"
      >
        <input
          type="search"
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value)
          }}
          placeholder="Search number, press Enter"
          aria-label="Search banned numbers"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </form>

      <div className="mt-4 overflow-x-auto">
        {items.length === 0 ? (
          <div className="rounded-lg bg-white py-12 text-center shadow">
            <p className="text-gray-500">
              {loading ? 'Loading banned numbers...' : 'No banned numbers'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-300 overflow-hidden rounded-lg bg-white shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Number
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Note
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Added
                </th>
                <th className="relative px-3 py-3.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {pipe(
                items,
                Array.map((bannedNumber) => (
                  <tr key={String(bannedNumber.id)}>
                    <td className="whitespace-nowrap px-3 py-4 font-mono text-sm text-gray-900">
                      {bannedNumber.phoneNumber}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-700">
                      {bannedNumber.note}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {bannedNumber.createdAt.toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          void handleDelete(bannedNumber)
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {nextPageToken !== null && (
        <button
          onClick={() => {
            void loadPage(nextPageToken)
          }}
          disabled={loading}
          className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  )
}

function AddSummaryBox({summary}: {readonly summary: AddSummary}) {
  return (
    <div className="mt-6 rounded-md bg-green-50 p-4 text-sm text-green-900">
      <p>
        Added {summary.addedCount}, already banned {summary.alreadyBannedCount}
        {summary.duplicateCount > 0 &&
          `, duplicates in file ${summary.duplicateCount}`}
        .
      </p>
      {Array.isNonEmptyReadonlyArray(summary.invalidRows) && (
        <div className="mt-3 text-red-800">
          <p className="font-medium">
            {summary.invalidRows.length} invalid rows were skipped:
          </p>
          <ul className="mt-1 max-h-48 overflow-y-auto font-mono text-xs">
            {pipe(
              summary.invalidRows,
              Array.map((row) => (
                <li key={row.line}>
                  Line {row.line}: {row.content}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
