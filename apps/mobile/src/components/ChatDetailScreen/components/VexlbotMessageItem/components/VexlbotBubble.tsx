import {type ReactNode} from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Image from '../../../../Image'
import closeSvg from '../../../../images/closeSvg'
import vexlbotSvg from '../../../images/vexlbotSvg'
import checkIconSvg from '../../images/checkIconSvg'
import clockIconSvg from '../../images/clockIconSvg'

interface Props {
  children?: ReactNode
  status?: 'accepted' | 'pending' | 'outdated'
  text?: string
  introText?: string
  onCancelPress?: () => void
}

function VexlbotBubble({
  children,
  onCancelPress,
  text,
  introText,
  status,
}: Props): JSX.Element {
  const {t} = useTranslation()

  return (
    <Stack
      m="$4"
      maxWidth="80%"
      br="$6"
      backgroundColor="$grey"
      p="$3"
      gap="$2"
    >
      <XStack ai="stretch" jc="space-between">
        <XStack ai="center" gap="$2">
          <Image width={24} height={24} source={vexlbotSvg} />
          <XStack>
            <Text fos={16} ff="$body600" col="$white">
              {t('common.vexl')}
            </Text>
            <Text fos={16} ff="$body600" col="$main">
              {t('vexlbot.bot')}
            </Text>
          </XStack>
        </XStack>
        {status === 'accepted' && (
          <XStack
            gap="$1"
            br="$3"
            px="$2"
            backgroundColor="$main"
            alignItems="center"
          >
            <Image source={checkIconSvg}></Image>
            <Text fos={12} ff="$body500" color="$black">
              {t('common.accepted')}
            </Text>
          </XStack>
        )}
        {status === 'pending' && (
          <XStack
            gap="$1"
            br="$3"
            px="$2"
            backgroundColor="$yellowAccent2"
            alignItems="center"
          >
            <Image
              height={12}
              width={12}
              source={clockIconSvg}
              stroke={getTokens().color.$main.val}
            ></Image>
            <Text fos={12} ff="$body500" color="$main">
              {t('common.pending')}
            </Text>
          </XStack>
        )}
        {status === 'outdated' && (
          <XStack
            gap="$1"
            br="$3"
            px="$2"
            backgroundColor="$greyAccent1"
            alignItems="center"
          >
            <Image
              height={12}
              width={12}
              source={closeSvg}
              stroke={getTokens().color.$greyAccent3.val}
            ></Image>
            <Text fos={12} ff="$body500" color="$greyAccent3">
              {t('common.outdated')}
            </Text>
          </XStack>
        )}
        {!!onCancelPress && (
          <TouchableOpacity onPress={onCancelPress}>
            <Image
              width={24}
              height={24}
              stroke={getTokens().color.greyOnBlack.val}
              source={closeSvg}
            />
          </TouchableOpacity>
        )}
      </XStack>
      <Stack gap="$2">
        {!!introText && (
          <Text fos={16} ff="$body500" col="$greyOnWhite">
            {introText}
          </Text>
        )}
        {!!text && (
          <Text fos={16} ff="$body500" col="$greyOnWhite">
            {text}
          </Text>
        )}
      </Stack>
      {children}
    </Stack>
  )
}

export default VexlbotBubble
