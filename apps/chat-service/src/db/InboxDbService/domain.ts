import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, Option, Schema} from 'effect'
import {PublicKeyHashed} from '../domain'

export const InboxRecordId = Schema.BigIntFromString.pipe(
  Schema.brand('InboxRecordId')
)
export type InboxRecordId = Schema.Schema.Type<typeof InboxRecordId>

export class InboxRecord extends Schema.Class<InboxRecord>('InboxRecord')({
  id: InboxRecordId,
  publicKey: PublicKeyHashed,
  platform: Schema.OptionFromOptional(PlatformName).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  clientVersion: Schema.OptionFromOptional(VersionCode).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
}) {}
