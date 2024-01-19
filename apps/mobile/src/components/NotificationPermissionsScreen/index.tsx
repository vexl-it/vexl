import {Stack, Text, XStack} from 'tamagui'
import WhiteContainer from '../WhiteContainer'
import Button from '../Button'
import {useRequestNotificationPermissions} from '../../utils/notifications'
import useSafeGoBack from '../../utils/useSafeGoBack'
import SvgImage from '../Image'
import NotificationsSvg from '../../images/notificationsSvg'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Screen from '../Screen'

export function NotificationPermissionsScreen(): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const requestNotificationPermissions = useRequestNotificationPermissions()

  return (
    <Screen>
      <WhiteContainer>
        <Stack mb="$3" f={1} ai="center" jc="center">
          <SvgImage
            style={{height: '100%', flex: 1}}
            source={NotificationsSvg}
          />
        </Stack>
        <Text
          adjustsFontSizeToFit
          numberOfLines={2}
          fos={24}
          ff="$heading"
          mt="$4"
        >
          {t('postLoginFlow.allowNotifications.title')}
        </Text>
        <Text mt={16} fos={18} col="$greyOnWhite">
          {`${t('postLoginFlow.allowNotifications.text')} ${t(
            'postLoginFlow.allowNotifications.vexlCantBeUsedWithoutNotifications'
          )}`}
        </Text>
      </WhiteContainer>
      <XStack space="$2" mb="$2" mt="$4">
        <Button
          fullSize
          onPress={() => {
            void requestNotificationPermissions()
          }}
          variant="secondary"
          text={t('common.allow')}
        />
        <Button
          fullSize
          onPress={safeGoBack}
          variant="primary"
          text={t('common.back')}
        />
      </XStack>
    </Screen>
  )
}
