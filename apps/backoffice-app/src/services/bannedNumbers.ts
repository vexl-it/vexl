import {toE164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  BannedNumberNote,
  BannedNumbersMonthlyLimitReachedError,
  type BannedNumberToAdd,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Either, pipe, Schema} from 'effect'
import {makeApiErrorMessage} from './apiErrorMessage'

const apiErrorMessage = makeApiErrorMessage({
  NotFoundError: 'It no longer exists. Reload the page.',
})

export const bannedNumbersErrorMessage = (error: unknown): string =>
  error instanceof BannedNumbersMonthlyLimitReachedError
    ? `Not banned. The limit of ${error.monthlyLimit} newly banned numbers per month leaves room for ${error.remainingThisMonth} more this month.`
    : apiErrorMessage(error)

/** Left holds what is wrong with the input. */
export const parseNumberToBan = (
  phoneNumber: string,
  note: string
): Either.Either<BannedNumberToAdd, string> =>
  pipe(
    toE164PhoneNumber(phoneNumber),
    Either.fromOption(
      () => 'Not a valid international number, e.g. +420800123456'
    ),
    Either.filterOrLeft(
      () => Schema.is(BannedNumberNote)(note),
      () => 'The note is longer than 500 characters'
    ),
    Either.map((validNumber) => ({
      phoneNumber: validNumber,
      ...(note ? {note} : {}),
    }))
  )

export interface SkippedCsvRow {
  readonly line: number
  readonly content: string
  readonly problem: string
}

export interface ParsedBannedNumbersCsv {
  readonly numbers: readonly BannedNumberToAdd[]
  readonly skippedRows: readonly SkippedCsvRow[]
}

const QUOTED_VALUE = /^"(.*)"$/

const unquote = (value: string): string =>
  value.trim().replace(QUOTED_VALUE, '$1').replace(/""/g, '"').trim()

const parseRow = (
  content: string
): Either.Either<BannedNumberToAdd, string> => {
  const [phoneNumber = '', ...noteColumns] = content.split(',')
  return parseNumberToBan(unquote(phoneNumber), unquote(noteColumns.join(',')))
}

/** One international number per line, optionally followed by `,note`. */
export const parseBannedNumbersCsv = (csv: string): ParsedBannedNumbersCsv => {
  const firstLineOfNumber = new Map<string, number>()
  const [skippedRows, numbers] = pipe(
    csv.split(/\r?\n/),
    Array.map((content, index) => ({line: index + 1, content: content.trim()})),
    Array.filter(({content}) => content.length > 0),
    Array.partitionMap((row) =>
      pipe(
        parseRow(row.content),
        Either.flatMap((number) => {
          const firstLine = firstLineOfNumber.get(number.phoneNumber)
          if (firstLine !== undefined)
            return Either.left(`Same number as line ${firstLine}`)
          firstLineOfNumber.set(number.phoneNumber, row.line)
          return Either.right(number)
        }),
        Either.mapLeft((problem) => ({...row, problem}))
      )
    )
  )

  return {numbers, skippedRows}
}
