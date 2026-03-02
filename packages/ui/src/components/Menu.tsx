import React from 'react'
import {styled} from 'tamagui'

import {Stack, YStack} from '../primitives'

export const MenuContext = React.createContext(false)

const MenuFrame = styled(YStack, {
  name: 'Menu',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$5',
  paddingHorizontal: '$4',
  paddingVertical: '$5',
  gap: '$5',
})

const MenuDivider = styled(Stack, {
  name: 'MenuDivider',
  height: '$0.5',
  alignSelf: 'stretch',
  backgroundColor: '$backgroundTertiary',
})

export interface MenuProps {
  readonly children: React.ReactNode
}

export function Menu({children}: MenuProps): React.JSX.Element {
  const childArray = React.Children.toArray(children)

  return (
    <MenuContext.Provider value={true}>
      <MenuFrame>
        {childArray.flatMap((child, index) =>
          index < childArray.length - 1
            ? [child, <MenuDivider key={`divider-${String(index)}`} />]
            : [child]
        )}
      </MenuFrame>
    </MenuContext.Provider>
  )
}
