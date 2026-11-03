import {Array} from 'effect'
import React from 'react'
import {styled} from 'tamagui'

import {YStack} from '../primitives'
import {Divider} from './Divider'

export const MenuContext = React.createContext(false)

const MenuFrame = styled(YStack, {
  name: 'Menu',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$5',
  paddingHorizontal: '$4',
  paddingVertical: '$5',
  gap: '$5',
})

export interface MenuProps {
  readonly children: React.ReactNode
}

export function Menu({children}: MenuProps): React.JSX.Element {
  const childArray = React.Children.toArray(children)

  return (
    <MenuContext.Provider value={true}>
      <MenuFrame>
        {Array.flatMap(childArray, (child, index) =>
          index === 0
            ? [child]
            : [<Divider key={`divider-${String(index)}`} />, child]
        )}
      </MenuFrame>
    </MenuContext.Provider>
  )
}
