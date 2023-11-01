import {getTokens, Stack, Text, XStack} from 'tamagui'
import Screen from '../../Screen'
import {ScrollView} from 'react-native'
import KeyboardAvoidingView from '../../KeyboardAvoidingView'
import IconButton from '../../IconButton'
import backButtonSvg from '../../../images/backButtonSvg'
import closeSvg from '../../images/closeSvg'
import Button from '../../Button'
import Image from '../../Image'
import eyeSvg from '../../images/eyeSvg'
import {useTranslation} from '../../../utils/localization/I18nProvider'

interface CommonProps {
  children: JSX.Element | JSX.Element[]
  scrollable?: boolean
  screenTitle?: string
  buttonTitle: string
  buttonDisabled?: boolean
  onButtonPress: () => void
  showAnonymizationNotice?: boolean
}

type OptionalProps =
  | {
      navigationRowShown?: false
      onBackButtonPress?: never
      onCloseButtonPress?: never
    }
  | {
      navigationRowShown: true
      onBackButtonPress: () => void
      onCloseButtonPress: () => void
    }

type Props = CommonProps & OptionalProps

function ScreenWrapper({
  children,
  navigationRowShown,
  scrollable,
  screenTitle,
  buttonTitle,
  buttonDisabled,
  onButtonPress,
  onBackButtonPress,
  onCloseButtonPress,
  showAnonymizationNotice,
}: Props): JSX.Element {
  const {t} = useTranslation()

  return (
    <KeyboardAvoidingView>
      <Screen pt={'$4'} customHorizontalPadding={getTokens().space[2].val}>
        <Stack
          width={36}
          h={5}
          als={'center'}
          bc={'$greyAccent1'}
          br={'$5'}
          mb={'$4'}
        />
        {navigationRowShown ? (
          <XStack ai={'center'} jc={'space-between'} pb={'$2'}>
            <IconButton
              variant={'primary'}
              icon={backButtonSvg}
              onPress={onBackButtonPress}
            />
            <Text fos={20} ff={'$body600'} col={'$white'}>
              {screenTitle}
            </Text>
            <IconButton icon={closeSvg} onPress={onCloseButtonPress} />
          </XStack>
        ) : (
          <></>
        )}
        {scrollable ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <Stack f={1}>{children}</Stack>
        )}
        {showAnonymizationNotice ? (
          <XStack ai={'center'} jc={'center'} py={'$3'}>
            <Image stroke={getTokens().color.greyOnWhite.val} source={eyeSvg} />
            <Text fos={14} ff={'$body400'} ml={'$2'} col={'$greyOnWhite'}>
              {t('tradeChecklist.notVisibleToAnyoneNotice')}
            </Text>
          </XStack>
        ) : (
          <></>
        )}
        <Button
          fullWidth
          disabled={buttonDisabled}
          size={'medium'}
          onPress={onButtonPress}
          variant={'secondary'}
          text={buttonTitle}
        />
      </Screen>
    </KeyboardAvoidingView>
  )
}

export default ScreenWrapper
