import {
  type MyNoteInState,
  newNoteId,
} from '@vexl-next/domain/src/general/notes'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import createNewNoteForMyContacts from '@vexl-next/resources-utils/src/notes/createNewNoteForMyContacts'
import {Effect, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {version} from '../../../utils/environment'
import reportError from '../../../utils/reportError'
import {upsertInboxOnBeAndLocallyActionAtom} from '../../chat/hooks/useCreateInbox'
import {ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom} from '../../contacts/atom/ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom'
import {generateAndRegisterVexlTokenActionAtom} from '../../notifications/actions/generateVexlTokenActionAtom'
import {sessionDataOrDummyAtom} from '../../session'
import {notesAtom} from './notesState'

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000

export const createNoteActionAtom = atom(
  null,
  (
    get,
    set,
    {
      text,
      allowRepost,
      expiresAfterDays,
    }: {text: string; allowRepost: boolean; expiresAfterDays: number}
  ) =>
    Effect.gen(function* (_) {
      const api = get(apiAtom)
      const session = get(sessionDataOrDummyAtom)

      const noteId = newNoteId()

      // The note keypair is the note's chat inbox. Its public key is what
      // responders encrypt chat requests to.
      const {inbox} = yield* _(
        set(upsertInboxOnBeAndLocallyActionAtom, {for: 'myNote', noteId})
      )

      const vexlNotificationToken = yield* _(
        set(generateAndRegisterVexlTokenActionAtom, {
          keyHolder: inbox.privateKey,
        })
      )

      const serverToClientHashesToHashedPhoneNumbersMap = yield* _(
        set(ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom)
      )

      const expiresAt = Schema.decodeSync(UnixMilliseconds)(
        Date.now() + expiresAfterDays * MILLISECONDS_IN_DAY
      )

      const createNoteResult = yield* _(
        createNewNoteForMyContacts({
          offerApi: api.offer,
          contactApi: api.contact,
          noteId,
          expiresAt,
          publicPart: {
            notePublicKey: inbox.privateKey.publicKeyPemBase64,
            text,
            allowRepost,
            vexlNotificationToken,
            authorClientVersion: version,
          },
          ownerKeyPair: session.privateKey,
          ownerKeyPairV2: session.keyPairV2,
          serverToClientHashesToHashedPhoneNumbersMap,
        })
      )

      if (createNoteResult.encryptionErrors.length > 0) {
        reportError('error', new Error('Error while encrypting note'), {
          errors: createNoteResult.encryptionErrors,
        })
      }

      const createdNote: MyNoteInState = {
        ownershipInfo: {adminId: createNoteResult.adminId},
        flags: {reported: false},
        noteInfo: createNoteResult.noteInfo,
      }

      set(notesAtom, (old) => [...old, createdNote])

      return createdNote
    })
)
