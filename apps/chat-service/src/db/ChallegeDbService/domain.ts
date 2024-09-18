import {Schema} from '@effect/schema'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'

export const ChallengeRecordId = Schema.BigInt.pipe(
  Schema.brand('ChallengeRecordId')
)
export type ChallengeRecordId = Schema.Schema.Type<typeof ChallengeRecordId>

export class ChallengeRecord extends Schema.Class<ChallengeRecord>(
  'ChallengeRecord'
)({
  id: ChallengeRecordId,
  challenge: Schema.String, // TODO different type probably
  publicKey: PublicKeyPemBase64E,
  createdAt: Schema.DateFromSelf,
  valid: Schema.Boolean,
}) {}
