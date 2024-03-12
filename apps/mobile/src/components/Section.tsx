import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import SvgImage from './Image'

interface BaseSectionProps {
  children: React.ReactNode
}

interface CustomSectionProps extends BaseSectionProps {
  customSection: true
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
}: SectionProps): JSX.Element {
  return (
    <YStack mb="$4">
      <XStack ai="center" jc="space-between" py="$4">
        <XStack ai="center">
          <Stack mr="$2">
            <SvgImage
              width={24}
              height={24}
              stroke={getTokens().color.white.val}
              fill={imageFill ?? 'none'}
              source={image}
            />
          </Stack>
          <Stack fs={1}>
            <Text ff="$body700" color="$white" fos={24}>
              {title}
            </Text>
          </Stack>
        </XStack>
        {!!mandatory && (
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
