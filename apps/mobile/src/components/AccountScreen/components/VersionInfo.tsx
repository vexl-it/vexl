import {useNavigation} from '@react-navigation/native'
import {Typography} from '@vexl-next/ui'
import React, {useCallback} from 'react'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {version, versionCode} from '../../../utils/environment'
import SecretDoor from '../../SecretDoor'

function VersionInfo(): React.ReactElement {
  const navigation =
    useNavigation<RootStackScreenProps<'Account'>['navigation']>()

  const handleSecretDoorOpen = useCallback(() => {
    navigation.navigate('DebugScreen')
  }, [navigation])

  return (
    <SecretDoor onSecretDoorOpen={handleSecretDoorOpen}>
      <Typography
        textAlign="center"
        variant="description"
        color="$foregroundSecondary"
      >
        {version} ({versionCode})
      </Typography>
    </SecretDoor>
  )
}

export default VersionInfo
