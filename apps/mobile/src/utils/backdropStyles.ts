import {useMemo} from 'react'
import {type ViewStyle} from 'react-native'
import {useTheme} from 'tamagui'

export function useBackgroundStyle(): ViewStyle {
  const theme = useTheme()

  return useMemo(
    () => ({
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      backgroundColor: theme.backgroundPrimary.val,
      opacity: 0.55,
    }),
    [theme.backgroundPrimary.val]
  )
}
