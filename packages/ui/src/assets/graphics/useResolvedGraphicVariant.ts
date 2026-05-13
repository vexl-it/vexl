import {useColorScheme} from 'react-native'

export type GraphicVariant = 'dark' | 'light'

export function useResolvedGraphicVariant(
  variant?: GraphicVariant
): GraphicVariant {
  const systemColorScheme = useColorScheme()

  return variant ?? (systemColorScheme === 'dark' ? 'light' : 'dark')
}
