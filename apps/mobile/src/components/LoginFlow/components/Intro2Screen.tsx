import {BuyingGraphic, SellingGraphic, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {useWindowDimensions} from 'react-native'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import LoginFlowScreen, {
  LoginFlowCentered,
  LoginFlowText,
  LoginFlowTitle,
} from './LoginFlowScreen'

type Props = LoginFlowStackScreenProps<'Intro2'>

export default function Intro2Screen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {width: windowWidth} = useWindowDimensions()
  const availableWidth = windowWidth - 40
  const graphicScale = Math.min(1, availableWidth / 376)

  return (
    <LoginFlowScreen
      action={{
        label: t('common.continue'),
        onPress: () => {
          navigation.navigate('PhoneNumber')
        },
      }}
    >
      <LoginFlowCentered>
        <XStack
          alignItems="center"
          height={310 * graphicScale}
          justifyContent="center"
          overflow="hidden"
          width="100%"
        >
          <SellingGraphic
            height={255 * graphicScale}
            width={222 * graphicScale}
          />
          <YStack
            marginLeft={-32 * graphicScale}
            marginTop={-48 * graphicScale}
          >
            <BuyingGraphic
              height={231 * graphicScale}
              width={186 * graphicScale}
            />
          </YStack>
        </XStack>
        <YStack gap="$4" width="100%">
          <LoginFlowTitle>{t('loginFlow.v2.intro2.title')}</LoginFlowTitle>
          <LoginFlowText>{t('loginFlow.v2.intro2.text')}</LoginFlowText>
        </YStack>
      </LoginFlowCentered>
    </LoginFlowScreen>
  )
}
