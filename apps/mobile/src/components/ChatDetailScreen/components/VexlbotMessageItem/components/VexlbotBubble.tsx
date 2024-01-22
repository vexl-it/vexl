import {type ReactNode} from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Image from '../../../../Image'
import closeSvg from '../../../../images/closeSvg'
import vexlbotSvg from '../../../images/vexlbotSvg'
import checkIconSvg from '../../images/checkIconSvg'
import clockIconSvg from '../../images/clockIconSvg'
import editSvg from '../images/editSvg'

interface Props {
  children?: ReactNode
  onEditPress?: () => void
  status?: 'accepted' | 'pending'
  text?: string
  introText?: string
  onCancelPress?: () => void
}

function VexlbotBubble({
  children,
  onEditPress,
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
      space="$2"
    >
      <XStack ai="stretch" jc="space-between">
        <XStack ai="center" space="$2">
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
            space="$1"
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
            space="$1"
            br="$3"
            px="$2"
            backgroundColor="$yellowAccent2"
            alignItems="center"
          >
            <Image source={clockIconSvg}></Image>
            <Text fos={12} ff="$body500" color="$main">
              {t('common.pending')}
            </Text>
          </XStack>
        )}
        {onEditPress && (
          <TouchableOpacity onPress={onEditPress}>
            <Image source={editSvg} />
          </TouchableOpacity>
        )}
        {onCancelPress && (
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
      <Stack space="$2">
        {introText && (
          <Text fos={16} ff="$body500" col="$greyOnWhite">
            {introText}
          </Text>
        )}
        {text && (
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
