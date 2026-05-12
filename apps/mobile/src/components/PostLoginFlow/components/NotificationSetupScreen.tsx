import {NotificationsGraphic, YStack} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {useWindowDimensions} from 'react-native'
import {type PostLoginFlowStackScreenProps} from '../../../navigationTypes'
import {completePostLoginFlowScreenActionAtom} from '../../../state/postLoginOnboarding'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {requestPermissions} from '../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import PostLoginFlowScreen, {PostLoginFlowCopy} from './PostLoginFlowScreen'

type Props = PostLoginFlowStackScreenProps<'NotificationSetup'>

export default function NotificationSetupScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {width: windowWidth} = useWindowDimensions()
  const availableWidth = windowWidth - 40
  const graphicScale = Math.min(1, availableWidth / 157)
  const completeScreen = useSetAtom(completePostLoginFlowScreenActionAtom)

  const goNext = (): void => {
    completeScreen('notificationSetup')
    navigation.navigate('UsageInfo')
  }

  return (
    <PostLoginFlowScreen
      primaryButton={{
        label: t('postLoginFlow.v2.notificationSetup.action'),
        onPress: () => {
          void Effect.runPromise(
            requestPermissions.pipe(Effect.catchAll(() => Effect.void))
          ).finally(goNext)
        },
      }}
      secondaryButton={{
        label: t('postLoginFlow.v2.notificationSetup.skip'),
        onPress: goNext,
      }}
    >
      <YStack alignItems="center" flex={1} justifyContent="center" gap="$9">
        <NotificationsGraphic
          height={153 * graphicScale}
          width={157 * graphicScale}
        />
        <PostLoginFlowCopy
          text={t('postLoginFlow.v2.notificationSetup.text')}
          title={t('postLoginFlow.v2.notificationSetup.title')}
        />
      </YStack>
    </PostLoginFlowScreen>
  )
}
