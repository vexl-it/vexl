import type React from 'react'

import {ButtonScreen} from './ButtonScreen'
import {CardButtonScreen} from './CardButtonScreen'
import {FabButtonScreen} from './FabButtonScreen'
import {IconButtonScreen} from './IconButtonScreen'
import {IconsScreen} from './IconsScreen'
import {NavButtonScreen} from './NavButtonScreen'
import {SwitchScreen} from './SwitchScreen'

export interface ScreenEntry {
  readonly label: string
  readonly component: () => React.JSX.Element
}

export const screens: readonly ScreenEntry[] = [
  {label: 'Button', component: ButtonScreen},
  {label: 'Card Button', component: CardButtonScreen},
  {label: 'Fab Button', component: FabButtonScreen},
  {label: 'Icon Button', component: IconButtonScreen},
  {label: 'Nav Button', component: NavButtonScreen},
  {label: 'Icons', component: IconsScreen},
  {label: 'Switch', component: SwitchScreen},
]
