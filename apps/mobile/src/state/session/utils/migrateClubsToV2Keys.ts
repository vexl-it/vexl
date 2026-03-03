import {generateV2KeyPair} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {Array, Data, Effect, Either, pipe, Struct} from 'effect/index'
import {toEntries} from 'effect/Record'
import {getDefaultStore} from 'jotai'
import {type SessionV2} from '../../../brands/Session.brand'
import {reportErrorE} from '../../../utils/reportError'
import {oldClubsKeyHolderStorageAtom} from '../../clubs/atom/clubsToKeyHolderAtom'
import {clubsToKeyHolderAtom} from '../../clubs/atom/clubsToKeyHolderV2Atom'
export class ErrorMigratingClubsToV2Keys extends Data.TaggedError(
  'ErrorMigratingClubsToV2Keys'
)<{cause: unknown; message: string}> {}

export const migrateClubsToV2Keys = (
  session: SessionV2,
  contactApi: ContactApi
): Effect.Effect<boolean> =>
  Effect.gen(function* (_) {
    const existingClubsInSession = getDefaultStore().get(
      oldClubsKeyHolderStorageAtom
    )

    const clubUuids = toEntries(existingClubsInSession.data)

    if (!Array.isNonEmptyArray(clubUuids)) {
      // No clubs to migrate, we can exit early
      return true
    }

    const migratedClubs = yield* pipe(
      clubUuids,
      Array.map(([clubUuid, oldKeypair]) =>
        Effect.gen(function* (_) {
          const keypairV2 = yield* _(generateV2KeyPair())
          yield* _(
            contactApi.setPublicKeyV2({
              clubUuid,
              keyPair: oldKeypair,
              keyPairV2: keypairV2,
            })
          )
          getDefaultStore().set(clubsToKeyHolderAtom, (prev) => ({
            ...prev,
            [clubUuid]: {
              keyPair: keypairV2,
              oldKeyPair: oldKeypair,
            },
          }))

          getDefaultStore().set(
            oldClubsKeyHolderStorageAtom,
            Struct.omit(clubUuid)
          )
        }).pipe(
          Effect.tapError((e) => reportErrorE('error', e)),
          Effect.tapError((e) =>
            Effect.sync(() => {
              console.error('Error migrating club', e)
            })
          ),
          Effect.mapError(
            (e) =>
              new ErrorMigratingClubsToV2Keys({
                cause: e,
                message: `Error migrating club ${clubUuid} to V2 keys`,
              })
          ),
          Effect.either
        )
      ),
      Effect.all
    )

    const migrationsWithErrors = pipe(
      migratedClubs,
      Array.filter(Either.isLeft)
    )

    if (Array.isNonEmptyArray(migrationsWithErrors)) {
      yield* _(
        reportErrorE(
          'warn',
          new Error(
            'Session upgraded with partial club migration failures. Login is not blocked.'
          ),
          {
            failedClubMigrations: Array.map(
              migrationsWithErrors,
              (migration) => migration.left.message
            ),
            failedClubMigrationsCount: migrationsWithErrors.length,
          }
        )
      )
      return false
    }

    return true

    // yield* ensureMissingClubV2Keys(clubUuids)
  })
