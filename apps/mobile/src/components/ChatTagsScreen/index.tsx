import {
  Button,
  EmptyState,
  NavigationBar,
  PlusAdd,
  Screen,
  SelectableItem,
  Stack,
  SwipeableRow,
  TextField,
  TrashBin,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {Array, Effect, pipe} from 'effect'
import {
  atom,
  useAtomValue,
  useSetAtom,
  useStore,
  type PrimitiveAtom,
} from 'jotai'
import React, {useCallback, useState} from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {
  addChatTagActionAtom,
  chatTagsAtom,
  chatTagsStateAtom,
  deleteChatTagActionAtom,
  setTagsForChatActionAtom,
} from '../../state/chatTags/atoms'
import {
  canCreateChatTag,
  CHAT_TAG_NAME_MAX_LENGTH,
  tagIdsForChat,
  type ChatTag,
  type ChatTagId,
} from '../../state/chatTags/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {globalDialogAtom} from '../GlobalDialog'

function NewTagInput({
  valueAtom,
}: {
  readonly valueAtom: PrimitiveAtom<string>
}): React.ReactElement {
  return (
    <TextField
      autoFocus
      valueAtom={valueAtom}
      maxLength={CHAT_TAG_NAME_MAX_LENGTH}
      placeholder=""
      borderColor="$accentYellowPrimary"
      backgroundColor="$backgroundPrimary"
    />
  )
}

function TagSelectionRow({
  tag,
  selected,
  onSelectedChange,
  onDelete,
}: {
  readonly tag: ChatTag
  readonly selected: boolean
  readonly onSelectedChange: () => void
  readonly onDelete: () => void
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <SwipeableRow
      rightAction={{
        icon: TrashBin,
        label: t('common.delete'),
        variant: 'destructive',
        onPress: onDelete,
      }}
    >
      <Stack backgroundColor="$backgroundPrimary">
        <SelectableItem
          px="$5"
          label={tag.name}
          selected={selected}
          onPress={onSelectedChange}
        />
      </Stack>
    </SwipeableRow>
  )
}

type Props = RootStackScreenProps<'ChatTags'>

function ChatTagsScreen({route}: Props): React.ReactElement {
  const {chatId} = route.params
  const {t} = useTranslation()
  const store = useStore()
  const safeGoBack = useSafeGoBack()
  const tags = useAtomValue(chatTagsAtom)
  const addTag = useSetAtom(addChatTagActionAtom)
  const deleteTag = useSetAtom(deleteChatTagActionAtom)
  const saveTagsForChat = useSetAtom(setTagsForChatActionAtom)
  const showDialog = useSetAtom(globalDialogAtom)
  const [selectedTagIds, setSelectedTagIds] = useState<ReadonlySet<ChatTagId>>(
    () => new Set(tagIdsForChat(store.get(chatTagsStateAtom), chatId))
  )

  const showNewTagDialog = useCallback(() => {
    const valueAtom = atom('')
    const saveDisabledAtom = atom(
      (get) => !canCreateChatTag(get(chatTagsStateAtom), get(valueAtom))
    )

    void Effect.runPromise(
      showDialog({
        title: t('messages.tags.newTag'),
        children: <NewTagInput valueAtom={valueAtom} />,
        positiveButtonText: t('common.save'),
        positiveButtonDisabledAtom: saveDisabledAtom,
        negativeButtonText: t('common.notNow'),
      })
    ).then((confirmed) => {
      if (!confirmed) return

      const addedTag = addTag(store.get(valueAtom))
      if (!addedTag) return

      setSelectedTagIds((previous) => new Set(previous).add(addedTag.id))
    })
  }, [addTag, showDialog, store, t])

  const showDeleteTagDialog = useCallback(
    (tagId: ChatTagId) => {
      void Effect.runPromise(
        showDialog({
          title: t('messages.tags.deleteTitle'),
          subtitle: t('messages.tags.deleteDescription'),
          positiveButtonText: t('messages.tags.yesDelete'),
          positiveButtonVariant: 'destructive',
          negativeButtonText: t('common.cancel'),
        })
      ).then((confirmed) => {
        if (!confirmed) return

        deleteTag(tagId)
        setSelectedTagIds(
          (previous): ReadonlySet<ChatTagId> =>
            new Set(
              pipe(
                previous,
                Array.fromIterable,
                Array.filter((selectedTagId) => selectedTagId !== tagId)
              )
            )
        )
      })
    },
    [deleteTag, showDialog, t]
  )

  return (
    <Screen
      scrollable
      noHorizontalPadding
      navigationBar={
        <NavigationBar
          style="back"
          title={t('messages.tags.title')}
          leftAction={{
            icon: PlusAdd,
            variant: 'normal',
            onPress: showNewTagDialog,
          }}
          rightActions={[
            {
              icon: XmarkCancelClose,
              variant: 'normal',
              onPress: safeGoBack,
            },
          ]}
        />
      }
      footer={
        <Button
          disabled={!Array.isNonEmptyReadonlyArray(tags)}
          onPress={() => {
            saveTagsForChat({chatId, tagIds: selectedTagIds})
            safeGoBack()
          }}
        >
          {t('common.save')}
        </Button>
      }
    >
      {Array.isNonEmptyReadonlyArray(tags) ? (
        <YStack>
          {pipe(
            tags,
            Array.map((tag) => (
              <TagSelectionRow
                key={tag.id}
                tag={tag}
                selected={selectedTagIds.has(tag.id)}
                onSelectedChange={() => {
                  setSelectedTagIds((previous) => {
                    const next = new Set(previous)
                    if (next.has(tag.id)) next.delete(tag.id)
                    else next.add(tag.id)
                    return next
                  })
                }}
                onDelete={() => {
                  showDeleteTagDialog(tag.id)
                }}
              />
            ))
          )}
        </YStack>
      ) : (
        <EmptyState
          px="$5"
          title={t('messages.tags.empty')}
          action={{
            label: t('messages.tags.addTag'),
            onPress: showNewTagDialog,
            variant: 'primary',
          }}
        />
      )}
    </Screen>
  )
}

export default ChatTagsScreen
