import {type ReactNode} from 'react'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import Image from '../../../../Image'
import vexlbotSvg from '../../../images/vexlbotSvg'
import {TouchableOpacity} from 'react-native'
import closeSvg from '../../../../images/closeSvg'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import checkIconSvg from '../../images/checkIconSvg'
import clockIconSvg from '../../images/clockIconSvg'

interface Props {
  children?: ReactNode
  status?: 'accepted' | 'pending'
  text?: string
  onCancelPress?: () => void
}

function VexlbotBubble({
  children,
  onCancelPress,
  text,
  status,
}: Props): JSX.Element {
  const {t} = useTranslation()

  return (
    <Stack
      m={'$4'}
      maxWidth={'80%'}
      br={'$6'}
      backgroundColor={'$grey'}
      p={'$3'}
      space={'$2'}
    >
      <XStack ai={'stretch'} jc={'space-between'}>
        <XStack ai={'center'} space={'$2'}>
          <Image width={24} height={24} source={vexlbotSvg} />
          <XStack>
            <Text fos={16} ff={'$body600'} col={'$white'}>
              {t('common.vexl')}
            </Text>
            <Text fos={16} ff={'$body600'} col={'$main'}>
              {t('vexlbot.bot')}
            </Text>
          </XStack>
        </XStack>
        {status === 'accepted' && (
          <XStack
            space="$1"
            br={'$3'}
            px="$2"
            backgroundColor="$main"
            alignItems="center"
          >
            <Image source={checkIconSvg}></Image>
            <Text fos={12} ff="$body500" color={'$black'}>
              {t('common.accepted')}
            </Text>
          </XStack>
        )}
        {status === 'pending' && (
          <XStack
            space="$1"
            br={'$3'}
            px="$2"
            backgroundColor="$yellowAccent2"
            alignItems="center"
          >
            <Image source={clockIconSvg}></Image>
            <Text fos={12} ff="$body500" color={'$main'}>
              {t('common.pending')}
            </Text>
          </XStack>
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
      <Text fos={16} ff={'$body500'} col={'$greyOnWhite'}>
        {text}
      </Text>
      {children}
    </Stack>
  )
}

export default VexlbotBubble
