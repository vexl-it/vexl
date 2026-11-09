import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Effect, ParseResult, Predicate, Schema} from 'effect/index'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {ChatMessageWithState, ChatWithMessages, InboxInState} from '../domain'

// Encoding all messages on every save blocks the JS thread for long in big
// accounts. State updates are immutable, so an unchanged chat or message keeps
// its identity and its previous encoding can be reused.
function withEncodingReusedForSameValue<A, I>(
  schema: Schema.Schema<A, I>
): Schema.Schema<A, I> {
  const encodedValues = new WeakMap<object, I>()

  return Schema.declare([schema], {
    decode: (item) => (input, options) =>
      ParseResult.decodeUnknown(item)(input, options),
    encode: (item) => (input, options) => {
      const reused = Predicate.isObject(input)
        ? encodedValues.get(input)
        : undefined
      if (reused !== undefined) return ParseResult.succeed(reused)

      return ParseResult.encodeUnknown(item)(input, options).pipe(
        Effect.tap((encoded) => {
          if (Predicate.isObject(input)) encodedValues.set(input, encoded)
        })
      )
    },
  })
}

const StoredChatWithMessages = withEncodingReusedForSameValue(
  Schema.Struct({
    ...ChatWithMessages.fields,
    messages: Schema.Array(
      withEncodingReusedForSameValue(ChatMessageWithState)
    ).pipe(Schema.mutable),
  })
)

const StoredMessagingState = Schema.Array(
  Schema.Struct({
    ...InboxInState.fields,
    chats: Schema.Array(StoredChatWithMessages).pipe(Schema.mutable),
    pendingRecoveryChats: Schema.optional(Schema.Array(StoredChatWithMessages)),
  })
).pipe(Schema.mutable)

export const messagingStateAtomStorageAtom = atomWithParsedMmkvStorage(
  'messagingState',
  {messagingState: [], lastDecodedSemver: undefined},
  Schema.Struct({
    messagingState: StoredMessagingState,
    lastDecodedSemver: Schema.optionalWith(VersionString, {nullable: true}),
  })
)

const messagingStateAtom = focusAtom(messagingStateAtomStorageAtom, (o) =>
  o.prop('messagingState')
)
export default messagingStateAtom

export const inboxesAtom = focusAtom(messagingStateAtom, (optic) =>
  optic.elems().prop('inbox')
)

export const lastDecodedSemverAtom = focusAtom(
  messagingStateAtomStorageAtom,
  (o) => o.prop('lastDecodedSemver')
)
