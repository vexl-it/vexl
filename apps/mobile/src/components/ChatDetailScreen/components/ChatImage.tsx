import {type ChatImageAttachment} from '@vexl-next/domain/src/general/messaging'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  ImagePhoto,
  Loader,
  Refresh,
  Stack,
  Typography,
  useTheme,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect, Fiber, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useState} from 'react'
import {Image, Pressable, StyleSheet} from 'react-native'
import {
  ensureChatImageDownloadedActionAtom,
  getChatKeys,
  getDownloadedChatImageUri,
  isChatImageGone,
} from '../../../state/chat/chatImages'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {chatMolecule} from '../atoms'

const MIN_ASPECT_RATIO = 3 / 4

type ChatImageState =
  | {type: 'loading'}
  | {type: 'loaded'; uri: UriString}
  | {type: 'failed'}
  | {type: 'unavailable'}

interface ChatImageProps {
  variant: 'message' | 'thumbnail'
  onPress?: ((uri: UriString) => void) | undefined
}

function ChatImageContent({
  state,
  variant,
  aspectRatio,
  onPress,
  onRetry,
}: ChatImageProps & {
  state: ChatImageState
  aspectRatio?: number
  onRetry?: () => void
}): React.ReactElement {
  const theme = useTheme()
  const {t} = useTranslation()
  const [loadedAspectRatio, setLoadedAspectRatio] = useState(1)
  const isThumbnail = variant === 'thumbnail'

  return (
    <Stack
      width={isThumbnail ? '$12' : '100%'}
      height={isThumbnail ? '$12' : undefined}
      aspectRatio={
        isThumbnail
          ? undefined
          : Math.max(aspectRatio ?? loadedAspectRatio, MIN_ASPECT_RATIO)
      }
      borderRadius={isThumbnail ? '$3' : '$4'}
      overflow="hidden"
      backgroundColor="$backgroundTertiary"
      alignItems="center"
      justifyContent="center"
    >
      {state.type === 'loaded' && (
        <Pressable
          style={StyleSheet.absoluteFill}
          disabled={!onPress}
          onPress={() => onPress?.(state.uri)}
        >
          <Image
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            source={{uri: state.uri}}
            onLoad={({nativeEvent: {source}}) => {
              setLoadedAspectRatio(source.width / source.height)
            }}
          />
        </Pressable>
      )}
      {state.type === 'loading' && <Loader />}
      {state.type === 'unavailable' && (
        <YStack alignItems="center" gap="$2" padding="$3">
          <ImagePhoto size={24} color={theme.foregroundSecondary.get()} />
          {!isThumbnail && (
            <Typography variant="description" color="$foregroundSecondary">
              {t('messages.imageUnavailable')}
            </Typography>
          )}
        </YStack>
      )}
      {state.type === 'failed' && (
        <Pressable onPress={onRetry}>
          <YStack alignItems="center" gap="$2" padding="$3">
            <Refresh size={24} color={theme.foregroundSecondary.get()} />
            {!isThumbnail && (
              <Typography variant="description" color="$foregroundSecondary">
                {t('common.tryAgain')}
              </Typography>
            )}
          </YStack>
        </Pressable>
      )}
    </Stack>
  )
}

function getInitialState(
  ...args: Parameters<typeof getDownloadedChatImageUri>
): ChatImageState {
  return Option.match(getDownloadedChatImageUri(...args), {
    onNone: () => ({type: 'loading'}),
    onSome: (uri) => ({type: 'loaded', uri}),
  })
}

function AttachmentImage({
  attachment,
  ...props
}: ChatImageProps & {
  attachment: ChatImageAttachment
}): React.ReactElement {
  const {chatAtom} = useMolecule(chatMolecule)
  const {inboxKey, otherSideKey} = getChatKeys(useAtomValue(chatAtom))
  const ensureDownloaded = useSetAtom(ensureChatImageDownloadedActionAtom)
  const [state, setState] = useState(() =>
    getInitialState(attachment.id, {inboxKey, otherSideKey})
  )
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const fiber = ensureDownloaded({
      attachment,
      chatKeys: {inboxKey, otherSideKey},
    }).pipe(
      Effect.match({
        onSuccess: (uri): ChatImageState => ({type: 'loaded', uri}),
        onFailure: (e): ChatImageState => ({
          type: isChatImageGone(e) ? 'unavailable' : 'failed',
        }),
      }),
      Effect.map(setState),
      Effect.runFork
    )

    return () => {
      Effect.runFork(Fiber.interrupt(fiber))
    }
  }, [attachment, inboxKey, otherSideKey, ensureDownloaded, attempt])

  const retry = useCallback(() => {
    setState({type: 'loading'})
    setAttempt((one) => one + 1)
  }, [])

  return (
    <ChatImageContent
      {...props}
      state={state}
      aspectRatio={attachment.width / attachment.height}
      onRetry={retry}
    />
  )
}

/**
 * Renders a chat image attachment, or a local image uri for messages that are
 * still being sent.
 */
export default function ChatImage({
  image,
  imageAttachment,
  imageUnavailable,
  ...props
}: ChatImageProps & {
  image?: UriString | undefined
  imageAttachment?: ChatImageAttachment | undefined
  imageUnavailable?: boolean | undefined
}): React.ReactElement | null {
  if (imageAttachment)
    return (
      <AttachmentImage
        // Recycled list cells must not keep the previous image's state.
        key={imageAttachment.id}
        {...props}
        attachment={imageAttachment}
      />
    )

  if (image)
    return (
      <ChatImageContent
        {...props}
        state={{type: 'loaded', uri: resolveLocalUri(image)}}
      />
    )

  if (imageUnavailable)
    return <ChatImageContent {...props} state={{type: 'unavailable'}} />

  return null
}
