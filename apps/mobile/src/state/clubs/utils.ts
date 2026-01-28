import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {Effect, HashSet, Schema, type Option} from 'effect'
import reportError from '../../utils/reportError'
import {type ClubWithMembers} from './domain'

export class ClubNotFoundError extends Schema.TaggedError<ClubNotFoundError>(
  'ClubNotFoundError'
)('ClubNotFoundError', {
  cause: Schema.Union(NotFoundError),
}) {}

export class FetchingClubError extends Schema.TaggedError<FetchingClubError>(
  'FetchingClubError'
)('FetchingClubError', {
  cause: Schema.Unknown,
}) {}

export const fetchClubWithMembersReportApiErrors = ({
  keyPair,
  contactApi,
  notificationToken,
  vexlNotificationToken,
}: {
  keyPair: PrivateKeyHolder
  contactApi: ContactApi
  notificationToken: Option.Option<ExpoNotificationToken>
  vexlNotificationToken: Option.Option<VexlNotificationToken>
}): Effect.Effect<
  ClubWithMembers,
  ClubNotFoundError | FetchingClubError,
  never
> =>
  Effect.gen(function* (_) {
    const clubInfo = yield* _(
      contactApi
        .getClubInfo({keyPair, notificationToken, vexlNotificationToken})
        .pipe(
          Effect.catchTag('NotFoundError', (e) => {
            return Effect.fail({_tag: 'clubDoesNotExist', e})
          })
        )
    )

    const clubMembers = yield* _(
      contactApi.getClubContacts({
        clubUuid: clubInfo.clubInfoForUser.club.uuid,
        keyPair,
      })
    )

    return {
      club: clubInfo.clubInfoForUser.club,
      members: clubMembers.items,
      isModerator: clubInfo.clubInfoForUser.isModerator,
      vexlNotificationToken: clubInfo.clubInfoForUser.vexlNotificationToken,
      stats: {
        allOffersIdsForClub: HashSet.empty(),
        allChatsIdsForClub: HashSet.empty(),
      },
    }
  }).pipe(
    Effect.mapError((e) => {
      if (e._tag === 'clubDoesNotExist') {
        return new ClubNotFoundError({cause: e.e})
      }

      if (
        e._tag !== 'NetworkError' &&
        e._tag !== 'CryptoError' &&
        e._tag !== 'InvalidChallengeError' &&
        e._tag !== 'ErrorSigningChallenge'
      ) {
        reportError(
          'error',
          new Error('Error when fetching club with members'),
          {e}
        )
      }

      return new FetchingClubError({cause: e})
    })
  )
