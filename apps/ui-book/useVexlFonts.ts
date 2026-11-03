import {vexlFonts} from '@vexl-next/ui'
import {useFonts} from 'expo-font'

export function useVexlFonts(): boolean {
  const [loaded] = useFonts(vexlFonts)
  return loaded
}
