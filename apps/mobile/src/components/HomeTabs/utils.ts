import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {TAB_BAR_HEIGHT_PX} from './components/TabBar'

export default function usePixelsFromBottomWhereTabsEnd(): number {
  const insets = useSafeAreaInsets()
  return insets.bottom + TAB_BAR_HEIGHT_PX
}
