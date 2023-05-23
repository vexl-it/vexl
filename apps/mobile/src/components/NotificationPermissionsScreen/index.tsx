import {Text} from 'tamagui'
import WhiteContainer from '../WhiteContainer'
import Button from '../Button'
import {useRequestNotificationPermissions} from '../../utils/notifications'
import useSafeGoBack from '../../utils/useSafeGoBack'

export function NotificationPermissionsScreen(): JSX.Element {
  const safeGoBack = useSafeGoBack()
  const requestNotificationPermissions = useRequestNotificationPermissions()
  return (
    <WhiteContainer>
      <Text mt={16} fos={18} col="$black">
        Enable notifications for a seamless social experience, as you will
        instantly receive chat messages. Without notifications enabled your
        offers will not be automatically encrypted for new users in your
        contacts.
      </Text>

      <Button
        onPress={() => {
          void requestNotificationPermissions()
        }}
        variant={'secondary'}
        text={'Allow permissions'}
      />
      <Button onPress={safeGoBack} variant={'primary'} text={'Go back'} />
    </WhiteContainer>
  )
}
