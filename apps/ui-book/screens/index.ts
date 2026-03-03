import type React from 'react'

import {AvatarScreen} from './AvatarScreen'
import {BannerScreen} from './BannerScreen'
import {ButtonScreen} from './ButtonScreen'
import {CardButtonScreen} from './CardButtonScreen'
import {ChatMessageItemScreen} from './ChatMessageItemScreen'
import {ChecklistCellScreen} from './ChecklistCellScreen'
import {CommonFriendsScreen} from './CommonFriendsScreen'
import {DotScreen} from './DotScreen'
import {DotTypingIndicatorScreen} from './DotTypingIndicatorScreen'
import {EditRowScreen} from './EditRowScreen'
import {ExchangeScreen} from './ExchangeScreen'
import {FabButtonScreen} from './FabButtonScreen'
import {FilterBarScreen} from './FilterBarScreen'
import {FilterTagScreen} from './FilterTagScreen'
import {IconButtonScreen} from './IconButtonScreen'
import {IconsScreen} from './IconsScreen'
import {IconTagScreen} from './IconTagScreen'
import {InputHintScreen} from './InputHintScreen'
import {MenuItemScreen} from './MenuItemScreen'
import {MenuScreen} from './MenuScreen'
import {NavButtonScreen} from './NavButtonScreen'
import {NotificationCardScreen} from './NotificationCardScreen'
import {PickerScreen} from './PickerScreen'
import {ReachStatsScreen} from './ReachStatsScreen'
import {RowButtonScreen} from './RowButtonScreen'
import {RowCheckboxScreen} from './RowCheckboxScreen'
import {RowRadiobuttonScreen} from './RowRadiobuttonScreen'
import {SearchBarScreen} from './SearchBarScreen'
import {SegmentedPickerScreen} from './SegmentedPickerScreen'
import {SelectableItemScreen} from './SelectableItemScreen'
import {SelectClubCellScreen} from './SelectClubCellScreen'
import {SelectorScreen} from './SelectorScreen'
import {StepperCheckScreen} from './StepperCheckScreen'
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
  {label: 'Banner', component: BannerScreen},
  {label: 'Button', component: ButtonScreen},
  {label: 'Card Button', component: CardButtonScreen},
  {label: 'Chat Message Item', component: ChatMessageItemScreen},
  {label: 'Common Friends', component: CommonFriendsScreen},
  {label: 'Checklist Cell', component: ChecklistCellScreen},
  {label: 'Dot', component: DotScreen},
  {label: 'Edit Row', component: EditRowScreen},
  {label: 'Dot Typing Indicator', component: DotTypingIndicatorScreen},
  {label: 'Exchange', component: ExchangeScreen},
  {label: 'Fab Button', component: FabButtonScreen},
  {label: 'Filter Bar', component: FilterBarScreen},
  {label: 'Filter Tag', component: FilterTagScreen},
  {label: 'Icon Button', component: IconButtonScreen},
  {label: 'Icon Tag', component: IconTagScreen},
  {label: 'Input Hint', component: InputHintScreen},
  {label: 'Icons', component: IconsScreen},
  {label: 'Menu', component: MenuScreen},
  {label: 'Menu Item', component: MenuItemScreen},
  {label: 'Nav Button', component: NavButtonScreen},
  {label: 'Notification Card', component: NotificationCardScreen},
  {label: 'Picker', component: PickerScreen},
  {label: 'Reach Stats', component: ReachStatsScreen},
  {label: 'Row Button', component: RowButtonScreen},
  {label: 'Row Checkbox', component: RowCheckboxScreen},
  {label: 'Row Radiobutton', component: RowRadiobuttonScreen},
  {label: 'Search Bar', component: SearchBarScreen},
  {label: 'Selectable Item', component: SelectableItemScreen},
  {label: 'Select Club Cell', component: SelectClubCellScreen},
  {label: 'Segmented Picker', component: SegmentedPickerScreen},
  {label: 'Selector', component: SelectorScreen},
  {label: 'Stepper Check', component: StepperCheckScreen},
  {label: 'Switch', component: SwitchScreen},
  {label: 'Tabs', component: TabsScreen},
  {label: 'Text Field', component: TextFieldScreen},
  {label: 'Text Tag', component: TextTagScreen},
  {label: 'Toast', component: ToastScreen},
]
