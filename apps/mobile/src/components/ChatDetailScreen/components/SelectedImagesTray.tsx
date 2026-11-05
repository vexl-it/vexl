import {Stack, tokens, useTheme, XmarkCancelClose} from '@vexl-next/ui'
import {Array} from 'effect'
import React from 'react'
import {ScrollView} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated'
import {type SelectedImage} from '../../../utils/imagePickers'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import ChatImage from './ChatImage'

function SelectedImagesTray({
  images,
  onRemove,
}: {
  images: readonly SelectedImage[]
  onRemove: (image: SelectedImage) => void
}): React.ReactElement {
  const theme = useTheme()
  const {t} = useTranslation()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        gap: tokens.space[3].val,
        paddingHorizontal: tokens.space[4].val,
        paddingTop: tokens.space[4].val,
      }}
    >
      {Array.map(images, (image) => (
        <Animated.View
          key={image.uri}
          entering={FadeIn}
          exiting={FadeOut}
          layout={LinearTransition}
        >
          <ChatImage variant="thumbnail" image={image.uri} />
          <Stack
            role="button"
            aria-label={t('messages.removeImage')}
            position="absolute"
            top="$2"
            right="$2"
            width="$6"
            height="$6"
            borderRadius="$6"
            alignItems="center"
            justifyContent="center"
            backgroundColor="$foregroundPrimary"
            hitSlop={tokens.space[4].val}
            pressStyle={{opacity: 0.7}}
            onPress={() => {
              onRemove(image)
            }}
          >
            <XmarkCancelClose size={14} color={theme.backgroundPrimary.get()} />
          </Stack>
        </Animated.View>
      ))}
    </ScrollView>
  )
}

export default SelectedImagesTray
