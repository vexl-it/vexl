import {Schema} from 'effect'
import {generateUuid} from '../utility/Uuid.brand'

/**
 * Random per-login nonce stored on the contact-service user row. Rotated on
 * every login and restore so a device whose nonce no longer matches knows the
 * account is now active on another device.
 */
export const LoginSessionId = Schema.UUID.pipe(Schema.brand('LoginSessionId'))
export type LoginSessionId = typeof LoginSessionId.Type

export function generateLoginSessionId(): LoginSessionId {
  return Schema.decodeSync(LoginSessionId)(generateUuid())
}
