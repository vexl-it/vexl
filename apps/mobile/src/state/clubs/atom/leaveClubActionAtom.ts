import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Effect, Option, Record, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {ignoreReportErrors} from '../../../utils/reportError'
import {
  clubsToKeyHolderAtom,
  removeClubFromKeyHolderStateActionAtom,
} from './clubsToKeyHolderAtom'
import {removeClubWithMembersFromStateActionAtom} from './clubsWithMembersAtom'
import {updateOffersWhenUserIsNoLongerInClubActionAtom} from './updateOffersWhenUserIsNoLongerInClubActionAtom'

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
      const clubKeyPair = Record.get(get(clubsToKeyHolderAtom), clubUuid)
      const {contact} = get(apiAtom)

      if (Option.isSome(clubKeyPair)) {
        yield* _(contact.leaveClub({clubUuid, keyPair: clubKeyPair.value}))
      }

      yield* _(
        set(updateOffersWhenUserIsNoLongerInClubActionAtom, {clubUuid}),
        ignoreReportErrors(
          'warn',
          'Error updaing offers when user left the club '
        )
      )
      set(removeClubFromKeyHolderStateActionAtom, clubUuid)
      set(removeClubWithMembersFromStateActionAtom, clubUuid)
    })
  }
)
