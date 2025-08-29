import {Effect} from 'effect'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {useSetAtom} from 'jotai'
import React from 'react'
import {Stack, Text} from 'tamagui'
import NotificationsSvg from '../../../../images/notificationsSvg'
import {type PostLoginFlowStackScreenProps} from '../../../../navigationTypes'
import {finishPostLoginFlowActionAtom} from '../../../../state/postLoginOnboarding'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useRequestNotificationPermissions} from '../../../../utils/notifications'
import SvgImage from '../../../Image'
import {useShowLoadingOverlay} from '../../../LoadingOverlayProvider'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import WhiteContainer from '../../../WhiteContainer'

type Props = PostLoginFlowStackScreenProps<'AllowNotificationsExplanation'>

function AllowNotificationsExplanationScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const finishPostLoginFlow = useSetAtom(finishPostLoginFlowActionAtom)
  const requestNotificationPermissions = useRequestNotificationPermissions()
  const loadingOverlay = useShowLoadingOverlay()

  function requestPermissions(): void {
    loadingOverlay.show()
    void pipe(
      requestNotificationPermissions,
      TE.match(
        () => {
          loadingOverlay.hide()
          finishPostLoginFlow()
        },
        () => {
          loadingOverlay.hide()
          finishPostLoginFlow()
        }
      )
    )()
  }

  return (
    <>
      <HeaderProxy showBackButton={true} progressNumber={3} />
      <WhiteContainer>
        <Stack mb="$3" f={1} ai="center" jc="center">
          <SvgImage
            style={{height: '100%', flex: 1}}
            source={NotificationsSvg}
          />
        </Stack>
        <Text
          col="$black"
          adjustsFontSizeToFit
          numberOfLines={2}
          fos={24}
          ff="$heading"
          mt="$4"
        >
          {t('postLoginFlow.allowNotifications.title')}
        </Text>
        <Text mt={16} fos={18} col="$greyOnWhite">
          {t('postLoginFlow.allowNotifications.text')}
        </Text>
      </WhiteContainer>
      <NextButtonProxy
        text={t('postLoginFlow.allowNotifications.action')}
        onPress={requestPermissions}
        disabled={false}
        secondButton={{
          text: t('postLoginFlow.allowNotifications.cancel'),
          onPress: () => Effect.runFork(finishPostLoginFlow()),
        }}
      />
    </>
  )
}

export default AllowNotificationsExplanationScreen
