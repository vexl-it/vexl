import {Array, Option, Schema, pipe} from 'effect'
import {Expo, type ExpoPushMessage} from 'expo-server-sdk'
import {type DatabaseSync} from 'node:sqlite'
import {setTimeout} from 'node:timers/promises'
import {countRecipients, transaction} from './database.ts'
import {describeError, fail, jsonResponse} from './errors.ts'

const Recipient = Schema.Struct({
  user_id: Schema.String,
  expo_token: Schema.String,
})
const ErrorResult = Schema.Struct({
  status: Schema.Literal('error'),
  message: Schema.String,
})
const Ticket = Schema.Union(
  Schema.Struct({status: Schema.Literal('ok'), id: Schema.NonEmptyString}),
  ErrorResult
)
const Receipt = Schema.Union(
  Schema.Struct({status: Schema.Literal('ok')}),
  ErrorResult
)
const ReceiptTarget = Schema.Struct({
  user_id: Schema.String,
  receipt_id: Schema.String,
})

export interface SendOptions {
  title: string
  body: string
  chunkSize: number
}

export function validateSend(options: SendOptions): void {
  if (!options.title.trim() || !options.body.trim())
    fail('Title and body must not be empty.')
  if (!Number.isSafeInteger(options.chunkSize) || options.chunkSize <= 0) {
    fail('Chunk size must be a positive safe integer.')
  }
}

export function preview(
  db: DatabaseSync,
  options: SendOptions
): {pending: number; selected: number; title: string; body: string} {
  validateSend(options)
  const pending = countRecipients(db, true)
  return {
    pending,
    selected: Math.min(pending, options.chunkSize),
    title: options.title,
    body: options.body,
  }
}

export async function send(
  db: DatabaseSync,
  expo: Expo,
  accessToken: string,
  options: SendOptions,
  report: (message: string) => void = console.log
): Promise<{attempted: number; accepted: number; error: number}> {
  validateSend(options)
  const totals = {attempted: 0, accepted: 0, error: 0}
  const select = db.prepare(
    'SELECT user_id, expo_token FROM recipients WHERE attempted_at IS NULL ORDER BY user_id LIMIT ?'
  )
  const claim =
    db.prepare(`UPDATE recipients SET attempted_at = ?, title = ?, body = ?,
    send_status = 'unknown', send_response_json = ? WHERE user_id = ? AND attempted_at IS NULL`)
  const save = db.prepare(
    'UPDATE recipients SET send_status = ?, send_response_json = ?, receipt_id = ? WHERE user_id = ?'
  )
  while (totals.attempted < options.chunkSize) {
    const rows = Schema.decodeUnknownSync(Schema.Array(Recipient))(
      select.all(
        Math.min(
          Expo.pushNotificationChunkSizeLimit,
          options.chunkSize - totals.attempted
        )
      )
    )
    if (!Array.isNonEmptyReadonlyArray(rows)) break
    const messages: ExpoPushMessage[] = pipe(
      rows,
      Array.map((row) => ({
        to: row.expo_token,
        title: options.title,
        body: options.body,
        sound: 'default',
        priority: 'high',
      }))
    )
    const attemptedAt = new Date().toISOString()
    transaction(db, () => {
      for (const row of rows) {
        claim.run(
          attemptedAt,
          options.title,
          options.body,
          JSON.stringify({
            kind: 'unknown',
            message: 'Attempt started; no final Expo response was saved.',
          }),
          row.user_id
        )
      }
    })
    totals.attempted += rows.length
    let raw: unknown
    let tickets: Array<typeof Ticket.Type>
    try {
      raw = await expo.sendPushNotificationsAsync(messages)
      tickets = Schema.decodeUnknownSync(Schema.mutable(Schema.Array(Ticket)))(
        raw
      )
      if (tickets.length !== rows.length)
        fail('Expo returned an unexpected number of tickets.')
    } catch (error) {
      const details = describeError(error)
      const rejected =
        details.statusCode !== undefined &&
        details.statusCode >= 400 &&
        details.statusCode < 500
      const sendStatus = rejected ? 'error' : 'unknown'
      const response = jsonResponse(
        {kind: 'request_error', ...details, response: raw},
        accessToken
      )
      transaction(db, () => {
        for (const row of rows)
          save.run(sendStatus, response, null, row.user_id)
      })
      fail(
        `Expo request failed; ${rows.length} records saved as ${sendStatus}. Stopped after ${totals.attempted} attempts; later batches remain pending. Inspect send_response_json in SQLite.`
      )
    }
    const rawTickets = Schema.decodeUnknownSync(Schema.Array(Schema.Unknown))(
      raw
    )
    transaction(db, () => {
      for (const [index, row] of rows.entries()) {
        const ticket = tickets[index]
        if (!ticket) fail('Missing Expo ticket.')
        save.run(
          ticket.status === 'ok' ? 'accepted' : 'error',
          jsonResponse(rawTickets[index], accessToken),
          ticket.status === 'ok' ? ticket.id : null,
          row.user_id
        )
        if (ticket.status === 'ok') totals.accepted++
        else totals.error++
      }
    })
    report(
      `Attempted ${totals.attempted}; accepted ${totals.accepted}; recipient errors ${totals.error}.`
    )
    if (totals.attempted < options.chunkSize && countRecipients(db, true) > 0)
      await setTimeout(1000)
  }
  return totals
}

