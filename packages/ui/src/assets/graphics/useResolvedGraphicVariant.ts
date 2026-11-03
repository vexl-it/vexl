import {useThemeName} from 'tamagui'

export type GraphicVariant = 'dark' | 'light'

export function useResolvedGraphicVariant(
  variant?: GraphicVariant
): GraphicVariant {
  const themeName = useThemeName()

  return variant ?? (themeName.startsWith('dark') ? 'dark' : 'light')
}
