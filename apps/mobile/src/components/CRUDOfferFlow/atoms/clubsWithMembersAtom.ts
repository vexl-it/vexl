import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {taskToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type ClubInfo} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Effect, Either, Option, Schema} from 'effect'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {apiAtom} from '../../../api'
import {myStoredClubsAtom} from '../../../state/contacts/atom/clubsStore'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {getNotificationToken} from '../../../utils/notifications'
import reportError from '../../../utils/reportError'
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'

export interface ClubWithMembers {
  club: ClubInfo
  members: Option.Option<PublicKeyPemBase64[]>
}

export class UserClubKeypairMissingError extends Schema.TaggedError<UserClubKeypairMissingError>(
  'UserClubKeypairMissingError'
)('UserClubKeypairMissingError', {
  status: Schema.optionalWith(Schema.Literal(404), {default: () => 404}),
  message: Schema.String,
}) {}

const clubsWithMembersStorageAtom = atom<
  Either.Either<
    ClubWithMembers[],
    | {_tag: 'clubsNotLoaded'}
    | Effect.Effect.Error<ReturnType<ContactApi['getClubInfo']>>
    | Effect.Effect.Error<ReturnType<ContactApi['getClubContacts']>>
    | UserClubKeypairMissingError
  >
>(Either.left({_tag: 'clubsNotLoaded'} as const))

export const clubsWithMembersAtom = atom(
  (get) => get(clubsWithMembersStorageAtom),
  (get, set) => {
    const {t} = get(translationAtom)

    return Effect.gen(function* (_) {
      const api = get(apiAtom)
      const myStoredClubs = get(myStoredClubsAtom)
      const myStoredClubsKeypairs = Object.values(myStoredClubs)
      const notificationToken = yield* _(
        taskToEffect(getNotificationToken()),
        Effect.map(Option.fromNullable)
      )

      const clubs = yield* _(
        myStoredClubsKeypairs,
        Array.map((keyPair) =>
          api.contact.getClubInfo({keyPair, notificationToken})
        ),
        Effect.allWith({concurrency: 'unbounded'})
      )

      const clubsMembers = yield* _(
        clubs,
        Array.map((club) => {
          const keyPair = myStoredClubs[club.clubInfoForUser.club.uuid]
          if (keyPair)
            return api.contact
              .getClubContacts({
                clubUuid: club.clubInfoForUser.club.uuid,
                keyPair,
              })
              .pipe(
                Effect.catchAll(() =>
                  Effect.succeed({
                    clubUuid: club.clubInfoForUser.club.uuid,
                    items: undefined,
                  })
                )
              )

          return Effect.fail(
            new UserClubKeypairMissingError({
              message: `Missing keypair in storage for clubUuid: ${club.clubInfoForUser.club.uuid}. This should not happen!`,
            })
          )
        }),
        Effect.allWith({concurrency: 'unbounded'})
      )

      const clubsWithMembers = clubs.map((club) => {
        const members = clubsMembers.find(
          (members) => members.clubUuid === club.clubInfoForUser.club.uuid
        )

        if (members?.items) {
          const myPubKey =
            myStoredClubs[club.clubInfoForUser.club.uuid]?.publicKeyPemBase64
          const membersFilterMe = members.items.filter(
            (item) => item === myPubKey
          )

          return {
            club: club.clubInfoForUser.club,
            members: Option.some([...membersFilterMe]),
          }
        }

        return {
          club: club.clubInfoForUser.club,
          members: Option.none(),
        }
      })

      set(clubsWithMembersStorageAtom, Either.right(clubsWithMembers))

      return Either.right(clubsWithMembers)
    }).pipe(
      Effect.catchAll((e) => {
        if (
          e._tag !== 'NetworkError' &&
          e._tag !== 'CryptoError' &&
          e._tag !== 'InvalidChallengeError' &&
          e._tag !== 'ErrorSigningChallenge'
        ) {
          reportError(
            'error',
            new Error(
              'Unknown error when getting camera access, check library'
            ),
            {e}
          )
        }

        showErrorAlert({
          title:
            toCommonErrorMessage(e, t) ?? t('clubs.errorLoadingClubMembers'),
          error: e,
        })

        return Effect.succeed(Either.left({_tag: 'clubsNotLoaded'} as const))
      })
    )
  }
)

const fetchedClubsAtom = atom((get) => {
  const clubs = get(clubsWithMembersAtom)

  if (Either.isRight(clubs)) return clubs.right

  return []
})

export const clubsWithMembersAtomsAtom = splitAtom(fetchedClubsAtom)

clubsWithMembersAtom.onMount = (setAtom) => {
  void Effect.runPromise(setAtom())
}
