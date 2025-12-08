import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Schema} from 'effect'
import {PublicKeyHashed} from '../domain'

export const InboxRecordId = Schema.BigInt.pipe(Schema.brand('InboxRecordId'))
export type InboxRecordId = Schema.Schema.Type<typeof InboxRecordId>

export class InboxRecord extends Schema.Class<InboxRecord>('InboxRecord')({
  id: InboxRecordId,
  publicKey: PublicKeyHashed,
  platform: Schema.optionalWith(PlatformName, {as: 'Option'}),
  clientVersion: Schema.optionalWith(VersionCode, {as: 'Option'}),
}) {}
