import {
  BuyingGraphic,
  SellingGraphic,
  Stack,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {useWindowDimensions} from 'react-native'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {preferencesAtom} from '../../../utils/preferences'
import {backupEnabledAtom} from '../../../utils/versionService/atoms'
import SecretDoor from '../../SecretDoor'
import LoginFlowScreen, {
  LoginFlowCentered,
  LoginFlowLink,
  LoginFlowText,
  LoginFlowTitle,
} from './LoginFlowScreen'

type Props = LoginFlowStackScreenProps<'Intro2'>

export default function Intro2Screen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {width: windowWidth} = useWindowDimensions()
  const availableWidth = windowWidth - 40
  const graphicScale = Math.min(1, availableWidth / 376)
  const backupEnabled = useAtomValue(backupEnabledAtom)
  const setPreferences = useSetAtom(preferencesAtom)

  return (
    <LoginFlowScreen
      disableHorizontalPaddingForChildren
      action={{
        label: t('loginFlow.v2.intro2.action'),
        onPress: () => {
          navigation.navigate('PhoneNumber')
        },
      }}
      footer={
        backupEnabled ? (
          <LoginFlowLink
            label={t('loginFlow.v2.intro2.restoreAction')}
            onPress={() => {
              navigation.navigate('RestoreIntro')
            }}
          />
        ) : undefined
      }
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
          <YStack gap="$4" px="$5" width="100%">
            <SecretDoor
              onSecretDoorOpen={() => {
                setPreferences((old) => ({
                  ...old,
                  enableBackupDevMode: !old.enableBackupDevMode,
                }))
              }}
            >
              <LoginFlowTitle>{t('loginFlow.v2.intro2.title')}</LoginFlowTitle>
            </SecretDoor>
            <LoginFlowText>{t('loginFlow.v2.intro2.text')}</LoginFlowText>
          </YStack>
        </YStack>
      </LoginFlowCentered>
    </LoginFlowScreen>
  )
}
