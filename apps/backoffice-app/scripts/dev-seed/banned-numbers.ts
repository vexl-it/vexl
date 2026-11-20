import {
  AddBannedNumbersRequest,
  AddBannedNumbersResponse,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Order, pipe, Schema} from 'effect'
import {ADMIN_TOKEN_HEADERS, CONTACT_INTERNAL_URL, psql} from './shared'

const numbersInRange = (prefix: string, count: number): string[] =>
  Array.makeBy(count, (index) => `${prefix}${String(index).padStart(2, '0')}`)

// Only ranges that regulators reserve for fiction (Ofcom drama numbers, NANP
// 555-01xx, ACMA), so a seeded number can never be somebody's real line.
const PHONE_NUMBERS = pipe(
  [
    ...numbersInRange('+4480815700', 40),
    ...numbersInRange('+4420794600', 30),
    ...numbersInRange('+120255501', 25),
    ...numbersInRange('+141555501', 20),
    ...numbersInRange('+612555001', 16),
  ],
  // Mixes the ranges, so every page of the list shows several prefixes.
  Array.sortBy(
    Order.mapInput(Order.string, (number) => number.slice(-1)),
    Order.mapInput(Order.string, (number) => number.slice(-2))
  )
)

const NOTES: ReadonlyArray<string | undefined> = [
  'Example Bank helpline',
  'Acme Telecom customer support',
  undefined,
  'Globex Courier parcel tracking line',
  'Initech Insurance claims',
  'Taxi dispatch (fictional city cabs)',
  'Hooli Energy, outage reports',
  undefined,
  'Pizza delivery "Mario & Luigi"',
  'Town hall switchboard',
  'Umbrella Pharmacy order pickup',
  'Reported by several users as a shared contact that connects strangers. It is the general information line of a large fictional carrier, which most of its customers keep in their contacts, so it was banned after a manual check of the public directory and of the carrier website.',
  'Stark Airlines lost baggage',
  'Bank card blocking, 24/7',
  'Roadside assistance',
  undefined,
  'Wayne Clinic reception',
]

const OLDEST_BAN_DAYS_AGO = 430

const postNumbers = async (): Promise<AddBannedNumbersResponse> => {
  const body = Schema.decodeUnknownSync(AddBannedNumbersRequest)({
    numbers: Array.map(PHONE_NUMBERS, (phoneNumber, index) => ({
      phoneNumber,
      note: NOTES[index % NOTES.length],
    })),
  })
  const response = await fetch(
    `${CONTACT_INTERNAL_URL}/api/v1/banned-numbers/admin`,
    {
      method: 'POST',
      headers: {...ADMIN_TOKEN_HEADERS, 'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    }
  )
  if (!response.ok) {
    throw new Error(`${response.status}: ${await response.text()}`)
  }
  return Schema.decodeUnknownSync(AddBannedNumbersResponse)(
    await response.json()
  )
}

// Ban dates cannot be set through the API. Later numbers get later dates, like
// rows banned one after another, and most land before this month, which keeps
// the monthly ban limit nearly untouched.
const backdate = (): void => {
  const lastIndex = PHONE_NUMBERS.length - 1
  const rows = Array.map(PHONE_NUMBERS, (phoneNumber, index) => {
    const remaining = lastIndex - index
    const daysAgo = Math.floor(
      OLDEST_BAN_DAYS_AGO * (remaining / lastIndex) ** 2
    )
    return `('${phoneNumber}', ${daysAgo}, ${remaining * 7})`
  })
  psql(
    'contact',
    `
      UPDATE banned_number
      SET created_at = now() - make_interval(days => seed.days_ago, mins => seed.minutes_ago)
      FROM (VALUES ${rows.join(', ')}) AS seed (phone_number, days_ago, minutes_ago)
      WHERE banned_number.phone_number = seed.phone_number;
    `
  )
}

const main = async (): Promise<void> => {
  const {addedCount, alreadyBannedCount} = await postNumbers()
  backdate()
  console.log(
    `Banned numbers: ${addedCount} added, ${alreadyBannedCount} already there.`
  )
}

void main()
