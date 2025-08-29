import {type NewsAndAnnouncementsResponse} from '@vexl-next/rest-api/src/services/content/contracts'
import {Option} from 'effect'
import React, {useMemo} from 'react'
import {Stack, Text, YStack} from 'tamagui'
import openUrl from '../../../utils/openUrl'
import Button from '../../Button'
import SVGImage from '../../Image'
import Screen from '../../Screen'

import cancelSvg from '../../ChatDetailScreen/images/cancelSvg'
import faq1Svg from '../../FaqScreen/images/faq1Svg'
import IconButton from '../../IconButton'
import WhiteContainer from '../../WhiteContainer'
import redIllustrationSvg from '../image/redIllustrationSvg'
import yellowIllustrationSvg from '../image/yellowIllustrationSvg'

export function FullscreenWarningComponent({
  data: {action, cancelable, description, title, type},
  onCancel,
}: {
  data: Option.Option.Value<NewsAndAnnouncementsResponse['fullScreenWarning']>
  onCancel: () => void
}): React.ReactElement {
  const image = useMemo(() => {
    if (type === 'RED') {
      return redIllustrationSvg
    }
    if (type === 'YELLOW') {
      return yellowIllustrationSvg
    }

    return faq1Svg
  }, [type])

  return (
    <Screen>
      <YStack p="$2" f={1} gap="$2">
        <WhiteContainer>
          {!!cancelable && (
            <Stack alignSelf="flex-end">
              <IconButton
                icon={cancelSvg}
                iconStroke="gray"
                onPress={onCancel}
                variant="plain"
              />
            </Stack>
          )}
          <Stack px="$10" f={1} jc="center" ai="center">
            <SVGImage source={image} />
          </Stack>
          <Text
            adjustsFontSizeToFit
            numberOfLines={2}
            fos={24}
            color="$black"
            ff="$heading"
            mt="$4"
          >
            {title}
          </Text>
          <Text mt={16} fos={18} col="$greyOnWhite">
            {description}
          </Text>
        </WhiteContainer>
        {Option.isSome(action) && (
          <Button
            onPress={openUrl(action.value.url)}
            variant={type === 'RED' ? 'redLight' : 'secondary'}
            text={action.value.text}
          ></Button>
        )}
      </YStack>
    </Screen>
  )
}
