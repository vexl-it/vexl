import {
  FavouriteStarNavIcon,
  Typography,
  useTheme,
  XStack,
  YStack,
  type IconProps,
} from '@vexl-next/ui'
import * as iconModule from '@vexl-next/ui/src/icons'
import {Array, pipe, Record} from 'effect'
import React from 'react'
import {getTokens} from 'tamagui'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const ICON_TILE_WIDTH = 112

// ExchangeIcon is an alias of Exchange; FavouriteStarNavIcon needs its own prop.
const {
  ExchangeIcon: _exchangeAlias,
  FavouriteStarNavIcon: _favouriteStar,
  ...plainIcons
} = iconModule

function FavouriteStarOn(props: IconProps): React.JSX.Element {
  return <FavouriteStarNavIcon {...props} isFavourite />
}

function FavouriteStarOff(props: IconProps): React.JSX.Element {
  return <FavouriteStarNavIcon {...props} isFavourite={false} />
}

const allIcons: ReadonlyArray<
  readonly [string, (props: IconProps) => React.JSX.Element]
> = [
  ...Record.toEntries(plainIcons),
  ['FavouriteStarNavIcon (on)', FavouriteStarOn],
  ['FavouriteStarNavIcon (off)', FavouriteStarOff],
]

function Demos(): React.JSX.Element {
  const theme = useTheme()
  const color = theme.foregroundPrimary.get()

  return (
    <XStack flexWrap="wrap" rowGap="$5">
      {pipe(
        allIcons,
        Array.map(([label, Icon]) => (
          <YStack
            key={label}
            width={ICON_TILE_WIDTH}
            alignItems="center"
            gap="$2"
            paddingHorizontal="$1"
          >
            <Icon size={getTokens().size.$7.val} color={color} />
            <Typography
              variant="micro"
              color="$foregroundSecondary"
              textAlign="center"
              maxWidth="100%"
            >
              {label}
            </Typography>
          </YStack>
        ))
      )}
    </XStack>
  )
}

export function IconsScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Icons" demos={Demos} />
}
