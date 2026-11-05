import {Array} from 'effect'
import React from 'react'
import {Linking} from 'react-native'
import Autolink from 'react-native-autolink'

import {Image, Stack, XStack, YStack} from '../primitives'
import {DotTypingIndicator} from './DotTypingIndicator'
import {ReplyPreview} from './ReplyPreview'
import {Typography} from './Typography'

const IMAGE_HEIGHT = 300
const HEADER_IMAGE_HEIGHT = 50

export interface ChatBubbleHeader {
  readonly label: string
  readonly text?: string
  readonly imageUri?: string
}

export interface ChatBubbleProps {
  readonly text: string
  readonly isMine: boolean
  /** Quoted reply or a note such as "Requested with:", shown above the text. */
  readonly header?: ChatBubbleHeader
  readonly imageUri?: string
  readonly onImagePress?: () => void
  /** One emoji per reaction; repeated emojis are shown once with a count. */
  readonly reactions?: readonly string[]
}

function ReactionsChip({
  reactions,
  isMine,
}: {
  readonly reactions: readonly string[]
  readonly isMine: boolean
}): React.JSX.Element {
  const emojis = Array.dedupe(reactions)
  const count =
    reactions.length > emojis.length ? ` ${String(reactions.length)}` : ''

  return (
    <XStack
      position="absolute"
      bottom={0}
      left={isMine ? '$3' : undefined}
      right={isMine ? undefined : '$3'}
      gap="$1"
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$5"
      borderWidth="$0.5"
      borderColor="$backgroundSecondary"
      backgroundColor="$backgroundOnBar"
    >
      <Typography variant="description" color="$foregroundPrimary">
        {emojis.join('')}
        {count}
      </Typography>
    </XStack>
  )
}

export function ChatBubble({
  text,
  isMine,
  header,
  imageUri,
  onImagePress,
  reactions = [],
}: ChatBubbleProps): React.JSX.Element {
  const hasReactions = Array.isNonEmptyReadonlyArray(reactions)
  const textTopRadius = header ? '$2' : '$6'
  const textColor = isMine ? '$black100' : '$foregroundPrimary'

  return (
    <Stack paddingBottom={hasReactions ? '$5' : undefined}>
      {header ? (
        <ReplyPreview
          label={header.label}
          text={header.text}
          image={
            header.imageUri ? (
              <Image
                source={{uri: header.imageUri}}
                width="100%"
                height={HEADER_IMAGE_HEIGHT}
                objectFit="contain"
              />
            ) : undefined
          }
          marginBottom="$0.5"
          padding="$4"
          paddingBottom="$3"
          borderTopLeftRadius="$5"
          borderTopRightRadius="$5"
          borderBottomLeftRadius="$2"
          borderBottomRightRadius="$2"
          backgroundColor={
            isMine ? '$accentYellowSecondary' : '$backgroundSecondary'
          }
        />
      ) : null}
      {imageUri ? (
        <YStack
          borderRadius="$4"
          padding="$3"
          marginBottom="$2"
          backgroundColor="$backgroundTertiary"
          onPress={onImagePress}
        >
          <Image
            source={{uri: imageUri}}
            width="100%"
            height={IMAGE_HEIGHT}
            objectFit="contain"
          />
        </YStack>
      ) : null}
      <Stack
        borderRadius="$6"
        borderTopLeftRadius={textTopRadius}
        borderTopRightRadius={textTopRadius}
        backgroundColor={
          isMine ? '$accentYellowPrimary' : '$backgroundTertiary'
        }
        padding="$4"
      >
        <Autolink
          text={text}
          url
          component={Typography}
          variant="paragraph"
          color={textColor}
          renderText={(segment, index) => (
            <Typography key={index} variant="paragraph" color={textColor}>
              {segment}
            </Typography>
          )}
          renderLink={(segment, match, index) => (
            <Typography
              key={index}
              variant="paragraph"
              color={textColor}
              textDecorationLine="underline"
              onPress={() => {
                void Linking.openURL(match.getAnchorHref())
              }}
            >
              {segment}
            </Typography>
          )}
        />
      </Stack>
      {hasReactions ? (
        <ReactionsChip reactions={reactions} isMine={isMine} />
      ) : null}
    </Stack>
  )
}

export function ChatTypingBubble(): React.JSX.Element {
  return (
    <XStack
      alignSelf="flex-start"
      padding="$5"
      borderRadius="$6"
      backgroundColor="$backgroundTertiary"
    >
      <DotTypingIndicator />
    </XStack>
  )
}
