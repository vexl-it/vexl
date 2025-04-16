import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {Schema} from 'effect'

export const ClubWithMembers = Schema.Struct({
  club: ClubInfo,
  members: Schema.Array(PublicKeyPemBase64E),
  isModerator: Schema.Boolean,
})
export type ClubWithMembers = typeof ClubWithMembers.Type
