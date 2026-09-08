import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type NoteAdminId,
  type NoteRepostId,
} from '@vexl-next/domain/src/general/notes'
import {aesEncrpytE} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, pipe, Schema, type Config} from 'effect'
import {easKey} from '../configs'
import {NoteAdminIdHashed, NoteRepostIdHashed} from '../db/NoteDbService/domain'

const brandNoteAdminIdHashed = Schema.decodeSync(NoteAdminIdHashed)
const brandNoteRepostIdHashed = Schema.decodeSync(NoteRepostIdHashed)

const deterministicEncrypt = (
  value: string
): Effect.Effect<
  string,
  UnexpectedServerError | Config.ConfigError,
  ServerCrypto
> =>
  Effect.gen(function* () {
    const key = yield* easKey
    const encrypt = aesEncrpytE(key, true)

    return yield* pipe(
      encrypt(value),
      Effect.catch((e) =>
        Effect.andThen(
          Effect.logError(
            'Error while deterministically encrypting note id',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      )
    )
  })

export const hashNoteAdminId = (
  adminId: NoteAdminId
): Effect.Effect<
  NoteAdminIdHashed,
  UnexpectedServerError | Config.ConfigError,
  ServerCrypto
> => deterministicEncrypt(adminId).pipe(Effect.map(brandNoteAdminIdHashed))

export const hashNoteRepostId = (
  repostId: NoteRepostId
): Effect.Effect<
  NoteRepostIdHashed,
  UnexpectedServerError | Config.ConfigError,
  ServerCrypto
> => deterministicEncrypt(repostId).pipe(Effect.map(brandNoteRepostIdHashed))
