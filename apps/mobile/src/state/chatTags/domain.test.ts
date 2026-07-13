import {ChatId} from '@vexl-next/domain/src/general/messaging'
import {Option, Schema} from 'effect'
import {
  addChatTag,
  canCreateChatTag,
  chatMatchesTagFilters,
  ChatTagId,
  ChatTagName,
  ChatTagsState,
  deleteChatTag,
  emptyChatTagsState,
  pruneChatTagAssignments,
  setTagsForChat,
  tagIdsAssignedToChats,
  tagIdsForChat,
} from './domain'

const chatId = Schema.decodeSync(ChatId)('chat-id')
const firstTagId = Schema.decodeSync(ChatTagId)(
  '00000000-0000-4000-8000-000000000001'
)
const secondTagId = Schema.decodeSync(ChatTagId)(
  '00000000-0000-4000-8000-000000000002'
)
const firstTagName = Schema.decodeSync(ChatTagName)('wip')
const secondTagName = Schema.decodeSync(ChatTagName)('done')

const stateWithTags: ChatTagsState = {
  tags: [
    {id: firstTagId, name: firstTagName},
    {id: secondTagId, name: secondTagName},
  ],
  assignments: [],
}

describe('chat tag domain', () => {
  test('decodes an empty persisted state', () => {
    expect(Schema.decodeUnknownSync(ChatTagsState)(emptyChatTagsState)).toEqual(
      emptyChatTagsState
    )
  })

  test('rejects malformed persisted state', () => {
    expect(
      Schema.decodeUnknownOption(ChatTagsState)({
        tags: [{id: 'not-a-uuid', name: ''}],
        assignments: [],
      })
    ).toEqual(Option.none())
  })

  test('trims names, enforces length, and rejects case-insensitive duplicates', () => {
    expect(Schema.decodeSync(ChatTagName)('  wip  ')).toBe('wip')
    expect(Schema.decodeUnknownOption(ChatTagName)('x'.repeat(31))).toEqual(
      Option.none()
    )
    expect(canCreateChatTag(stateWithTags, ' WIP ')).toBe(false)
    expect(canCreateChatTag(stateWithTags, 'new')).toBe(true)
  })

  test('creates tags in creation order', () => {
    const [nextState, addedTag] = addChatTag(stateWithTags, 'new')

    expect(Option.isSome(addedTag)).toBe(true)
    expect(nextState.tags.slice(0, 2)).toEqual(stateWithTags.tags)
    expect(nextState.tags[2]?.name).toBe('new')
  })

  test('saves only valid assignments and replaces a chat draft', () => {
    const nextState = setTagsForChat({
      state: stateWithTags,
      chatId,
      tagIds: new Set([firstTagId, secondTagId]),
    })

    expect(tagIdsForChat(nextState, chatId)).toEqual([firstTagId, secondTagId])
    expect(
      tagIdsForChat(
        setTagsForChat({state: nextState, chatId, tagIds: new Set()}),
        chatId
      )
    ).toEqual([])
  })

  test('deleting a tag removes it from every chat assignment', () => {
    const assignedState = setTagsForChat({
      state: stateWithTags,
      chatId,
      tagIds: new Set([firstTagId, secondTagId]),
    })

    const nextState = deleteChatTag(assignedState, firstTagId)

    expect(nextState.tags).toEqual([{id: secondTagId, name: secondTagName}])
    expect(tagIdsForChat(nextState, chatId)).toEqual([secondTagId])
  })

  test('matches multiple selected filters with OR semantics', () => {
    const assignedState = setTagsForChat({
      state: stateWithTags,
      chatId,
      tagIds: new Set([firstTagId]),
    })

    expect(
      chatMatchesTagFilters({
        state: assignedState,
        chatId,
        selectedTagIds: new Set([firstTagId, secondTagId]),
      })
    ).toBe(true)
    expect(
      chatMatchesTagFilters({
        state: assignedState,
        chatId,
        selectedTagIds: new Set([secondTagId]),
      })
    ).toBe(false)
    expect(
      chatMatchesTagFilters({
        state: assignedState,
        chatId,
        selectedTagIds: new Set(),
      })
    ).toBe(true)
  })

  test('reports only tag ids assigned within a given set of chats', () => {
    const assignedState = setTagsForChat({
      state: stateWithTags,
      chatId,
      tagIds: new Set([firstTagId]),
    })

    expect(tagIdsAssignedToChats(assignedState, new Set([chatId]))).toEqual(
      new Set([firstTagId])
    )
    expect(tagIdsAssignedToChats(assignedState, new Set())).toEqual(new Set())
  })

  test('prunes assignments after chat data is physically removed', () => {
    const assignedState = setTagsForChat({
      state: stateWithTags,
      chatId,
      tagIds: new Set([firstTagId]),
    })

    expect(
      pruneChatTagAssignments(assignedState, new Set()).assignments
    ).toEqual([])
    expect(
      pruneChatTagAssignments(assignedState, new Set([chatId])).assignments
    ).toEqual(assignedState.assignments)
  })
})
