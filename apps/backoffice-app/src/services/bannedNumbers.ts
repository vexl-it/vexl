import {
  BannedNumbersMonthlyLimitReachedError,
  BannedNumberToAdd,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Either, pipe, Schema, type Option} from 'effect'
import {makeApiErrorMessage} from './apiErrorMessage'

const apiErrorMessage = makeApiErrorMessage({
  InvalidAdminToken:
    'Your token is not allowed to manage banned numbers. Sign in again.',
  NotFoundError: 'It no longer exists. Reload the page.',
})

export const bannedNumbersErrorMessage = (error: unknown): string =>
  error instanceof BannedNumbersMonthlyLimitReachedError
    ? `Over the limit of ${error.monthlyLimit} newly banned numbers per month. You can ban ${error.remainingThisMonth} more this month.`
    : apiErrorMessage(error)

export interface InvalidCsvRow {
  readonly line: number
  readonly content: string
}

export interface ParsedBannedNumbersCsv {
  readonly numbers: readonly BannedNumberToAdd[]
  readonly invalidRows: readonly InvalidCsvRow[]
  readonly duplicateCount: number
}

const QUOTED_VALUE = /^"(.*)"$/

const unquote = (value: string): string =>
  value.trim().replace(QUOTED_VALUE, '$1').replace(/""/g, '"').trim()

const parseRow = (content: string): Option.Option<BannedNumberToAdd> => {
  const [phoneNumber = '', ...noteColumns] = content.split(',')
  const note = unquote(noteColumns.join(','))
  return Schema.decodeUnknownOption(BannedNumberToAdd)({
    phoneNumber: unquote(phoneNumber),
    ...(note ? {note} : {}),
  })
}

/** One E.164 number per line, optionally followed by `,note`. */
export const parseBannedNumbersCsv = (csv: string): ParsedBannedNumbersCsv => {
  const [invalidRows, validNumbers] = pipe(
    csv.split(/\r?\n/),
    Array.map((content, index) => ({line: index + 1, content: content.trim()})),
    Array.filter(({content}) => content.length > 0),
    Array.partitionMap((row) =>
      Either.fromOption(parseRow(row.content), () => row)
    )
  )
  const seenPhoneNumbers = new Set<string>()
  const numbers = Array.filter(validNumbers, ({phoneNumber}) => {
    if (seenPhoneNumbers.has(phoneNumber)) return false
    seenPhoneNumbers.add(phoneNumber)
    return true
  })

  return {
    numbers,
    invalidRows,
    duplicateCount: validNumbers.length - numbers.length,
  }
}
