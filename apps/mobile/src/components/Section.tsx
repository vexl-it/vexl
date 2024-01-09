import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import SvgImage from './Image'
import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'

interface BaseSectionProps {
  children: React.ReactNode
  title: string
  mandatory?: boolean
}

interface CustomSectionProps extends BaseSectionProps {
  customSection: true
}

interface SectionProps extends BaseSectionProps {
  customSection?: false
  image: SvgString
  imageFill?: string
}

export type Props = SectionProps | CustomSectionProps

function Section(props: Props): JSX.Element {
  return (
    <YStack mb={'$4'}>
      {!props.customSection && (
        <XStack ai={'center'} jc={'space-between'} py={'$4'}>
          <XStack ai={'center'}>
            {props.image && (
              <Stack mr={'$2'}>
                <SvgImage
                  width={24}
                  height={24}
                  stroke={getTokens().color.white.val}
                  fill={props.imageFill ?? 'none'}
                  source={props.image}
                />
              </Stack>
            )}
            <Stack fs={1}>
              <Text ff={'$body700'} color={'$white'} fos={24}>
                {props.title}
              </Text>
            </Stack>
          </XStack>
          {props.mandatory && (
            <Text fos={24} ff={'$body700'} color={'$greyOnBlack'}>
              *
            </Text>
          )}
        </XStack>
      )}
      {props.children}
    </YStack>
  )
}

export default Section
