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
        Notifications not allowed. Here we will explain why you should have
        notifications on.
      </Text>

      <Button
        onPress={() => {
          void requestNotificationPermissions()
        }}
        variant={'secondary'}
        text={'grant us the permissions'}
      />
      <Button
        onPress={() => {
          navigation.goBack()
        }}
        variant={'primary'}
        text={'Go back'}
      />
    </WhiteContainer>
  )
}
