import {useNavigation} from '@react-navigation/native'
import {Button, Stack, Typography} from '@vexl-next/ui'
import React from 'react'
import useSafeGoBack from '../utils/useSafeGoBack'

function TodoScreen(): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  return (
    <Stack f={1}>
      <Typography variant="paragraph" color="$foregroundPrimary">
        To be done
      </Typography>
      <Button variant="secondary" onPress={safeGoBack}>
        Go back
      </Button>
    </Stack>
  )
}

export function useGoToTodo(): () => void {
  const navigation = useNavigation()
  return () => {
    navigation.navigate('TodoScreen')
  }
}

export default TodoScreen
