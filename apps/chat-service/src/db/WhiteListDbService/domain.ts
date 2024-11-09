import {Schema} from 'effect'
import {PublicKeyHashed} from '../domain'
import {InboxRecordId} from '../InboxDbService/domain'

export const WhitelistRecordId = Schema.BigInt.pipe(
  Schema.brand('WhitelistRecordId')
)
export type WhitelistRecordId = Schema.Schema.Type<typeof WhitelistRecordId>

export const WhiteListState = Schema.Literal(
  'APPROVED',
  'DISAPPROVED',
  'BLOCKED',
  'WAITING',
  'CANCELED'
)
export type WhiteListState = Schema.Schema.Type<typeof WhiteListState>

export class WhitelistRecord extends Schema.Class<WhitelistRecord>(
  'WhitelistRecord'
)({
  id: WhitelistRecordId,
  inboxId: InboxRecordId,
  publicKey: PublicKeyHashed,
  state: WhiteListState,
  date: Schema.DateFromSelf,
}) {}
