import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import SvgImage from '../../Image'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import {type ReactNode} from 'react'

export interface SectionProps {
  active?: boolean
  children?: ReactNode
  image?: SvgString
  mandatory?: boolean
  switchable?: boolean
  title?: string
}

function Section({
  children,
  image,
  mandatory,
  title,
}: SectionProps): JSX.Element {
  const tokens = getTokens()
  return (
    <YStack mb="$4">
      <XStack ai="center" jc="space-between" py="$4">
        <XStack ai="center">
          {image && (
            <Stack mr="$2">
              <SvgImage stroke={tokens.color.white.val} source={image} />
            </Stack>
          )}
          <Text ff="$body700" color="$white" fos={24}>
            {title}
          </Text>
        </XStack>
        {mandatory && (
          <Text fos={24} ff="$body700" color="$greyOnBlack">
            *
          </Text>
        )}
      </XStack>
      {children}
    </YStack>
  )
}

export default Section
