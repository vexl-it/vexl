import {Text} from 'tamagui'
import WhiteContainer from '../WhiteContainer'
import {type RootStackScreenProps} from '../../navigationTypes'
import Button from '../Button'
import {useRequestNotificationPermissions} from '../../utils/notifications'

type Props = RootStackScreenProps<'NotificationPermissionsMissing'>

export function NotificationPermissionsScreen({
  navigation,
}: Props): JSX.Element {
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
        text={'grant us the permissions'}
      />
      <Button
        onPress={navigation.goBack}
        variant={'primary'}
        text={'Go back'}
      />
    </WhiteContainer>
  )
}
