import type React from 'react'

import {AvatarScreen} from './AvatarScreen'
import {ButtonScreen} from './ButtonScreen'
import {CardButtonScreen} from './CardButtonScreen'
import {DotScreen} from './DotScreen'
import {DotTypingIndicatorScreen} from './DotTypingIndicatorScreen'
import {FabButtonScreen} from './FabButtonScreen'
import {FilterBarScreen} from './FilterBarScreen'
import {FilterTagScreen} from './FilterTagScreen'
import {IconButtonScreen} from './IconButtonScreen'
import {IconsScreen} from './IconsScreen'
import {IconTagScreen} from './IconTagScreen'
import {NavButtonScreen} from './NavButtonScreen'
import {SearchBarScreen} from './SearchBarScreen'
import {SwitchScreen} from './SwitchScreen'
import {TabsScreen} from './TabsScreen'
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
  {label: 'Fab Button', component: FabButtonScreen},
  {label: 'Filter Bar', component: FilterBarScreen},
  {label: 'Icon Button', component: IconButtonScreen},
  {label: 'Nav Button', component: NavButtonScreen},
  {label: 'Search Bar', component: SearchBarScreen},
  {label: 'Icon Tag', component: IconTagScreen},
  {label: 'Icons', component: IconsScreen},
  {label: 'Switch', component: SwitchScreen},
  {label: 'Dot Typing Indicator', component: DotTypingIndicatorScreen},
  {label: 'Filter Tag', component: FilterTagScreen},
  {label: 'Tabs', component: TabsScreen},
  {label: 'Text Tag', component: TextTagScreen},
  {label: 'Toast', component: ToastScreen},
]
