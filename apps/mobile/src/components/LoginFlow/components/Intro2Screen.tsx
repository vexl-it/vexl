import {
  BuyingGraphic,
  SellingGraphic,
  Stack,
  TitleBlock,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useGraphicScale from '../../../utils/useGraphicScale'
import LoginFlowScreen, {LoginFlowCentered} from './LoginFlowScreen'

type Props = LoginFlowStackScreenProps<'Intro2'>

export default function Intro2Screen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const graphicScale = useGraphicScale(376)

  return (
    <LoginFlowScreen
      noHorizontalPadding
      primaryAction={{
        label: t('common.continue'),
        onPress: () => {
          navigation.navigate('PhoneNumber')
        },
      }}
    >
      <LoginFlowCentered>
        <YStack f={1} justifyContent="space-around">
          <XStack
            alignItems="flex-start"
            justifyContent="space-between"
            overflow="visible"
            width="100%"
          >
            <YStack>
              <Stack height={75} />
              <SellingGraphic
                animate
                height={255 * graphicScale}
                width={222 * graphicScale}
              />
            </YStack>
            <YStack>
              <BuyingGraphic
                animate
                height={231 * graphicScale}
                width={186 * graphicScale}
              />
            </YStack>
          </XStack>
          <TitleBlock
            align="center"
            size="large"
            px="$5"
            title={t('loginFlow.v2.intro2.title')}
            text={t('loginFlow.v2.intro2.text')}
          />
        </YStack>
      </LoginFlowCentered>
    </LoginFlowScreen>
  )
}
