import {z} from 'zod'
import {
  PrivateKeyHolder,
  PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {UserCredentials} from '../../utils/auth'
import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import * as E from 'fp-ts/Either'
import {readFile, saveFile} from '../../utils/fs'
import {parseJson, safeParse, stringifyToPrettyJson} from '../../utils/parsing'
import {pipe} from 'fp-ts/function'
import {ChatMessage} from '@vexl-next/domain/dist/general/messaging'
import * as Op from 'optics-ts'
import {type Uuid} from '@vexl-next/domain/dist/utility/Uuid.brand'

const SavedInbox = z.object({
  keypair: PrivateKeyHolder,
  ownerCredentials: UserCredentials,
  chats: z.array(
    z.object({
      publicKey: PublicKeyPemBase64,
      messages: z.array(ChatMessage),
    })
  ),
})
export type SavedInbox = z.TypeOf<typeof SavedInbox>

export interface ErrorSavingInboxFile {
  readonly type: 'ErrorSavingInboxFile'
  readonly e: unknown
}

export function saveInboxToFile(
  path: PathString
): (inbox: SavedInbox) => E.Either<ErrorSavingInboxFile, void> {
  return (inbox: SavedInbox) =>
    pipe(
      stringifyToPrettyJson(inbox),
      E.chainW(saveFile(path)),
      E.mapLeft((e) => ({type: 'ErrorSavingInboxFile', e} as const))
    )
}

export interface ErrorReadingInboxFile {
  readonly type: 'ErrorReadingInboxFile'
  e: unknown
}

export function readInboxFromFile(
  path: PathString
): E.Either<ErrorReadingInboxFile, SavedInbox> {
  return pipe(
    readFile(path),
    E.chainW(parseJson),
    E.chainW(safeParse(SavedInbox)),
    E.mapLeft((e) => ({type: 'ErrorReadingInboxFile', e} as const))
  )
}

function chatLens(key: PublicKeyPemBase64) {
  return Op.optic<SavedInbox>()
    .prop('chats')
    .find((one) => one.publicKey === key)
}

function oneMessageLens(key: PublicKeyPemBase64) {
  return (uuid: Uuid) =>
    chatLens(key)
      .prop('messages')
      .find((one) => one.uuid === uuid)
}

const newChatLens = Op.optic<SavedInbox>().prop('chats').appendTo()

export function createChat({
  inboxFile,
  otherSidePublicKey,
}: {
  inboxFile: PathString
  otherSidePublicKey: PublicKeyPemBase64
}) {
  return (message: ChatMessage) =>
    pipe(
      readInboxFromFile(inboxFile),
      E.map(
        Op.set(newChatLens)({
          publicKey: otherSidePublicKey,
          messages: [message],
        })
      ),
      E.chainW(saveInboxToFile(inboxFile)),
      E.mapLeft(
        (e) =>
          ({
            type: 'ErrorSavingInboxFile',
            e,
          } as const)
      )
    )
}

export function addMessageToChat({
  inboxFile,
  otherSidePublicKey,
}: {
  inboxFile: PathString
  otherSidePublicKey: PublicKeyPemBase64
}) {
  return (message: ChatMessage) =>
    pipe(
      readInboxFromFile(inboxFile),
      E.map((inbox) => {
        const existingMessageLens = oneMessageLens(otherSidePublicKey)(
          message.uuid
        )

        if (Op.preview(existingMessageLens)(inbox)) {
          return Op.set(existingMessageLens)(message)(inbox)
        }

        const existingChatLens = chatLens(otherSidePublicKey)

        if (Op.preview(existingChatLens)(inbox)) {
          return Op.set(existingChatLens.prop('messages').appendTo())(message)(
            inbox
          )
        }

        return Op.set(newChatLens)({
          publicKey: otherSidePublicKey,
          messages: [message],
        })(inbox)
      }),
      E.chainW((a) => saveInboxToFile(inboxFile)(a)),
      E.mapLeft(
        (e) =>
          ({
            type: 'ErrorSavingInboxFile',
            e,
          } as const)
      )
    )
}
