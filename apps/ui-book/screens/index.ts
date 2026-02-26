import type React from 'react'

import {AvatarScreen} from './AvatarScreen'
import {ButtonScreen} from './ButtonScreen'
import {CardButtonScreen} from './CardButtonScreen'
import {DotTypingIndicatorScreen} from './DotTypingIndicatorScreen'
import {FabButtonScreen} from './FabButtonScreen'
import {FilterTagScreen} from './FilterTagScreen'
import {IconButtonScreen} from './IconButtonScreen'
import {IconsScreen} from './IconsScreen'
import {NavButtonScreen} from './NavButtonScreen'
import {SwitchScreen} from './SwitchScreen'
import {TabsScreen} from './TabsScreen'

export interface ScreenEntry {
  readonly label: string
  readonly component: () => React.JSX.Element
}

export const screens: readonly ScreenEntry[] = [
  {label: 'Avatar', component: AvatarScreen},
  {label: 'Button', component: ButtonScreen},
  {label: 'Card Button', component: CardButtonScreen},
  {label: 'Fab Button', component: FabButtonScreen},
  {label: 'Icon Button', component: IconButtonScreen},
  {label: 'Nav Button', component: NavButtonScreen},
  {label: 'Icons', component: IconsScreen},
  {label: 'Switch', component: SwitchScreen},
  {label: 'Dot Typing Indicator', component: DotTypingIndicatorScreen},
  {label: 'Filter Tag', component: FilterTagScreen},
  {label: 'Tabs', component: TabsScreen},
]
