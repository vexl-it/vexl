import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import styled from '@emotion/native'
import WhiteContainer from '../../../WhiteContainer'
import Image from '../../../Image'
import Text, {TitleText} from '../../../Text'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import NotificationsSvg from '../../image/notificationsSvg'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {getNotificationToken} from '../../../../utils/notifications'
import {Alert} from 'react-native'
import {type PostLoginFlowScreenProps} from '../../../../navigationTypes'
import {useFinishPostLoginFlow} from '../../../../state/postLoginOnboarding'

const WhiteContainerStyled = styled(WhiteContainer)``
const IllustrationContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`
const Illustration = styled(Image)``
const TitleStyled = styled(TitleText)`
  margin-top: 16px;
`
const TextStyled = styled(Text)`
  font-size: 18px;
  margin-top: 16px;
`

type Props = PostLoginFlowScreenProps<'AllowNotificationsExplanation'>
function AllowNotificationsExplanationScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const finishPostLoginFlow = useFinishPostLoginFlow()

  function onFinished(): void {
    finishPostLoginFlow(true)
  }

  function allowNotifications(): void {
    void pipe(
      getNotificationToken({shouldAskForPermissions: true}),
      TE.match(
        (l) => {
          switch (l._tag) {
            case 'notificationPermissionDenied':
              Alert.alert(
                t('postLoginFlow.allowNotifications.errors.permissionDenied'),
                undefined,
                [
                  {
                    text: t('common.ok'),
                    onPress: onFinished,
                  },
                ]
              )
              break
            case 'notificationsNotAvailableOnEmulator':
              Alert.alert(
                t(
                  'postLoginFlow.allowNotifications.errors.notAvailableOnEmulator'
                ),
                undefined,
                [
                  {
                    text: t('common.ok'),
                    onPress: onFinished,
                  },
                ]
              )
              break
            default:
              Alert.alert(
                t('postLoginFlow.allowNotifications.errors.unknownError'),
                undefined,
                [
                  {
                    text: t('common.ok'),
                    onPress: onFinished,
                  },
                ]
              )
          }
        },
        (token) => {
          finishPostLoginFlow(true)
        }
      )
    )()
  }

  return (
    <>
      <HeaderProxy showBackButton={true} progressNumber={3} />
      <WhiteContainerStyled>
        <IllustrationContainer>
          <Illustration source={NotificationsSvg} />
        </IllustrationContainer>
        <TitleStyled>{t('postLoginFlow.allowNotifications.title')}</TitleStyled>
        <TextStyled colorStyle="grayOnWhite" fontWeight={400}>
          {t('postLoginFlow.allowNotifications.text')}
        </TextStyled>
      </WhiteContainerStyled>
      <NextButtonProxy
        text={t('postLoginFlow.allowNotifications.action')}
        onPress={allowNotifications}
        disabled={false}
      />
    </>
  )
}

export default AllowNotificationsExplanationScreen
