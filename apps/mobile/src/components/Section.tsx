import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import React from 'react'
import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import SvgImage from './Image'

interface BaseSectionProps {
  children: React.ReactNode
}

interface CustomSectionProps extends BaseSectionProps {
  customSection: true
  title: string
}

interface SectionProps extends BaseSectionProps {
  customSection?: false
  mandatory?: boolean
  imageFill?: string
  title: string
  image: SvgString
}

export type Props = SectionProps | CustomSectionProps

function Section({
  mandatory,
  title,
  image,
  imageFill,
  children,
}: SectionProps): React.ReactElement {
  return (
    <YStack mb="$4">
      <XStack ai="center" py="$4" gap="$2">
        <SvgImage
          width={24}
          height={24}
          stroke={getTokens().color.white.val}
          fill={imageFill ?? 'none'}
          source={image}
        />
        <Stack fs={1}>
          <Text ff="$body700" color="$white" fos={24}>
            {title}
          </Text>
        </Stack>
        {!!mandatory && (
          <Text fos={24} ff="$body700" color="$white">
            *
          </Text>
        )}
      </XStack>
      {children}
    </YStack>
  )
}

export default Section
