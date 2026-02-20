import {
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {isPublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {
  NotFoundError,
  type UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {Effect} from 'effect/index'
import {ClubMembersDbService} from '../db/ClubMemberDbService'
import {type ClubMemberRecord} from '../db/ClubMemberDbService/domain'

export const findClubMemberByPublicKeyV1OrV2 = (
  publicKey: PublicKeyPemBase64 | PublicKeyV2
): Effect.Effect<
  ClubMemberRecord,
  UnexpectedServerError | NotFoundError,
  ClubMembersDbService
> =>
  Effect.gen(function* (_) {
    const clubMembersDb = yield* _(ClubMembersDbService)
    if (isPublicKeyV2(publicKey)) {
      return yield* _(
        clubMembersDb.findClubMemberByPublicKeyV2({publicKeyV2: publicKey})
      )
    } else {
      return yield* _(clubMembersDb.findClubMemberByPublicKey({publicKey}))
    }
  }).pipe(
    Effect.flatten,
    Effect.catchTag(
      'NoSuchElementException',
      () => new NotFoundError({message: 'Club member not found'})
    )
  )
