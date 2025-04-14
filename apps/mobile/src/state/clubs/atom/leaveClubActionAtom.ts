import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Effect, Record, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {myStoredClubsAtom} from './clubsStore'
import {processClubRemovedFromBeActionAtom} from './processClubRemovedFromBeActionAtom'

export class ClubNotFoundInInnerStateError extends Schema.TaggedError<ClubNotFoundInInnerStateError>(
  'ClubNotFoundInInnerStateError'
)('ClubNotFoundInInnerStateError', {
  cause: Schema.Unknown,
}) {}

export class ClubKeyNotFoundInInnerStateError extends Schema.TaggedError<ClubKeyNotFoundInInnerStateError>(
  'ClubKeyNotFoundInInnerStateError'
)('ClubKeyNotFoundInInnerStateError', {
  cause: Schema.Unknown,
}) {}

export const leaveClubActionAtom = atom(
  null,
  (get, set, clubUuid: ClubUuid) => {
    return Effect.gen(function* (_) {
      const clubKeyPair = yield* _(Record.get(get(myStoredClubsAtom), clubUuid))
      const {contact} = get(apiAtom)

      yield* _(contact.leaveClub({clubUuid, keyPair: clubKeyPair}))

      yield* _(
        set(processClubRemovedFromBeActionAtom, {
          clubUuid,
          keyPair: clubKeyPair,
        })
      )
    })
  }
)
