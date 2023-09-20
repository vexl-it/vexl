import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import WhiteContainer from '../../../WhiteContainer'
import SvgImage from '../../../Image'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import NotificationsSvg from '../../../../images/notificationsSvg'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {type PostLoginFlowScreenProps} from '../../../../navigationTypes'
import {useFinishPostLoginFlow} from '../../../../state/postLoginOnboarding'
import {Stack, Text} from 'tamagui'
import useCreateInbox from '../../../../state/chat/hooks/useCreateInbox'
import {useSessionAssumeLoggedIn} from '../../../../state/session'
import reportError from '../../../../utils/reportError'
import {useRequestNotificationPermissions} from '../../../../utils/notifications'
import {useShowLoadingOverlay} from '../../../LoadingOverlayProvider'
import showErrorAlert from '../../../../utils/showErrorAlert'

type Props = PostLoginFlowScreenProps<'AllowNotificationsExplanation'>

function AllowNotificationsExplanationScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const createInbox = useCreateInbox()
  const finishPostLoginFlow = useFinishPostLoginFlow()
  const session = useSessionAssumeLoggedIn()
  const requestNotificationPermissions = useRequestNotificationPermissions()
  const loadingOverlay = useShowLoadingOverlay()

  function onFinished(): void {
    // TODO display loading
    // TODO what if this fails? Use will be stuck on this screen.
    void pipe(
      createInbox({inbox: {privateKey: session.privateKey}}),
      TE.match(
        (e) => {
          if (e._tag === 'ErrorInboxAlreadyExists') {
            finishPostLoginFlow(true)
            return
          }
          reportError('error', 'Error creating inbox', e)
          showErrorAlert({
            title: t('common.errorCreatingInbox'),
            error: e,
          })
        },
        () => {
          finishPostLoginFlow(true)
        }
      )
    )()
  }

  function requestPermissions(): void {
    loadingOverlay.show()
    void pipe(
      requestNotificationPermissions,
      TE.match(
        () => {
          loadingOverlay.hide()
          onFinished()
        },
        () => {
          loadingOverlay.hide()
          onFinished()
        }
      )
    )()
  }

  return (
    <>
      <HeaderProxy showBackButton={true} progressNumber={3} />
      <WhiteContainer>
        <Stack mb={'$3'} f={1} ai="center" jc="center">
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
          onPress: onFinished,
        }}
      />
    </>
  )
}

export default AllowNotificationsExplanationScreen
