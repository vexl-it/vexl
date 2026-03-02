import type React from 'react'

import {AvatarScreen} from './AvatarScreen'
import {ButtonScreen} from './ButtonScreen'
import {CardButtonScreen} from './CardButtonScreen'
import {DotScreen} from './DotScreen'
import {DotTypingIndicatorScreen} from './DotTypingIndicatorScreen'
import {ExchangeScreen} from './ExchangeScreen'
import {FabButtonScreen} from './FabButtonScreen'
import {FilterBarScreen} from './FilterBarScreen'
import {FilterTagScreen} from './FilterTagScreen'
import {IconButtonScreen} from './IconButtonScreen'
import {IconsScreen} from './IconsScreen'
import {IconTagScreen} from './IconTagScreen'
import {InputHintScreen} from './InputHintScreen'
import {NavButtonScreen} from './NavButtonScreen'
import {RowButtonScreen} from './RowButtonScreen'
import {RowCheckboxScreen} from './RowCheckboxScreen'
import {RowRadiobuttonScreen} from './RowRadiobuttonScreen'
import {SearchBarScreen} from './SearchBarScreen'
import {SegmentedPickerScreen} from './SegmentedPickerScreen'
import {SwitchScreen} from './SwitchScreen'
import {TabsScreen} from './TabsScreen'
import {TextFieldScreen} from './TextFieldScreen'
import {TextTagScreen} from './TextTagScreen'
import {ToastScreen} from './ToastScreen'

export interface ScreenEntry {
  readonly label: string
  readonly component: () => React.JSX.Element
}

export const screens: readonly ScreenEntry[] = [
  {label: 'Avatar', component: AvatarScreen},
  {label: 'Button', component: ButtonScreen},
  {label: 'Card Button', component: CardButtonScreen},
  {label: 'Dot', component: DotScreen},
  {label: 'Dot Typing Indicator', component: DotTypingIndicatorScreen},
  {label: 'Exchange', component: ExchangeScreen},
  {label: 'Fab Button', component: FabButtonScreen},
  {label: 'Filter Bar', component: FilterBarScreen},
  {label: 'Filter Tag', component: FilterTagScreen},
  {label: 'Icon Button', component: IconButtonScreen},
  {label: 'Icon Tag', component: IconTagScreen},
  {label: 'Input Hint', component: InputHintScreen},
  {label: 'Icons', component: IconsScreen},
  {label: 'Nav Button', component: NavButtonScreen},
  {label: 'Row Button', component: RowButtonScreen},
  {label: 'Row Checkbox', component: RowCheckboxScreen},
  {label: 'Row Radiobutton', component: RowRadiobuttonScreen},
  {label: 'Search Bar', component: SearchBarScreen},
  {label: 'Segmented Picker', component: SegmentedPickerScreen},
  {label: 'Switch', component: SwitchScreen},
  {label: 'Tabs', component: TabsScreen},
  {label: 'Text Field', component: TextFieldScreen},
  {label: 'Text Tag', component: TextTagScreen},
  {label: 'Toast', component: ToastScreen},
]
