import {Schema} from '@effect/schema'

const InboxRecordId = Schema.BigInt.pipe(Schema.brand('InboxRecordId'))

export class InboxDbService extends Schema.Class<InboxDbService>(
  'InboxDbService'
)({
  id: InboxRecordId,
  publicKey: PublicKeyHashed,
}) {}
