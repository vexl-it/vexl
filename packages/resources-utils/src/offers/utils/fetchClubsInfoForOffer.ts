import {type KeyHolder} from '@vexl-next/cryptography'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ClubKeyNotFoundInInnerStateError,
  type ClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {Array, Effect, Option, pipe} from 'effect'

export type ApiErrorFetchingClubMembersForOffer = Effect.Effect.Error<
  ReturnType<ContactApi['getClubContacts']>
>

export interface ClubIdWithMembers {
  clubUuid: ClubUuid
  items: readonly PublicKeyPemBase64[]
}

export default function fetchClubsInfoForOffer({
  intendedClubs,
  contactApi,
  myStoredClubs,
}: {
  intendedClubs: ClubUuid[]
  contactApi: ContactApi
  myStoredClubs: Record<ClubUuid, KeyHolder.PrivateKeyHolder>
}): Effect.Effect<
  ClubIdWithMembers[],
  ApiErrorFetchingClubMembersForOffer | ClubKeyNotFoundInInnerStateError
> {
  return Effect.gen(function* (_) {
    return yield* _(
      intendedClubs,
      Array.map((clubUuid) =>
        pipe(
          Option.fromNullable(myStoredClubs[clubUuid]),
          Effect.mapError(
            (e) => new ClubKeyNotFoundInInnerStateError({cause: e})
          ),
          Effect.flatMap((keyPair) =>
            contactApi.getClubContacts({keyPair, clubUuid})
          )
        )
      ),
      Effect.allWith({concurrency: 'unbounded'})
    )
  })
}
