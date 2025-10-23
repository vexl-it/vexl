import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Challenge} from '@vexl-next/rest-api/src/challenges/contracts'
import {Schema} from 'effect'

export const ChallengeRecordId = Schema.BigInt.pipe(
  Schema.brand('ChallengeRecordId')
)
export type ChallengeRecordId = Schema.Schema.Type<typeof ChallengeRecordId>

export class ChallengeRecord extends Schema.Class<ChallengeRecord>(
  'ChallengeRecord'
)({
  id: ChallengeRecordId,
  challenge: Challenge,
  publicKey: PublicKeyPemBase64E,
  createdAt: Schema.DateFromSelf,
  valid: Schema.Boolean,
}) {}
