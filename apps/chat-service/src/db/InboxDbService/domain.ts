import {Schema} from '@effect/schema'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformNameE} from '@vexl-next/rest-api/src/PlatformName'
import {PublicKeyHashed} from '../domain'

export const InboxRecordId = Schema.BigInt.pipe(Schema.brand('InboxRecordId'))
export type InboxRecordId = Schema.Schema.Type<typeof InboxRecordId>

export class InboxRecord extends Schema.Class<InboxRecord>('InboxRecord')({
  id: InboxRecordId,
  publicKey: PublicKeyHashed,
  platform: Schema.optionalWith(PlatformNameE, {as: 'Option'}),
  clientVersion: Schema.optionalWith(VersionCode, {as: 'Option'}),
}) {}
