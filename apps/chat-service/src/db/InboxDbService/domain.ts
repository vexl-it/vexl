import {Schema} from '@effect/schema'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformNameE} from '@vexl-next/rest-api/src/PlatformName'
import {PublicKeyHashed} from '../domain'

export const InboxRecordId = Schema.BigInt.pipe(Schema.brand('InboxRecordId'))
export type InboxRecordId = Schema.Schema.Type<typeof InboxRecordId>

export class InboxRecord extends Schema.Class<InboxRecord>('InboxRecord')({
  id: InboxRecordId,
  publicKey: PublicKeyHashed,
  clientVersion: VersionCode,
  platform: PlatformNameE,
}) {}

export const WhitelistRecordId = Schema.BigInt.pipe(
  Schema.brand('WhitelistRecordId')
)
export type WhitelistRecordId = Schema.Schema.Type<typeof WhitelistRecordId>

export const WhiteListState = Schema.Literal(
  'APROVED',
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
