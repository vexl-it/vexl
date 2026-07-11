import {
  Button,
  Input,
  NavigationBar,
  PlusAdd,
  Screen,
  SelectableItem,
  Stack,
  Typography,
  useTheme,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {Array, Effect, pipe} from 'effect'
import {
  atom,
  useAtom,
  useAtomValue,
  useSetAtom,
  useStore,
  type PrimitiveAtom,
} from 'jotai'
import React, {useCallback, useRef, useState} from 'react'
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
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
import ChatListItemRightSwipeActions from '../InsideRouter/components/MessagesScreen/components/ChatListItemRightSwipeActions'

function NewTagInput({
  valueAtom,
}: {
  readonly valueAtom: PrimitiveAtom<string>
}): React.ReactElement {
  const [value, setValue] = useAtom(valueAtom)
  const theme = useTheme()

  return (
    <Stack
      minHeight="$11"
      borderRadius="$5"
      borderWidth={1}
      borderColor="$accentYellowPrimary"
      backgroundColor="$backgroundPrimary"
      px="$5"
      jc="center"
    >
      <Input
        unstyled
        autoFocus
        value={value}
        maxLength={CHAT_TAG_NAME_MAX_LENGTH}
        color="$foregroundPrimary"
        fontFamily="$body"
        fontSize="$4"
        fontWeight="500"
        selectionColor={theme.accentYellowPrimary.get()}
        onChangeText={setValue}
      />
    </Stack>
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
  const swipeableRef = useRef<SwipeableMethods>(null)

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={() => (
        <ChatListItemRightSwipeActions
          onPress={() => {
            swipeableRef.current?.close()
            onDelete()
          }}
        />
      )}
    >
      <Stack backgroundColor="$backgroundPrimary">
        <SelectableItem
          px="$5"
          label={tag.name}
          selected={selected}
          onPress={onSelectedChange}
        />
      </Stack>
    </Swipeable>
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
        <YStack px="$5" pt="$8" gap="$6" ai="center">
          <Typography
            color="$foregroundPrimary"
            variant="heading2"
            textAlign="center"
          >
            {t('messages.tags.empty')}
          </Typography>
          <Button size="small" width="100%" onPress={showNewTagDialog}>
            {t('messages.tags.addTag')}
          </Button>
        </YStack>
      )}
    </Screen>
  )
}

export default ChatTagsScreen
