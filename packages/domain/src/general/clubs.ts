import {Schema} from 'effect'
import {randomUUID} from 'node:crypto'

export const ClubUuid = Schema.UUID.pipe(Schema.brand('ClubUuid'))
export type ClubUuid = Schema.Schema.Type<typeof ClubUuid>
export const generateClubUuid = (): ClubUuid =>
  Schema.decodeSync(ClubUuid)(randomUUID())
