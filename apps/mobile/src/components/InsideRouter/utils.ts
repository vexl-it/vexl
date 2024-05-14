import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {TAB_BAR_HEIGHT_PX} from './components/TabBar'

const MAP_LIST_SWITCH_BUTTON_HEIGHT = 42

export default function usePixelsFromBottomWhereTabsEnd(): number {
  const insets = useSafeAreaInsets()
  return insets.bottom + TAB_BAR_HEIGHT_PX + MAP_LIST_SWITCH_BUTTON_HEIGHT
}
