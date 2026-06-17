import {Button, Refresh, Screen, Stack, Typography, YStack} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {contactSupportActionAtom} from '../../utils/contactSupportActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'

const styles = StyleSheet.create({
  safeAreaProvider: {
    flex: 1,
  },
})

export function SessionRecoveryScreen({
  isReloadingSession,
  onReloadSession,
  errorCode,
}: {
  readonly isReloadingSession: boolean
  readonly onReloadSession: () => void
  readonly errorCode: string
}): React.ReactElement {
  const {t} = useTranslation()
  const contactSupport = useSetAtom(contactSupportActionAtom)

  return (
    <SafeAreaProvider style={styles.safeAreaProvider}>
      <Screen
        navigationBar={null}
        safeAreasBackgroundColor="$backgroundPrimary"
        footer={
          <YStack gap="$3">
            <Button
              icon={Refresh}
              disabled={isReloadingSession}
              onPress={onReloadSession}
            >
              {isReloadingSession ? t('common.loading') : t('common.tryAgain')}
            </Button>
            <Button variant="secondary" onPress={contactSupport}>
              {t('errorGettingSession.contactSupport')}
            </Button>
          </YStack>
        }
      >
        <YStack flex={1} justifyContent="center" gap="$8" paddingBottom="$8">
          <Stack alignItems="center" justifyContent="center">
            <Typography
              variant="heading3"
              color="$foregroundPrimary"
              textAlign="center"
              adjustsFontSizeToFit
              numberOfLines={3}
            >
              {t('errorGettingSession.title')}
            </Typography>
          </Stack>

          <Typography
            variant="paragraph"
            color="$foregroundSecondary"
            textAlign="center"
          >
            {t('errorGettingSession.text', {
              errorCode,
            })}
          </Typography>
        </YStack>
      </Screen>
    </SafeAreaProvider>
  )
}
