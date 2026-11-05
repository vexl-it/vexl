import {NotificationsGraphic, TitleBlock, YStack} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {type PostLoginFlowStackScreenProps} from '../../../navigationTypes'
import {completePostLoginFlowScreenActionAtom} from '../../../state/postLoginOnboarding'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {offerBackgroundNotificationSocketActionAtom} from '../../../utils/notifications/backgroundNotificationSocket'
import {setBackgroundNotificationSocketEnabledActionAtom} from '../../../utils/notifications/backgroundNotificationSocket/setBackgroundNotificationSocketEnabledActionAtom'
import {requestPermissions} from '../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import useGraphicScale from '../../../utils/useGraphicScale'
import LoginFlowScreen from '../../LoginFlow/components/LoginFlowScreen'

type Props = PostLoginFlowStackScreenProps<'NotificationSetup'>

export default function NotificationSetupScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const graphicScale = useGraphicScale(157)
  const completeScreen = useSetAtom(completePostLoginFlowScreenActionAtom)
  const offerBackgroundSocket = useSetAtom(
    offerBackgroundNotificationSocketActionAtom
  )
  const setBackgroundSocketEnabled = useSetAtom(
    setBackgroundNotificationSocketEnabledActionAtom
  )

  const goNext = (): void => {
    completeScreen('notificationSetup')
    navigation.navigate('UsageInfo')
  }

  return (
    <LoginFlowScreen
      primaryAction={{
        label: t('postLoginFlow.v2.notificationSetup.action'),
        onPress: () => {
          void Effect.runPromise(
            requestPermissions.pipe(Effect.catchAll(() => Effect.void))
          )
            .then(offerBackgroundSocket)
            .finally(goNext)
        },
      }}
      secondaryAction={{
        label: t('postLoginFlow.v2.notificationSetup.skip'),
        onPress: () => {
          void setBackgroundSocketEnabled(false).finally(goNext)
        },
      }}
    >
      <YStack alignItems="center" flex={1} justifyContent="center" gap="$9">
        <NotificationsGraphic
          animate
          height={153 * graphicScale}
          width={157 * graphicScale}
        />
        <TitleBlock
          align="center"
          size="large"
          title={t('postLoginFlow.v2.notificationSetup.title')}
          text={t('postLoginFlow.v2.notificationSetup.text')}
        />
      </YStack>
    </LoginFlowScreen>
  )
}
