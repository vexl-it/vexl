import {usePreventRemove} from '@react-navigation/native'
import {Button, Loader, Screen, ScreenHeading, YStack} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {
  restoreFromBackupStateAtom,
  type RestoreFailure,
} from '../../../state/backup/restoreFromBackup'
import {useTranslation} from '../../../utils/localization/I18nProvider'

type Props = LoginFlowStackScreenProps<'RestoreFromBackup'>

function RestoringContent(): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Screen navigationBar={null}>
      <YStack alignItems="center" flex={1} gap="$5" justifyContent="center">
        <Loader size="large" />
        <ScreenHeading
          title={t('loginFlow.restoreFromBackup.restoring.title')}
          text={t('loginFlow.restoreFromBackup.restoring.text')}
        />
      </YStack>
    </Screen>
  )
}

function FailedContent({
  failure,
  onBackToLogin,
  onTryAgain,
}: {
  readonly failure: RestoreFailure
  readonly onBackToLogin: () => void
  readonly onTryAgain: () => void
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Screen
      navigationBar={null}
      footer={
        failure === 'backupNoLongerValid' ? (
          <Button onPress={onBackToLogin}>
            {t('loginFlow.restoreFromBackup.failed.backToLogin')}
          </Button>
        ) : (
          <Button onPress={onTryAgain}>{t('common.tryAgain')}</Button>
        )
      }
    >
      <YStack flex={1} justifyContent="center" paddingVertical="$5">
        {failure === 'backupNoLongerValid' ? (
          <ScreenHeading
            title={t('loginFlow.restoreFromBackup.failed.noLongerValid.title')}
            text={t('loginFlow.restoreFromBackup.failed.noLongerValid.text')}
          />
        ) : (
          <ScreenHeading
            title={t('loginFlow.restoreFromBackup.failed.title')}
            text={
              failure === 'offline'
                ? t('common.NetworkError')
                : t('loginFlow.restoreFromBackup.failed.unknown')
            }
          />
        )}
      </YStack>
    </Screen>
  )
}

export default function RestoreFromBackupScreen({
  navigation,
}: Props): React.ReactElement {
  const restoreState = useAtomValue(restoreFromBackupStateAtom)

  // Leaving mid-restore would let a second restore race the first one.
  usePreventRemove(restoreState.state === 'restoring', () => {})

  if (restoreState.state === 'failed')
    return (
      <FailedContent
        failure={restoreState.failure}
        onBackToLogin={() => {
          navigation.popTo('Intro2')
        }}
        onTryAgain={navigation.goBack}
      />
    )

  return <RestoringContent />
}
