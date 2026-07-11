import {ChatId} from '@vexl-next/domain/src/general/messaging'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Array, Option, pipe, Schema} from 'effect'

export const CHAT_TAG_NAME_MAX_LENGTH = 30

export const ChatTagId = Schema.UUID.pipe(Schema.brand('ChatTagId'))
export type ChatTagId = typeof ChatTagId.Type

export const ChatTagName = Schema.Trim.pipe(
  Schema.minLength(1),
  Schema.maxLength(CHAT_TAG_NAME_MAX_LENGTH),
  Schema.brand('ChatTagName')
)
export type ChatTagName = typeof ChatTagName.Type

export const ChatTag = Schema.Struct({
  id: ChatTagId,
  name: ChatTagName,
})
export type ChatTag = typeof ChatTag.Type

export const ChatTagAssignment = Schema.Struct({
  chatId: ChatId,
  tagIds: Schema.Array(ChatTagId),
})
export type ChatTagAssignment = typeof ChatTagAssignment.Type

export const ChatTagsState = Schema.Struct({
  tags: Schema.Array(ChatTag),
  assignments: Schema.Array(ChatTagAssignment),
})
export type ChatTagsState = typeof ChatTagsState.Type

export const emptyChatTagsState: ChatTagsState = {
  tags: [],
  assignments: [],
}

function normalizedTagName(name: string): string {
  return name.trim().toLowerCase()
}

export function decodeChatTagName(name: string): Option.Option<ChatTagName> {
  return Schema.decodeOption(ChatTagName)(name)
}

export function canCreateChatTag(state: ChatTagsState, name: string): boolean {
  return pipe(
    decodeChatTagName(name),
    Option.exists(
      (decodedName) =>
        !pipe(
          state.tags,
          Array.some(
            (tag) =>
              normalizedTagName(tag.name) === normalizedTagName(decodedName)
          )
        )
    )
  )
}

export function addChatTag(
  state: ChatTagsState,
  name: string
): readonly [ChatTagsState, Option.Option<ChatTag>] {
  if (!canCreateChatTag(state, name)) return [state, Option.none()]

  return pipe(
    decodeChatTagName(name),
    Option.match({
      onNone: (): readonly [ChatTagsState, Option.Option<ChatTag>] => [
        state,
        Option.none(),
      ],
      onSome: (decodedName) => {
        const tag: ChatTag = {
          id: Schema.decodeSync(ChatTagId)(generateUuid()),
          name: decodedName,
        }

        const result: readonly [ChatTagsState, Option.Option<ChatTag>] = [
          {...state, tags: Array.append(state.tags, tag)},
          Option.some(tag),
        ]
        return result
      },
    })
  )
}

export function deleteChatTag(
  state: ChatTagsState,
  tagId: ChatTagId
): ChatTagsState {
  return {
    tags: pipe(
      state.tags,
      Array.filter((tag) => tag.id !== tagId)
    ),
    assignments: pipe(
      state.assignments,
      Array.map((assignment) => ({
        ...assignment,
        tagIds: pipe(
          assignment.tagIds,
          Array.filter((assignedTagId) => assignedTagId !== tagId)
        ),
      })),
      Array.filter((assignment) => Array.isNonEmptyArray(assignment.tagIds))
    ),
  }
}

export function tagIdsForChat(
  state: ChatTagsState,
  chatId: ChatId
): readonly ChatTagId[] {
  return pipe(
    state.assignments,
    Array.findFirst((assignment) => assignment.chatId === chatId),
    Option.map((assignment) => assignment.tagIds),
    Option.getOrElse((): readonly ChatTagId[] => [])
  )
}

export function setTagsForChat({
  state,
  chatId,
  tagIds,
}: {
  readonly state: ChatTagsState
  readonly chatId: ChatId
  readonly tagIds: ReadonlySet<ChatTagId>
}): ChatTagsState {
  const validTagIds = pipe(
    state.tags,
    Array.map((tag) => tag.id),
    Array.filter((tagId) => tagIds.has(tagId))
  )
  const assignmentsWithoutChat = pipe(
    state.assignments,
    Array.filter((assignment) => assignment.chatId !== chatId)
  )

  return {
    ...state,
    assignments: Array.isNonEmptyArray(validTagIds)
      ? Array.append(assignmentsWithoutChat, {chatId, tagIds: validTagIds})
      : assignmentsWithoutChat,
  }
}

export function chatMatchesTagFilters({
  state,
  chatId,
  selectedTagIds,
}: {
  readonly state: ChatTagsState
  readonly chatId: ChatId
  readonly selectedTagIds: ReadonlySet<ChatTagId>
}): boolean {
  if (selectedTagIds.size === 0) return true

  return pipe(
    tagIdsForChat(state, chatId),
    Array.some((tagId) => selectedTagIds.has(tagId))
  )
}

export function tagLabelsForChat(
  state: ChatTagsState,
  chatId: ChatId
): readonly string[] {
  const assignedTagIds = new Set(tagIdsForChat(state, chatId))

  return pipe(
    state.tags,
    Array.filter((tag) => assignedTagIds.has(tag.id)),
    Array.map((tag) => tag.name)
  )
}

export function pruneChatTagAssignments(
  state: ChatTagsState,
  validChatIds: ReadonlySet<ChatId>
): ChatTagsState {
  return {
    ...state,
    assignments: pipe(
      state.assignments,
      Array.filter((assignment) => validChatIds.has(assignment.chatId))
    ),
  }
}