export async function receipts(
  db: DatabaseSync,
  expo: Expo,
  accessToken: string,
  report: (message: string) => void = console.log
): Promise<{
  checked: number
  ok: number
  error: number
  missing: number
  lookupFailed: number
}> {
  const totals = {checked: 0, ok: 0, error: 0, missing: 0, lookupFailed: 0}
  let afterUserId = ''
  const select =
    db.prepare(`SELECT user_id, receipt_id FROM recipients WHERE receipt_id IS NOT NULL
    AND (receipt_status IS NULL OR receipt_status NOT IN ('ok', 'error'))
    AND user_id > ? ORDER BY user_id LIMIT ?`)
  const save = db.prepare(
    'UPDATE recipients SET receipt_status = ?, receipt_response_json = ?, receipt_checked_at = ? WHERE user_id = ?'
  )
  while (true) {
    const rows = Schema.decodeUnknownSync(Schema.Array(ReceiptTarget))(
      select.all(afterUserId, Expo.pushNotificationReceiptChunkSizeLimit)
    )
    if (!Array.isNonEmptyReadonlyArray(rows)) break
    afterUserId = rows[rows.length - 1]?.user_id ?? afterUserId
    let response: Record<string, unknown>
    try {
      response = Schema.decodeUnknownSync(
        Schema.Record({key: Schema.String, value: Schema.Unknown})
      )(
        await expo.getPushNotificationReceiptsAsync(
          pipe(
            rows,
            Array.map((row) => row.receipt_id)
          )
        )
      )
    } catch (error) {
      transaction(db, () => {
        for (const row of rows)
          save.run(
            'lookup_failed',
            jsonResponse(describeError(error), accessToken),
            new Date().toISOString(),
            row.user_id
          )
      })
      fail(
        'Receipt lookup failed. Saved lookup errors; unresolved receipts can be checked again.'
      )
    }
    const checkedAt = new Date().toISOString()
    transaction(db, () => {
      for (const row of rows) {
        const raw = response[row.receipt_id]
        if (raw === undefined) {
          save.run('missing', null, checkedAt, row.user_id)
          totals.missing++
        } else {
          const decoded = Schema.decodeUnknownOption(Receipt)(raw)
          if (Option.isNone(decoded)) {
            save.run(
              'lookup_failed',
              jsonResponse(raw, accessToken),
              checkedAt,
              row.user_id
            )
            totals.lookupFailed++
          } else {
            save.run(
              decoded.value.status,
              jsonResponse(raw, accessToken),
              checkedAt,
              row.user_id
            )
            if (decoded.value.status === 'ok') totals.ok++
            else totals.error++
          }
        }
        totals.checked++
      }
    })
    report(
      `Receipts checked ${totals.checked}; ok ${totals.ok}; errors ${totals.error}; missing ${totals.missing}.`
    )
    if (totals.lookupFailed > 0)
      fail(
        'Expo returned malformed receipts. Saved responses; unresolved receipts can be checked again.'
      )
  }
  return totals
}
