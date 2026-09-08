import {
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {isPublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {
  NotFoundError,
  type UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {Effect} from 'effect'
import {ClubMembersDbService} from '../db/ClubMemberDbService'
import {type ClubMemberRecord} from '../db/ClubMemberDbService/domain'

export const findClubMemberByPublicKeyV1OrV2 = (
  publicKey: PublicKeyPemBase64 | PublicKeyV2
): Effect.Effect<
  ClubMemberRecord,
  UnexpectedServerError | NotFoundError,
  ClubMembersDbService
> =>
  Effect.gen(function* () {
    const clubMembersDb = yield* ClubMembersDbService
    if (isPublicKeyV2(publicKey)) {
      return yield* clubMembersDb.findClubMemberByPublicKeyV2({
        publicKeyV2: publicKey,
      })
    } else {
      return yield* clubMembersDb.findClubMemberByPublicKey({publicKey})
    }
  }).pipe(
    Effect.flatMap(Effect.fromOption),
    Effect.catchTag(
      'NoSuchElementError',
      () => new NotFoundError({message: 'Club member not found'})
    )
  )
